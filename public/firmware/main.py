"""
RoadSense Pico WH Firmware
Real-time road hazard detection and transmission to backend API

Hardware:
- Raspberry Pi Pico WH (RP2040 + WiFi)
- MPU6050 (6-axis IMU) on I2C0
- NEO-6M GPS on UART1
- Optional: Buzzer (GP3), RGB LEDs (GP6/7/8)

Data Flow:
1. Read accelerometer and gyroscope from MPU6050
2. Read GPS coordinates from NEO-6M
3. Analyze acceleration patterns for hazard detection
4. Classify severity (1-3)
5. Send to backend API: POST /api/hazards
"""

import machine
import time
import json
import network
import urequests
from mpu6050 import MPU6050
from gps_module import NEO6M

# ============================================================================
# CONFIGURATION - EDIT THESE VALUES
# ============================================================================

# WiFi credentials
WIFI_SSID = "YOUR_SSID"
WIFI_PASSWORD = "YOUR_PASSWORD"

# Backend API endpoint
API_URL = "https://your-domain.com/api/hazards"
# For local testing: "http://192.168.1.100:3000/api/hazards"

# Sensor configuration
ACCEL_SAMPLE_RATE = 100  # Hz
POTHOLE_THRESHOLD = 2.5  # g (acceleration magnitude)
ROUGH_ROAD_THRESHOLD = 1.2  # g (sustained vibration)
REPORT_INTERVAL = 5  # seconds between reports

# Severity thresholds
SEVERITY_MILD = 1.2  # g
SEVERITY_MODERATE = 2.0  # g
SEVERITY_DANGEROUS = 2.5  # g

# ============================================================================
# HARDWARE INITIALIZATION
# ============================================================================

# Initialize I2C for MPU6050 (I2C0: SDA=GP0, SCL=GP1)
i2c = machine.I2C(0, scl=machine.Pin(1), sda=machine.Pin(0), freq=400000)

# Initialize UART for GPS (UART1: TX=GP4, RX=GP5)
uart = machine.UART(1, 9600, tx=machine.Pin(4), rx=machine.Pin(5))

# Initialize sensors
mpu = None
gps = None

try:
    mpu = MPU6050(i2c)
    print("[INIT] MPU6050 initialized at 0x68")
except Exception as e:
    print(f"[ERROR] MPU6050 init failed: {e}")

try:
    gps = NEO6M(uart)
    print("[INIT] NEO-6M GPS initialized")
except Exception as e:
    print(f"[ERROR] GPS init failed: {e}")

# Initialize feedback components (optional)
buzzer = machine.Pin(3, machine.Pin.OUT)  # GP3
led_red = machine.Pin(6, machine.Pin.OUT)  # GP6 - Dangerous
led_green = machine.Pin(7, machine.Pin.OUT)  # GP7 - Mild
led_blue = machine.Pin(8, machine.Pin.OUT)  # GP8 - Moderate

# ============================================================================
# WIFI CONNECTION
# ============================================================================

def connect_wifi():
    """Connect to WiFi network."""
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    
    print(f"[WiFi] Connecting to '{WIFI_SSID}'...")
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)
    
    # Wait for connection (max 10 seconds)
    timeout = 10
    while timeout > 0:
        if wlan.isconnected():
            ip_config = wlan.ifconfig()
            print(f"[WiFi] Connected! IP: {ip_config[0]}")
            return True
        
        print(f"[WiFi] Waiting... ({timeout}s)")
        time.sleep(1)
        timeout -= 1
    
    print("[WiFi] Connection failed")
    return False

# ============================================================================
# HAZARD DETECTION & CLASSIFICATION
# ============================================================================

class HazardDetector:
    """Detects road hazards from accelerometer data."""
    
    def __init__(self):
        self.accel_history = []
        self.last_report_time = 0
        self.pothole_detected = False
        self.rough_road_detected = False
    
    def classify_severity(self, accel_magnitude):
        """Classify hazard severity based on acceleration magnitude.
        
        Args:
            accel_magnitude: Acceleration magnitude in m/s²
            
        Returns:
            Severity level: 1 (mild), 2 (moderate), 3 (dangerous)
        """
        if accel_magnitude < SEVERITY_MILD:
            return 1  # Mild
        elif accel_magnitude < SEVERITY_MODERATE:
            return 2  # Moderate
        else:
            return 3  # Dangerous
    
    def detect_pothole(self, accel_magnitude):
        """Detect pothole from sudden acceleration spike.
        
        Args:
            accel_magnitude: Acceleration magnitude in m/s²
            
        Returns:
            True if pothole detected, False otherwise
        """
        # Pothole: sudden spike in acceleration > threshold
        if accel_magnitude > POTHOLE_THRESHOLD:
            return True
        return False
    
    def detect_rough_road(self, accel_history):
        """Detect rough road from sustained vibration.
        
        Args:
            accel_history: List of recent acceleration readings
            
        Returns:
            True if rough road detected, False otherwise
        """
        if len(accel_history) < 10:
            return False
        
        # Calculate variance in recent acceleration readings
        mean = sum(accel_history) / len(accel_history)
        variance = sum((x - mean) ** 2 for x in accel_history) / len(accel_history)
        std_dev = variance ** 0.5
        
        # Rough road: high variance in acceleration over time
        if std_dev > ROUGH_ROAD_THRESHOLD:
            return True
        return False
    
    def update(self, accel_magnitude):
        """Update detector with new acceleration reading.
        
        Args:
            accel_magnitude: Acceleration magnitude in m/s²
        """
        # Keep history of last 50 readings (0.5 seconds at 100Hz)
        self.accel_history.append(accel_magnitude)
        if len(self.accel_history) > 50:
            self.accel_history.pop(0)
        
        # Check for pothole
        self.pothole_detected = self.detect_pothole(accel_magnitude)
        
        # Check for rough road
        self.rough_road_detected = self.detect_rough_road(self.accel_history)
    
    def get_hazard(self):
        """Get detected hazard (if any).
        
        Returns:
            Tuple of (hazard_type, severity) or None if no hazard
        """
        if self.pothole_detected:
            accel_mag = self.accel_history[-1] if self.accel_history else 0
            severity = self.classify_severity(accel_mag)
            return ("pothole", severity)
        elif self.rough_road_detected:
            # For rough roads, use average acceleration for severity
            avg_accel = sum(self.accel_history) / len(self.accel_history) if self.accel_history else 0
            severity = self.classify_severity(avg_accel)
            return ("rough", severity)
        return None

detector = HazardDetector()

# ============================================================================
# DATA TRANSMISSION
# ============================================================================

def send_hazard_report(latitude, longitude, severity, hazard_type):
    """Send hazard report to backend API.
    
    Args:
        latitude: Latitude coordinate (string)
        longitude: Longitude coordinate (string)
        severity: Severity level (1-3)
        hazard_type: Type of hazard ("pothole" or "rough")
        
    Returns:
        True if successful, False otherwise
    """
    try:
        payload = {
            "latitude": str(latitude),
            "longitude": str(longitude),
            "severity": severity,
            "type": hazard_type,
            "timestamp": time.time()
        }
        
        headers = {"Content-Type": "application/json"}
        
        print(f"[API] Sending {hazard_type} (severity {severity}) at {latitude:.4f}, {longitude:.4f}")
        response = urequests.post(
            API_URL,
            json=payload,
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            print(f"[API] Success! Status: {response.status_code}")
            return True
        else:
            print(f"[API] Error {response.status_code}")
            return False
    
    except Exception as e:
        print(f"[API] Failed to send: {e}")
        return False
    
    finally:
        try:
            response.close()
        except:
            pass

# ============================================================================
# FEEDBACK FUNCTIONS
# ============================================================================

def set_led_by_severity(severity):
    """Set LED color based on severity.
    
    Args:
        severity: Severity level (1-3)
    """
    led_red.off()
    led_green.off()
    led_blue.off()
    
    if severity == 1:
        led_green.on()  # Green - Mild
    elif severity == 2:
        led_blue.on()  # Blue - Moderate
    elif severity == 3:
        led_red.on()  # Red - Dangerous

def beep_buzzer(count=1, duration=100):
    """Beep buzzer n times.
    
    Args:
        count: Number of beeps
        duration: Duration of each beep in milliseconds
    """
    for _ in range(count):
        buzzer.on()
        time.sleep(duration / 1000.0)
        buzzer.off()
        time.sleep(100 / 1000.0)

# ============================================================================
# MAIN LOOP
# ============================================================================

def main():
    """Main sensor reading and hazard detection loop."""
    print("\n" + "="*60)
    print("RoadSense Firmware v1.0")
    print("="*60)
    print(f"[CONFIG] API: {API_URL}")
    print(f"[CONFIG] Pothole Threshold: {POTHOLE_THRESHOLD}g")
    print(f"[CONFIG] Rough Road Threshold: {ROUGH_ROAD_THRESHOLD}g")
    print("="*60 + "\n")
    
    # Connect to WiFi
    wifi_connected = connect_wifi()
    if not wifi_connected:
        print("[WARN] WiFi connection failed, will retry in main loop...")
    
    # GPS warm-up (wait for first fix)
    print("[GPS] Waiting for GPS fix (this may take 30-60 seconds)...")
    gps_ready = False
    gps_timeout = 120  # 2 minutes
    
    if gps:
        while gps_timeout > 0 and not gps_ready:
            try:
                if gps.update():
                    if gps.has_fix():
                        pos = gps.get_position()
                        print(f"[GPS] Fix acquired! Satellites: {pos[3]}, Altitude: {pos[2]:.1f}m")
                        gps_ready = True
                        break
            except:
                pass
            
            time.sleep(1)
            gps_timeout -= 1
            if gps_timeout % 10 == 0:
                print(f"[GPS] Still waiting... ({gps_timeout}s)")
    
    if not gps_ready:
        print("[WARN] GPS fix not acquired, proceeding without GPS")
    
    print("[READY] Starting hazard detection loop\n")
    
    # Main loop
    last_report = 0
    reading_count = 0
    
    while True:
        try:
            # Read accelerometer
            if mpu:
                accel_mag = mpu.get_accel_magnitude()
                detector.update(accel_mag)
                reading_count += 1
            
            # Check for hazard
            hazard = detector.get_hazard()
            
            # Update GPS periodically
            if gps and reading_count % 10 == 0:
                try:
                    gps.update()
                except:
                    pass
            
            # Send report if hazard detected and enough time has passed
            if hazard and (time.time() - last_report) > REPORT_INTERVAL:
                hazard_type, severity = hazard
                
                # Get GPS position
                if gps and gps.has_fix():
                    pos = gps.get_position()
                    latitude, longitude, altitude, satellites = pos
                else:
                    # Fallback coordinates (Nairobi, Kenya)
                    latitude, longitude = 1.2921, 36.8219
                
                # Send to backend
                if send_hazard_report(latitude, longitude, severity, hazard_type):
                    # Feedback on successful report
                    set_led_by_severity(severity)
                    beep_buzzer(severity)  # Beep n times based on severity
                    last_report = time.time()
                    
                    # Reset detector
                    detector.accel_history.clear()
            
            # Sample at ~100Hz (10ms interval)
            time.sleep(0.01)
        
        except Exception as e:
            print(f"[ERROR] Main loop error: {e}")
            time.sleep(1)

# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[STOP] Firmware stopped by user")
    except Exception as e:
        print(f"[FATAL] {e}")

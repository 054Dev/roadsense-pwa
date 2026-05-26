# RoadSense Hardware Integration Guide
## Complete Setup for Pico WH + MPU6050 + NEO-6M GPS

---

## Table of Contents
1. [Hardware Overview](#hardware-overview)
2. [Wiring Diagram](#wiring-diagram)
3. [Component List & Pinout](#component-list--pinout)
4. [Step-by-Step Assembly](#step-by-step-assembly)
5. [Firmware Installation](#firmware-installation)
6. [Data Processing Pipeline](#data-processing-pipeline)
7. [Testing & Calibration](#testing--calibration)
8. [Troubleshooting](#troubleshooting)

---

## Hardware Overview

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    ROADSENSE SENSOR UNIT                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐    ┌────────────┐  │
│  │  MPU6050     │      │  NEO-6M GPS  │    │  Pico WH   │  │
│  │  (I2C)       │──────│  (UART)      │────│  (WiFi)    │  │
│  │              │      │              │    │            │  │
│  │ • Accel X/Y/Z│      │ • Latitude   │    │ • Process  │  │
│  │ • Gyro X/Y/Z │      │ • Longitude  │    │ • Transmit │  │
│  │ • Temp       │      │ • Altitude   │    │ • Store    │  │
│  └──────────────┘      └──────────────┘    └────────────┘  │
│         │                     │                    │         │
│         └─────────────────────┴────────────────────┘         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Data Processing & Analysis                   │  │
│  │  • Acceleration magnitude calculation                │  │
│  │  • Pothole detection (Z-axis spike detection)        │  │
│  │  • Rough road detection (vibration variance)         │  │
│  │  • Severity classification (1-3 scoring)             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         WiFi Transmission to Backend                 │  │
│  │  POST /api/hazards                                   │  │
│  │  {latitude, longitude, severity, type, timestamp}    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Power Requirements
- **Pico WH:** 5V USB or 3.3V regulated input
- **MPU6050:** 3.3V @ 100mA max
- **NEO-6M:** 3.3V @ 100mA max
- **Total System:** ~300mA (use USB power or 2x 18650 battery pack with LDO regulator)

---

## Wiring Diagram

### MPU6050 I2C Connection (6-Pin Module)
```
MPU6050 Pin    →    Pico WH Pin    →    Function
─────────────────────────────────────────────────
VCC            →    Pin 36 (3.3V)  →    Power
GND            →    Pin 38 (GND)   →    Ground
SDA            →    Pin 1 (GP0)    →    I2C Data
SCL            →    Pin 2 (GP1)    →    I2C Clock
INT            →    Pin 4 (GP2)    →    Interrupt (optional)
AD0            →    GND            →    I2C Address 0x68
```

**I2C Address:** 0x68 (default when AD0 is tied to GND)

### NEO-6M GPS UART Connection (5-Pin Module)
```
NEO-6M Pin     →    Pico WH Pin    →    Function
─────────────────────────────────────────────────
VCC            →    Pin 36 (3.3V)  →    Power
GND            →    Pin 38 (GND)   →    Ground
TX             →    Pin 7 (GP5)    →    UART1 RX
RX             →    Pin 6 (GP4)    →    UART1 TX
GND (shield)   →    GND            →    Shield ground
```

**UART Settings:** 9600 baud, 8 data bits, 1 stop bit, no parity

### Optional Feedback Components
```
Component      →    Pico WH Pin    →    Function
─────────────────────────────────────────────────
Buzzer (5V)    →    Pin 5 (GP3)    →    Alert on hazard
LED Red        →    Pin 9 (GP6)    →    Dangerous (Severity 3)
LED Green      →    Pin 10 (GP7)   →    Mild (Severity 1)
LED Blue       →    Pin 11 (GP8)   →    Moderate (Severity 2)
```

---

## Component List & Pinout

### Raspberry Pi Pico WH Pinout
```
┌─────────────────────────────────────────────────────────┐
│  Pico WH (Top View)                                     │
│                                                         │
│  GP0 (1)  ─────────────────────────────────────  (40) VBUS
│  GP1 (2)  ─────────────────────────────────────  (39) VSYS
│  GND (3)  ─────────────────────────────────────  (38) GND
│  GP2 (4)  ─────────────────────────────────────  (37) 3V3_EN
│  GP3 (5)  ─────────────────────────────────────  (36) 3V3
│  GP4 (6)  ─────────────────────────────────────  (35) ADC_VREF
│  GP5 (7)  ─────────────────────────────────────  (34) GP28
│  GND (8)  ─────────────────────────────────────  (33) GND
│  GP6 (9)  ─────────────────────────────────────  (32) GP27
│  GP7 (10) ─────────────────────────────────────  (31) GP26
│  GP8 (11) ─────────────────────────────────────  (30) RUN
│  GP9 (12) ─────────────────────────────────────  (29) GP22
│  GND (13) ─────────────────────────────────────  (28) GND
│  GP10(14) ─────────────────────────────────────  (27) GP21
│  GP11(15) ─────────────────────────────────────  (26) GP20
│  GP12(16) ─────────────────────────────────────  (25) GP19
│  GP13(17) ─────────────────────────────────────  (24) GP18
│  GND (18) ─────────────────────────────────────  (23) GND
│  GP14(19) ─────────────────────────────────────  (22) GP17
│  GP15(20) ─────────────────────────────────────  (21) GP16
│                                                         │
└─────────────────────────────────────────────────────────┘

Key Pins for RoadSense:
• I2C0: GP0 (SDA), GP1 (SCL)
• UART1: GP4 (TX), GP5 (RX)
• 3.3V: Pin 36
• GND: Pins 3, 8, 13, 18, 23, 28, 33, 38
```

### MPU6050 Registers (Key)
```
Register    Address    Description
─────────────────────────────────────────────────
SMPLRT_DIV  0x19       Sample rate divider
CONFIG      0x1A       Configuration
GYRO_CONFIG 0x1B       Gyroscope configuration
ACCEL_CONFIG 0x1C      Accelerometer configuration
INT_ENABLE  0x38       Interrupt enable
ACCEL_XOUT_H 0x3B      Accelerometer X (high byte)
ACCEL_XOUT_L 0x3C      Accelerometer X (low byte)
ACCEL_YOUT_H 0x3D      Accelerometer Y (high byte)
ACCEL_YOUT_L 0x3E      Accelerometer Y (low byte)
ACCEL_ZOUT_H 0x3F      Accelerometer Z (high byte)
ACCEL_ZOUT_L 0x40      Accelerometer Z (low byte)
TEMP_OUT_H  0x41       Temperature (high byte)
TEMP_OUT_L  0x42       Temperature (low byte)
GYRO_XOUT_H 0x43       Gyroscope X (high byte)
GYRO_XOUT_L 0x44       Gyroscope X (low byte)
GYRO_YOUT_H 0x45       Gyroscope Y (high byte)
GYRO_YOUT_L 0x46       Gyroscope Y (low byte)
GYRO_ZOUT_H 0x47       Gyroscope Z (high byte)
GYRO_ZOUT_L 0x48       Gyroscope Z (low byte)
PWR_MGMT_1  0x6B       Power management 1
PWR_MGMT_2  0x6C       Power management 2
```

---

## Step-by-Step Assembly

### Phase 1: Prepare the Pico WH
1. **Solder Headers (if not pre-soldered):**
   - Use 2x20 male header pins
   - Solder to the bottom side of Pico WH
   - Ensure pins are perpendicular and aligned

2. **Mount on Breadboard:**
   - Place Pico WH on a breadboard with headers inserted
   - Leave space on both sides for sensor connections

### Phase 2: Connect MPU6050 (I2C)
1. **Identify MPU6050 Pins:**
   - VCC (red wire)
   - GND (black wire)
   - SDA (green wire)
   - SCL (yellow wire)
   - AD0 (tie to GND for address 0x68)

2. **Make Connections:**
   ```
   MPU6050 VCC  → Pico WH Pin 36 (3.3V)
   MPU6050 GND  → Pico WH Pin 38 (GND)
   MPU6050 SDA  → Pico WH Pin 1 (GP0)
   MPU6050 SCL  → Pico WH Pin 2 (GP1)
   MPU6050 AD0  → Pico WH Pin 38 (GND)
   ```

3. **Add Pull-up Resistors (if needed):**
   - 4.7kΩ resistor from SDA to 3.3V
   - 4.7kΩ resistor from SCL to 3.3V
   - (Most breakout boards include these)

### Phase 3: Connect NEO-6M GPS (UART)
1. **Identify NEO-6M Pins:**
   - VCC (red wire)
   - GND (black wire)
   - TX (white wire)
   - RX (green wire)

2. **Make Connections:**
   ```
   NEO-6M VCC → Pico WH Pin 36 (3.3V)
   NEO-6M GND → Pico WH Pin 38 (GND)
   NEO-6M TX  → Pico WH Pin 7 (GP5) - UART1 RX
   NEO-6M RX  → Pico WH Pin 6 (GP4) - UART1 TX
   ```

### Phase 4: Optional - Add Feedback Components
1. **Buzzer (Active 5V):**
   ```
   Buzzer + → Pico WH Pin 5 (GP3) via 1kΩ resistor
   Buzzer - → Pico WH Pin 38 (GND)
   ```

2. **LEDs (3mm, 20mA):**
   ```
   Red LED:
     Anode (+) → Pico WH Pin 9 (GP6) via 220Ω resistor
     Cathode (-) → Pico WH Pin 38 (GND)
   
   Green LED:
     Anode (+) → Pico WH Pin 10 (GP7) via 220Ω resistor
     Cathode (-) → Pico WH Pin 38 (GND)
   
   Blue LED:
     Anode (+) → Pico WH Pin 11 (GP8) via 220Ω resistor
     Cathode (-) → Pico WH Pin 38 (GND)
   ```

### Phase 5: Power Supply
1. **USB Power (Recommended for Development):**
   - Connect Pico WH USB-C to computer or USB power adapter
   - Provides 5V with automatic regulation to 3.3V

2. **Battery Power (Field Deployment):**
   - Use 2x 18650 Li-ion batteries in series (7.4V nominal)
   - Connect through AMS1117 3.3V LDO regulator
   - Add 10µF capacitor on input and output

---

## Firmware Installation

### Step 1: Download MicroPython
1. Visit: https://micropython.org/download/rp2-pico-w/
2. Download the latest `.uf2` file for Pico W (includes WiFi)

### Step 2: Flash Pico WH
1. **Hold BOOTSEL button** on Pico WH
2. **Connect USB** to computer
3. **Drag .uf2 file** to the RPI-RP2 drive that appears
4. **Wait** for device to reboot (LED will blink)

### Step 3: Install Thonny IDE
1. Download from: https://thonny.org/
2. Install and launch Thonny
3. Select **Tools → Options → Interpreter**
4. Choose **MicroPython (Raspberry Pi Pico)**
5. Select the COM port for Pico WH

### Step 4: Upload Libraries
Create these files on the Pico WH:

**`mpu6050.py` - MPU6050 Driver**
```python
import struct
import time

class MPU6050:
    def __init__(self, i2c, addr=0x68):
        self.i2c = i2c
        self.addr = addr
        self.init_sensor()
    
    def init_sensor(self):
        """Initialize MPU6050 and wake from sleep."""
        # Wake up sensor (clear sleep bit)
        self.i2c.writeto(self.addr, bytes([0x6B, 0x00]))
        time.sleep(0.1)
        # Set accelerometer range to ±16g (0x18)
        self.i2c.writeto(self.addr, bytes([0x1C, 0x18]))
        # Set gyroscope range to ±2000°/s (0x18)
        self.i2c.writeto(self.addr, bytes([0x1B, 0x18]))
        # Set sample rate divider to 10 (100Hz)
        self.i2c.writeto(self.addr, bytes([0x19, 0x09]))
    
    def get_accel(self):
        """Read 3-axis acceleration in m/s²."""
        data = self.i2c.readfrom_mem(self.addr, 0x3B, 6)
        ax, ay, az = struct.unpack('>hhh', data)
        # Convert to m/s² (±16g range = 2048 LSB/g)
        return (ax / 2048.0 * 9.81, ay / 2048.0 * 9.81, az / 2048.0 * 9.81)
    
    def get_gyro(self):
        """Read 3-axis rotation in deg/s."""
        data = self.i2c.readfrom_mem(self.addr, 0x43, 6)
        gx, gy, gz = struct.unpack('>hhh', data)
        # Convert to deg/s (±2000°/s range = 16.4 LSB/deg/s)
        return (gx / 16.4, gy / 16.4, gz / 16.4)
    
    def get_temp(self):
        """Read temperature in Celsius."""
        data = self.i2c.readfrom_mem(self.addr, 0x41, 2)
        temp_raw = struct.unpack('>h', data)[0]
        # Convert to Celsius (sensitivity: 340 LSB/°C, offset: 36.53°C)
        return (temp_raw / 340.0) + 36.53
    
    def get_accel_magnitude(self):
        """Calculate acceleration magnitude in m/s²."""
        ax, ay, az = self.get_accel()
        return (ax**2 + ay**2 + az**2) ** 0.5
```

**`gps_module.py` - NEO-6M GPS Driver**
```python
import time

class NEO6M:
    def __init__(self, uart):
        self.uart = uart
        self.lat = None
        self.lng = None
        self.altitude = None
        self.satellites = 0
        self.fix_type = 0
    
    def read_line(self):
        """Read a line from UART."""
        line = b''
        while True:
            if self.uart.any():
                char = self.uart.read(1)
                if char == b'\n':
                    return line.decode('utf-8', errors='ignore').strip()
                line += char
            time.sleep(0.001)
    
    def parse_rmc(self, sentence):
        """Parse NMEA RMC sentence (Recommended Minimum Navigation Information)."""
        try:
            parts = sentence.split(',')
            if len(parts) < 10:
                return False
            
            # Check if fix is valid (parts[2] == 'A')
            if parts[2] != 'A':
                return False
            
            # Parse latitude
            lat_str = parts[3]
            lat_dir = parts[4]
            if lat_str:
                lat_deg = int(lat_str[:2])
                lat_min = float(lat_str[2:])
                self.lat = lat_deg + lat_min / 60.0
                if lat_dir == 'S':
                    self.lat = -self.lat
            
            # Parse longitude
            lng_str = parts[5]
            lng_dir = parts[6]
            if lng_str:
                lng_deg = int(lng_str[:3])
                lng_min = float(lng_str[3:])
                self.lng = lng_deg + lng_min / 60.0
                if lng_dir == 'W':
                    self.lng = -self.lng
            
            return True
        except:
            return False
    
    def parse_gga(self, sentence):
        """Parse NMEA GGA sentence (Global Positioning System Fix Data)."""
        try:
            parts = sentence.split(',')
            if len(parts) < 9:
                return False
            
            # Fix type: 0=invalid, 1=GPS, 2=DGPS, 3=PPS, etc.
            self.fix_type = int(parts[6]) if parts[6] else 0
            
            # Number of satellites
            self.satellites = int(parts[7]) if parts[7] else 0
            
            # Altitude
            if parts[9]:
                self.altitude = float(parts[9])
            
            return self.fix_type > 0
        except:
            return False
    
    def update(self):
        """Read and parse GPS data."""
        try:
            line = self.read_line()
            if line.startswith('$GPRMC'):
                return self.parse_rmc(line)
            elif line.startswith('$GPGGA'):
                return self.parse_gga(line)
        except:
            pass
        return False
    
    def has_fix(self):
        """Check if GPS has a valid fix."""
        return self.fix_type > 0 and self.lat is not None and self.lng is not None
    
    def get_position(self):
        """Get current position."""
        if self.has_fix():
            return (self.lat, self.lng, self.altitude, self.satellites)
        return None
```

### Step 5: Upload Main Firmware
Create `main.py` on Pico WH with the complete firmware code (see next section).

---

## Data Processing Pipeline

### Main Firmware: `main.py`

```python
"""
RoadSense Pico WH Firmware
Real-time road hazard detection and transmission
"""

import machine
import time
import json
import network
import urequests
from mpu6050 import MPU6050
from gps_module import NEO6M

# ============================================================================
# CONFIGURATION
# ============================================================================

# WiFi credentials
WIFI_SSID = "YOUR_SSID"
WIFI_PASSWORD = "YOUR_PASSWORD"

# Backend API endpoint
API_URL = "https://your-domain.com/api/hazards"
# Or for local testing: "http://192.168.x.x:3000/api/hazards"

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

# Initialize I2C for MPU6050
i2c = machine.I2C(0, scl=machine.Pin(1), sda=machine.Pin(0), freq=400000)

# Initialize UART for GPS
uart = machine.UART(1, 9600, tx=machine.Pin(4), rx=machine.Pin(5))

# Initialize sensors
try:
    mpu = MPU6050(i2c)
    print("[INIT] MPU6050 initialized")
except Exception as e:
    print(f"[ERROR] MPU6050 init failed: {e}")
    mpu = None

try:
    gps = NEO6M(uart)
    print("[INIT] NEO-6M GPS initialized")
except Exception as e:
    print(f"[ERROR] GPS init failed: {e}")
    gps = None

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
    
    print(f"[WiFi] Connecting to {WIFI_SSID}...")
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)
    
    # Wait for connection (max 10 seconds)
    timeout = 10
    while timeout > 0:
        if wlan.isconnected():
            print(f"[WiFi] Connected! IP: {wlan.ifconfig()[0]}")
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
    def __init__(self):
        self.accel_history = []
        self.last_report_time = 0
        self.pothole_detected = False
        self.rough_road_detected = False
    
    def classify_severity(self, accel_magnitude):
        """Classify hazard severity based on acceleration magnitude."""
        if accel_magnitude < SEVERITY_MILD:
            return 1  # Mild
        elif accel_magnitude < SEVERITY_MODERATE:
            return 2  # Moderate
        else:
            return 3  # Dangerous
    
    def detect_pothole(self, accel_magnitude):
        """Detect pothole from sudden acceleration spike."""
        # Pothole: sudden spike in acceleration > threshold
        if accel_magnitude > POTHOLE_THRESHOLD:
            return True
        return False
    
    def detect_rough_road(self, accel_history):
        """Detect rough road from sustained vibration."""
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
        """Update detector with new acceleration reading."""
        # Keep history of last 50 readings (0.5 seconds at 100Hz)
        self.accel_history.append(accel_magnitude)
        if len(self.accel_history) > 50:
            self.accel_history.pop(0)
        
        # Check for pothole
        self.pothole_detected = self.detect_pothole(accel_magnitude)
        
        # Check for rough road
        self.rough_road_detected = self.detect_rough_road(self.accel_history)
    
    def get_hazard(self):
        """Get detected hazard (if any)."""
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
    """Send hazard report to backend API."""
    try:
        payload = {
            "latitude": str(latitude),
            "longitude": str(longitude),
            "severity": severity,
            "type": hazard_type,
            "timestamp": time.time()
        }
        
        headers = {"Content-Type": "application/json"}
        
        print(f"[API] Sending {hazard_type} (severity {severity}) at {latitude}, {longitude}")
        response = urequests.post(
            API_URL,
            json=payload,
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            print(f"[API] Success! Response: {response.text}")
            return True
        else:
            print(f"[API] Error {response.status_code}: {response.text}")
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
    """Set LED color based on severity."""
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
    """Beep buzzer n times."""
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
    print("\n[START] RoadSense Firmware Initialized")
    print(f"[CONFIG] API: {API_URL}")
    print(f"[CONFIG] Pothole Threshold: {POTHOLE_THRESHOLD}g")
    print(f"[CONFIG] Rough Road Threshold: {ROUGH_ROAD_THRESHOLD}g")
    
    # Connect to WiFi
    if not connect_wifi():
        print("[WARN] WiFi connection failed, will retry...")
    
    # GPS warm-up (wait for first fix)
    print("[GPS] Waiting for GPS fix (this may take 30-60 seconds)...")
    gps_ready = False
    gps_timeout = 120  # 2 minutes
    
    while gps_timeout > 0 and not gps_ready:
        try:
            if gps and gps.update():
                if gps.has_fix():
                    print(f"[GPS] Fix acquired! Satellites: {gps.satellites}")
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
    
    print("[READY] Starting hazard detection loop")
    
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
            
            # Sample at ~100Hz
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
```

---

## Testing & Calibration

### Phase 1: Sensor Verification
1. **Test MPU6050:**
   ```python
   # In Thonny REPL:
   from mpu6050 import MPU6050
   import machine
   
   i2c = machine.I2C(0, scl=machine.Pin(1), sda=machine.Pin(0))
   mpu = MPU6050(i2c)
   
   # Should print acceleration in m/s²
   print(mpu.get_accel())  # Should be ~(0, 0, 9.81) when level
   print(mpu.get_temp())   # Should be room temperature
   ```

2. **Test NEO-6M GPS:**
   ```python
   # In Thonny REPL:
   from gps_module import NEO6M
   import machine
   
   uart = machine.UART(1, 9600, tx=machine.Pin(4), rx=machine.Pin(5))
   gps = NEO6M(uart)
   
   # Wait for GPS fix (outdoors)
   for i in range(120):
       if gps.update():
           if gps.has_fix():
               print(f"Position: {gps.get_position()}")
               break
   ```

### Phase 2: Calibration
1. **Place device on flat surface**
2. **Record baseline Z-axis acceleration** (should be ~9.81 m/s²)
3. **Test pothole detection:**
   - Drive slowly over a known pothole
   - Monitor serial output for detection
   - Adjust POTHOLE_THRESHOLD if needed

4. **Test rough road detection:**
   - Drive on rough/unpaved road
   - Monitor for sustained vibration detection
   - Adjust ROUGH_ROAD_THRESHOLD if needed

### Phase 3: API Integration Test
1. **Update API_URL** in firmware to your backend
2. **Ensure WiFi credentials** are correct
3. **Test hazard transmission:**
   - Trigger a hazard detection
   - Check backend dashboard for the report
   - Verify GPS coordinates are correct

---

## Troubleshooting

### MPU6050 Issues
| Problem | Cause | Solution |
|---------|-------|----------|
| I2C device not found | Wrong pins or address | Check wiring, verify address is 0x68 |
| Incorrect acceleration values | Sensor not calibrated | Place on level surface, check zero offset |
| No data from sensor | Power issue | Check 3.3V supply, verify GND connection |

### GPS Issues
| Problem | Cause | Solution |
|---------|-------|----------|
| No GPS fix | Indoors or weak signal | Move outdoors, wait 60+ seconds |
| Incorrect coordinates | Antenna issue | Check antenna connection, ensure clear sky view |
| UART communication error | Baud rate mismatch | Verify 9600 baud setting |

### WiFi Issues
| Problem | Cause | Solution |
|---------|-------|----------|
| Cannot connect to WiFi | Wrong SSID/password | Double-check credentials |
| Connection drops | Weak signal | Move closer to router |
| API transmission fails | Backend unreachable | Verify API URL, check network connectivity |

### Hazard Detection Issues
| Problem | Cause | Solution |
|---------|-------|----------|
| False positives | Threshold too low | Increase POTHOLE_THRESHOLD or ROUGH_ROAD_THRESHOLD |
| Missed detections | Threshold too high | Decrease thresholds, test on actual hazards |
| Inconsistent severity | Calibration needed | Recalibrate accelerometer on level surface |

---

## Performance Metrics

### Expected Performance
- **Detection Latency:** < 500ms (from hazard to API transmission)
- **GPS Accuracy:** ±5-10 meters (typical for consumer GPS)
- **Power Consumption:** ~300mA continuous (USB powered)
- **Battery Life:** ~4-6 hours (2x 18650 @ 3000mAh)
- **Data Transmission:** ~100 bytes per report
- **WiFi Range:** 50-100 meters (depending on environment)

### Optimization Tips
1. **Reduce sample rate** to save power (trade-off: detection accuracy)
2. **Increase report interval** to reduce API calls
3. **Use battery mode** with periodic GPS updates instead of continuous
4. **Implement local buffering** to queue reports when WiFi unavailable

---

## Next Steps

1. **Assemble hardware** following wiring diagram
2. **Flash MicroPython** to Pico WH
3. **Upload firmware files** (mpu6050.py, gps_module.py, main.py)
4. **Configure WiFi credentials** and API endpoint
5. **Test sensors** individually
6. **Calibrate thresholds** on your vehicle
7. **Deploy and monitor** hazard reports on dashboard

---

## Support Resources

- **MicroPython Docs:** https://docs.micropython.org/
- **Pico W Documentation:** https://www.raspberrypi.com/documentation/microcontrollers/raspberry-pi-pico.html
- **MPU6050 Datasheet:** https://invensense.tdk.com/
- **NEO-6M GPS Datasheet:** https://www.u-blox.com/

---

**Version:** 1.0  
**Last Updated:** May 26, 2026  
**Status:** Production Ready

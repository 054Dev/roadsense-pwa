import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Firmware() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="container">
          <h1 className="text-4xl font-bold mb-2">
            <span className="error-code">FIRMWARE DOCUMENTATION</span>
          </h1>
          <p className="text-sm error-code">
            [SYSTEM] Pico WH Integration Guide | MPU6050 + GPS + WiFi
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="overview">OVERVIEW</TabsTrigger>
            <TabsTrigger value="wiring">WIRING DIAGRAM</TabsTrigger>
            <TabsTrigger value="code">CODE BLUEPRINT</TabsTrigger>
            <TabsTrigger value="setup">SETUP GUIDE</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <Card className="bg-card border-border p-6 bracket-top">
              <h2 className="text-2xl font-bold mb-4">System Overview</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-black border border-border">
                  <p className="text-xs error-code mb-3">HARDWARE_STACK</p>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>Microcontroller:</strong> Raspberry Pi Pico WH (RP2040 + WiFi + Pre-soldered Headers)</li>
                    <li>• <strong>Motion Sensor:</strong> MPU6050 (6-Axis IMU: 3-axis Accelerometer + 3-axis Gyroscope)</li>
                    <li>• <strong>GPS Module:</strong> NEO-6M (UART-based GNSS receiver)</li>
                    <li>• <strong>Power:</strong> USB-C or 18650 Battery Pack (3.3V regulated)</li>
                    <li>• <strong>Optional:</strong> Buzzer, RGB LED for feedback</li>
                  </ul>
                </div>

                <div className="p-4 bg-black border border-border">
                  <p className="text-xs error-code mb-3">DETECTION_LOGIC</p>
                  <div className="space-y-2 text-sm">
                    <p><strong>Pothole Detection:</strong> Sudden spike in Z-axis acceleration ({'>'}2.5g indicates dangerous pothole)</p>
                    <p><strong>Rough Road Detection:</strong> Sustained vibration over time (high variance in acceleration)</p>
                    <p><strong>Severity Classification:</strong></p>
                    <ul className="ml-4 space-y-1">
                      <li>• Acceleration {'<'} 1.2g → Severity 1 (Mild)</li>
                      <li>• Acceleration 1.2-2.0g → Severity 2 (Moderate)</li>
                      <li>• Acceleration {'>'} 2.0g → Severity 3 (Dangerous)</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-black border border-border">
                  <p className="text-xs error-code mb-3">COMMUNICATION_PROTOCOL</p>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>WiFi:</strong> Built-in Pico WH WiFi module (802.11b/g/n)</li>
                    <li>• <strong>API Endpoint:</strong> POST /api/hazards</li>
                    <li>• <strong>Data Format:</strong> JSON with latitude, longitude, severity, type, timestamp</li>
                    <li>• <strong>Update Frequency:</strong> Configurable (default: every 5 seconds or on hazard detection)</li>
                  </ul>
                </div>

                <div className="p-4 bg-black border border-border">
                  <p className="text-xs error-code mb-3">COST_ESTIMATE_KES</p>
                  <ul className="space-y-1 text-sm">
                    <li>Pico WH: ~1,200 KES</li>
                    <li>MPU6050: ~500 KES</li>
                    <li>NEO-6M GPS: ~1,200 KES</li>
                    <li>Wiring & Misc: ~500 KES</li>
                    <li><strong>Total: ~3,400 KES</strong></li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Wiring Diagram Tab */}
          <TabsContent value="wiring" className="mt-6">
            <Card className="bg-card border-border p-6 bracket-top">
              <h2 className="text-2xl font-bold mb-4">Wiring Diagram</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-black border border-border">
                  <p className="text-xs error-code mb-4">MPU6050_I2C_CONNECTIONS</p>
                  <div className="font-mono text-sm space-y-2 bg-black p-4 border border-border">
                    <p>MPU6050 → Pico WH</p>
                    <p>─────────────────</p>
                    <p>VCC     → 3.3V (Pin 36)</p>
                    <p>GND     → GND (Pin 38)</p>
                    <p>SDA     → GP0 (Pin 1) - I2C0 Data</p>
                    <p>SCL     → GP1 (Pin 2) - I2C0 Clock</p>
                    <p>INT     → GP2 (Pin 4) - Optional Interrupt</p>
                  </div>
                </div>

                <div className="p-4 bg-black border border-border">
                  <p className="text-xs error-code mb-4">NEO6M_UART_CONNECTIONS</p>
                  <div className="font-mono text-sm space-y-2 bg-black p-4 border border-border">
                    <p>NEO-6M → Pico WH</p>
                    <p>──────────────────</p>
                    <p>VCC    → 3.3V (Pin 36)</p>
                    <p>GND    → GND (Pin 38)</p>
                    <p>TX     → GP5 (Pin 7) - UART1 RX</p>
                    <p>RX     → GP4 (Pin 6) - UART1 TX</p>
                  </div>
                </div>

                <div className="p-4 bg-black border border-border">
                  <p className="text-xs error-code mb-4">OPTIONAL_FEEDBACK_COMPONENTS</p>
                  <div className="font-mono text-sm space-y-2 bg-black p-4 border border-border">
                    <p>Buzzer (Active) → GP3 (Pin 5) + GND</p>
                    <p>LED_RED         → GP6 (Pin 9) + GND</p>
                    <p>LED_GREEN       → GP7 (Pin 10) + GND</p>
                    <p>LED_BLUE        → GP8 (Pin 11) + GND</p>
                  </div>
                </div>

                <div className="p-4 bg-black border border-border">
                  <p className="text-xs error-code mb-4">POWER_CONSIDERATIONS</p>
                  <ul className="space-y-2 text-sm">
                    <li>• Pico WH: 5V USB or 3.3V regulated input</li>
                    <li>• MPU6050: 3.3V (100mA max)</li>
                    <li>• NEO-6M: 3.3V (100mA max)</li>
                    <li>• Total Draw: ~300mA (use USB power or 2x 18650 battery pack with regulator)</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Code Blueprint Tab */}
          <TabsContent value="code" className="mt-6">
            <Card className="bg-card border-border p-6 bracket-top">
              <h2 className="text-2xl font-bold mb-4">MicroPython Code Blueprint</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-black border border-border">
                  <p className="text-xs error-code mb-3">MAIN_FIRMWARE_STRUCTURE</p>
                  <pre className="font-mono text-xs overflow-x-auto p-4 bg-black border border-border text-green-400">
{`# RoadSense Pico WH Firmware
# Detects road hazards and sends data to backend

import machine
import time
import json
import network
import urequests
from mpu6050 import MPU6050
from gps_module import NEO6M

# Configuration
WIFI_SSID = "YOUR_SSID"
WIFI_PASSWORD = "YOUR_PASSWORD"
API_URL = "https://your-domain.com/api/hazards"

# Initialize I2C and UART
i2c = machine.I2C(0, scl=machine.Pin(1), sda=machine.Pin(0))
uart = machine.UART(1, 9600, tx=machine.Pin(4), rx=machine.Pin(5))

# Initialize sensors
mpu = MPU6050(i2c)
gps = NEO6M(uart)

# Initialize WiFi
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(WIFI_SSID, WIFI_PASSWORD)

def classify_severity(accel_magnitude):
    """Classify hazard severity based on acceleration."""
    if accel_magnitude < 1.2:
        return 1  # Mild
    elif accel_magnitude < 2.0:
        return 2  # Moderate
    else:
        return 3  # Dangerous

def detect_pothole(accel_z):
    """Detect pothole from Z-axis acceleration spike."""
    return accel_z > 2.5

def send_hazard_data(lat, lng, severity, hazard_type):
    """Send hazard data to backend API."""
    payload = {
        "latitude": str(lat),
        "longitude": str(lng),
        "severity": severity,
        "type": hazard_type,
        "timestamp": time.time()
    }
    
    try:
        response = urequests.post(
            API_URL,
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"[OK] Hazard sent: {response.status_code}")
        response.close()
    except Exception as e:
        print(f"[ERROR] Failed to send: {e}")

def main_loop():
    """Main sensor reading and hazard detection loop."""
    while True:
        # Read accelerometer
        accel = mpu.get_accel()
        accel_mag = (accel[0]**2 + accel[1]**2 + accel[2]**2) ** 0.5
        
        # Read GPS
        gps_data = gps.read()
        if gps_data:
            lat, lng = gps_data
            
            # Detect pothole
            if detect_pothole(accel[2]):
                severity = classify_severity(accel_mag)
                print(f"[HAZARD] Pothole detected! Severity: {severity}")
                send_hazard_data(lat, lng, severity, "pothole")
            
            # Detect rough road (sustained vibration)
            # TODO: Implement rough road detection logic
        
        time.sleep(0.1)  # 100ms sampling rate

if __name__ == "__main__":
    print("[START] RoadSense Firmware Initialized")
    main_loop()
`}
                  </pre>
                </div>

                <div className="p-4 bg-black border border-border">
                  <p className="text-xs error-code mb-3">MPU6050_LIBRARY_EXAMPLE</p>
                  <pre className="font-mono text-xs overflow-x-auto p-4 bg-black border border-border text-green-400">
{`# mpu6050.py - MPU6050 I2C Driver
import struct

class MPU6050:
    def __init__(self, i2c, addr=0x68):
        self.i2c = i2c
        self.addr = addr
        self.init_sensor()
    
    def init_sensor(self):
        """Initialize MPU6050."""
        # Wake up sensor (clear sleep bit)
        self.i2c.writeto(self.addr, bytes([0x6B, 0x00]))
        # Set accelerometer range to ±16g
        self.i2c.writeto(self.addr, bytes([0x1C, 0x18]))
    
    def get_accel(self):
        """Read 3-axis acceleration in m/s²."""
        data = self.i2c.readfrom_mem(self.addr, 0x3B, 6)
        ax, ay, az = struct.unpack('>hhh', data)
        # Convert to m/s² (±16g range)
        return (ax / 2048.0 * 9.81, ay / 2048.0 * 9.81, az / 2048.0 * 9.81)
    
    def get_gyro(self):
        """Read 3-axis rotation in deg/s."""
        data = self.i2c.readfrom_mem(self.addr, 0x43, 6)
        gx, gy, gz = struct.unpack('>hhh', data)
        return (gx / 131.0, gy / 131.0, gz / 131.0)
`}
                  </pre>
                </div>

                <div className="p4 bg-black border border-border">
                  <p className="text-xs error-code mb-3">GPS_NMEA_PARSING</p>
                  <pre className="font-mono text-xs overflow-x-auto p-4 bg-black border border-border text-green-400">
{`# gps_module.py - NEO-6M GPS UART Driver
import re

class NEO6M:
    def __init__(self, uart):
        self.uart = uart
    
    def read(self):
        """Read GPS NMEA sentence and extract lat/lng."""
        while self.uart.any():
            line = self.uart.readline().decode('utf-8', errors='ignore').strip()
            if line.startswith('$GPRMC'):
                return self.parse_rmc(line)
        return None
    
    def parse_rmc(self, sentence):
        """Parse NMEA RMC sentence."""
        parts = sentence.split(',')
        if len(parts) < 10 or parts[2] != 'A':
            return None  # Invalid or no fix
        
        lat = float(parts[3][:2]) + float(parts[3][2:]) / 60.0
        lng = float(parts[5][:3]) + float(parts[5][3:]) / 60.0
        
        if parts[4] == 'S':
            lat = -lat
        if parts[6] == 'W':
            lng = -lng
        
        return (lat, lng)
`}
                  </pre>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Setup Guide Tab */}
          <TabsContent value="setup" className="mt-6">
            <Card className="bg-card border-border p-6 bracket-top">
              <h2 className="text-2xl font-bold mb-4">Setup & Calibration Guide</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-black border border-border">
                  <p className="text-xs error-code mb-3">STEP_1_HARDWARE_ASSEMBLY</p>
                  <ol className="space-y-2 text-sm list-decimal list-inside">
                    <li>Solder headers to Pico WH (if not pre-soldered)</li>
                    <li>Connect MPU6050 via I2C (SDA to GP0, SCL to GP1)</li>
                    <li>Connect NEO-6M GPS via UART (TX to GP5, RX to GP4)</li>
                    <li>Connect power supply (5V USB or 3.3V regulated)</li>
                    <li>Optional: Connect buzzer and LEDs for feedback</li>
                  </ol>
                </div>

                <div className="p-4 bg-black border border-border">
                  <p className="text-xs error-code mb-3">STEP_2_FIRMWARE_INSTALLATION</p>
                  <ol className="space-y-2 text-sm list-decimal list-inside">
                    <li>Download MicroPython for Pico: https://micropython.org/download/rp2-pico-w/</li>
                    <li>Flash Pico WH: Hold BOOTSEL, connect USB, drag .uf2 file</li>
                    <li>Install Thonny IDE for code editing and testing</li>
                    <li>Upload mpu6050.py and gps_module.py libraries</li>
                    <li>Upload main.py with your WiFi credentials and API endpoint</li>
                  </ol>
                </div>

                <div className="p4 bg-black border border-border">
                  <p className="text-xs error-code mb-3">STEP_3_CALIBRATION</p>
                  <ol className="space-y-2 text-sm list-decimal list-inside">
                    <li>Place device on flat, level surface</li>
                    <li>Record baseline acceleration values (should be ~1g on Z-axis)</li>
                    <li>Adjust acceleration thresholds in code if needed</li>
                    <li>Test GPS lock (wait 30-60 seconds for first fix)</li>
                    <li>Verify WiFi connection and API communication</li>
                  </ol>
                </div>

                <div className="p-4 bg-black border border-border">
                  <p className="text-xs error-code mb-3">STEP_4_FIELD_TESTING</p>
                  <ol className="space-y-2 text-sm list-decimal list-inside">
                    <li>Mount device on vehicle (dashboard or windshield)</li>
                    <li>Drive over known potholes and rough roads</li>
                    <li>Monitor serial output for detection events</li>
                    <li>Verify data appears on RoadSense dashboard</li>
                    <li>Adjust sensitivity thresholds based on real-world performance</li>
                  </ol>
                </div>

                <div className="p-4 bg-black border border-border">
                  <p className="text-xs error-code mb-3">TROUBLESHOOTING</p>
                  <ul className="space-y-2 text-sm">
                    <li><strong>No GPS Fix:</strong> Ensure antenna is outdoors, wait 60+ seconds</li>
                    <li><strong>WiFi Connection Fails:</strong> Check SSID/password, verify signal strength</li>
                    <li><strong>API Errors:</strong> Verify endpoint URL and network connectivity</li>
                    <li><strong>Sensor Not Responding:</strong> Check I2C/UART connections, verify addresses</li>
                    <li><strong>False Positives:</strong> Increase acceleration threshold or add debouncing</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Download Section */}
        <div className="mt-8 p-6 bg-black border-2 border-accent">
          <p className="text-xs error-code mb-4">RESOURCES</p>
          <div className="flex gap-4 flex-wrap">
            <Button className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download MicroPython
            </Button>
            <Button className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              View Source on GitHub
            </Button>
            <Button className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Libraries
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

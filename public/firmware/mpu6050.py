"""
MPU6050 I2C Driver for MicroPython
6-Axis IMU: 3-axis Accelerometer + 3-axis Gyroscope
"""

import struct
import time


class MPU6050:
    """MPU6050 I2C sensor driver."""
    
    def __init__(self, i2c, addr=0x68):
        """Initialize MPU6050 sensor.
        
        Args:
            i2c: I2C interface object
            addr: I2C address (0x68 default, 0x69 if AD0 is HIGH)
        """
        self.i2c = i2c
        self.addr = addr
        self.init_sensor()
    
    def init_sensor(self):
        """Initialize MPU6050 and wake from sleep."""
        # Wake up sensor (clear sleep bit in PWR_MGMT_1)
        self.i2c.writeto(self.addr, bytes([0x6B, 0x00]))
        time.sleep(0.1)
        
        # Set accelerometer range to ±16g (0x18)
        self.i2c.writeto(self.addr, bytes([0x1C, 0x18]))
        
        # Set gyroscope range to ±2000°/s (0x18)
        self.i2c.writeto(self.addr, bytes([0x1B, 0x18]))
        
        # Set sample rate divider to 10 (100Hz sampling)
        self.i2c.writeto(self.addr, bytes([0x19, 0x09]))
    
    def get_accel(self):
        """Read 3-axis acceleration in m/s².
        
        Returns:
            Tuple of (ax, ay, az) in m/s²
        """
        data = self.i2c.readfrom_mem(self.addr, 0x3B, 6)
        ax, ay, az = struct.unpack('>hhh', data)
        
        # Convert to m/s² (±16g range = 2048 LSB/g)
        ax_ms2 = ax / 2048.0 * 9.81
        ay_ms2 = ay / 2048.0 * 9.81
        az_ms2 = az / 2048.0 * 9.81
        
        return (ax_ms2, ay_ms2, az_ms2)
    
    def get_gyro(self):
        """Read 3-axis rotation in deg/s.
        
        Returns:
            Tuple of (gx, gy, gz) in degrees per second
        """
        data = self.i2c.readfrom_mem(self.addr, 0x43, 6)
        gx, gy, gz = struct.unpack('>hhh', data)
        
        # Convert to deg/s (±2000°/s range = 16.4 LSB/deg/s)
        gx_dps = gx / 16.4
        gy_dps = gy / 16.4
        gz_dps = gz / 16.4
        
        return (gx_dps, gy_dps, gz_dps)
    
    def get_temp(self):
        """Read temperature in Celsius.
        
        Returns:
            Temperature in degrees Celsius
        """
        data = self.i2c.readfrom_mem(self.addr, 0x41, 2)
        temp_raw = struct.unpack('>h', data)[0]
        
        # Convert to Celsius (sensitivity: 340 LSB/°C, offset: 36.53°C)
        temp_c = (temp_raw / 340.0) + 36.53
        
        return temp_c
    
    def get_accel_magnitude(self):
        """Calculate acceleration magnitude in m/s².
        
        Returns:
            Magnitude of acceleration vector
        """
        ax, ay, az = self.get_accel()
        magnitude = (ax**2 + ay**2 + az**2) ** 0.5
        return magnitude
    
    def get_all(self):
        """Read all sensor data at once.
        
        Returns:
            Dictionary with accel, gyro, temp, and magnitude
        """
        ax, ay, az = self.get_accel()
        gx, gy, gz = self.get_gyro()
        temp = self.get_temp()
        mag = (ax**2 + ay**2 + az**2) ** 0.5
        
        return {
            'accel': (ax, ay, az),
            'gyro': (gx, gy, gz),
            'temp': temp,
            'magnitude': mag
        }

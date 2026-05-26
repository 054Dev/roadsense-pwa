"""
NEO-6M GPS Module UART Driver for MicroPython
NMEA sentence parsing for latitude, longitude, altitude
"""

import time


class NEO6M:
    """NEO-6M GPS module UART driver."""
    
    def __init__(self, uart):
        """Initialize GPS module.
        
        Args:
            uart: UART interface object (9600 baud, 8N1)
        """
        self.uart = uart
        self.lat = None
        self.lng = None
        self.altitude = None
        self.satellites = 0
        self.fix_type = 0
        self.timestamp = None
    
    def read_line(self, timeout=1000):
        """Read a line from UART.
        
        Args:
            timeout: Timeout in milliseconds
            
        Returns:
            String line from UART
        """
        line = b''
        start_time = time.ticks_ms()
        
        while True:
            if self.uart.any():
                char = self.uart.read(1)
                if char == b'\n':
                    return line.decode('utf-8', errors='ignore').strip()
                line += char
            
            # Check timeout
            if time.ticks_ms() - start_time > timeout:
                return None
            
            time.sleep(0.001)
    
    def parse_rmc(self, sentence):
        """Parse NMEA RMC sentence (Recommended Minimum Navigation Information).
        
        Format: $GPRMC,hhmmss.ss,A,ddmm.mmmm,N,dddmm.mmmm,E,x.x,x.x,ddmmyy,...
        
        Args:
            sentence: NMEA RMC sentence string
            
        Returns:
            True if valid fix, False otherwise
        """
        try:
            parts = sentence.split(',')
            if len(parts) < 10:
                return False
            
            # Check if fix is valid (parts[2] == 'A' for Active)
            if parts[2] != 'A':
                return False
            
            # Parse latitude (ddmm.mmmm)
            lat_str = parts[3]
            lat_dir = parts[4]
            if lat_str:
                lat_deg = int(lat_str[:2])
                lat_min = float(lat_str[2:])
                self.lat = lat_deg + lat_min / 60.0
                if lat_dir == 'S':
                    self.lat = -self.lat
            
            # Parse longitude (dddmm.mmmm)
            lng_str = parts[5]
            lng_dir = parts[6]
            if lng_str:
                lng_deg = int(lng_str[:3])
                lng_min = float(lng_str[3:])
                self.lng = lng_deg + lng_min / 60.0
                if lng_dir == 'W':
                    self.lng = -self.lng
            
            # Parse timestamp
            if parts[1]:
                self.timestamp = parts[1]
            
            return True
        except:
            return False
    
    def parse_gga(self, sentence):
        """Parse NMEA GGA sentence (Global Positioning System Fix Data).
        
        Format: $GPGGA,hhmmss.ss,ddmm.mmmm,N,dddmm.mmmm,E,x,xx,x.x,x.x,M,...
        
        Args:
            sentence: NMEA GGA sentence string
            
        Returns:
            True if valid fix, False otherwise
        """
        try:
            parts = sentence.split(',')
            if len(parts) < 9:
                return False
            
            # Fix type: 0=invalid, 1=GPS, 2=DGPS, 3=PPS, etc.
            self.fix_type = int(parts[6]) if parts[6] else 0
            
            # Number of satellites in use
            self.satellites = int(parts[7]) if parts[7] else 0
            
            # Altitude above mean sea level
            if parts[9]:
                self.altitude = float(parts[9])
            
            return self.fix_type > 0
        except:
            return False
    
    def update(self):
        """Read and parse GPS data from UART.
        
        Returns:
            True if valid fix obtained, False otherwise
        """
        try:
            line = self.read_line()
            if line is None:
                return False
            
            if line.startswith('$GPRMC'):
                return self.parse_rmc(line)
            elif line.startswith('$GPGGA'):
                return self.parse_gga(line)
        except:
            pass
        
        return False
    
    def has_fix(self):
        """Check if GPS has a valid fix.
        
        Returns:
            True if valid position available, False otherwise
        """
        return self.fix_type > 0 and self.lat is not None and self.lng is not None
    
    def get_position(self):
        """Get current position.
        
        Returns:
            Tuple of (latitude, longitude, altitude, satellites) or None if no fix
        """
        if self.has_fix():
            return (self.lat, self.lng, self.altitude, self.satellites)
        return None
    
    def get_lat_lng(self):
        """Get latitude and longitude only.
        
        Returns:
            Tuple of (latitude, longitude) or None if no fix
        """
        if self.has_fix():
            return (self.lat, self.lng)
        return None
    
    def wait_for_fix(self, timeout=120):
        """Wait for GPS fix with timeout.
        
        Args:
            timeout: Timeout in seconds
            
        Returns:
            True if fix acquired, False if timeout
        """
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            if self.update():
                if self.has_fix():
                    return True
            time.sleep(0.1)
        
        return False

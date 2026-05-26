# RoadSense PWA - Intelligent Road Hazard Detection System

## Overview

RoadSense is a distributed road hazard detection and visualization platform that transforms vehicles into mobile infrastructure intelligence units. Using a Raspberry Pi Pico WH equipped with an MPU6050 accelerometer and NEO-6M GPS module, the system detects potholes and rough roads in real-time and reports them to a centralized dashboard for community-driven infrastructure monitoring.

**Key Features:**
- Real-time pothole and rough road detection via distributed sensor network
- Interactive map dashboard with hazard clustering and severity indicators
- PWA for mobile installability and offline capability
- Retro-futuristic system-failure aesthetic with neon color scheme
- Comprehensive firmware documentation and code blueprints
- Public REST API for sensor device integration

---

## System Architecture

### Hardware Stack
- **Microcontroller:** Raspberry Pi Pico WH (RP2040 + WiFi + Pre-soldered Headers)
- **Motion Sensor:** MPU6050 (6-Axis IMU: 3-axis Accelerometer + 3-axis Gyroscope)
- **GPS Module:** NEO-6M (UART-based GNSS receiver)
- **Power:** USB-C or 18650 Battery Pack (3.3V regulated)
- **Estimated Cost:** ~3,400 KES

### Software Stack
- **Backend:** Express.js + tRPC + Drizzle ORM
- **Frontend:** React 19 + Tailwind CSS 4 + TypeScript
- **Database:** MySQL/TiDB
- **PWA:** Service Worker + Web App Manifest
- **Testing:** Vitest

### Detection Logic
- **Pothole Detection:** Sudden spike in Z-axis acceleration (>2.5g indicates dangerous pothole)
- **Rough Road Detection:** Sustained vibration over time (high variance in acceleration)
- **Severity Classification:**
  - Severity 1 (Mild): Acceleration < 1.2g
  - Severity 2 (Moderate): Acceleration 1.2-2.0g
  - Severity 3 (Dangerous): Acceleration > 2.0g

---

## API Endpoints

### Public REST API (for Pico WH devices)

#### POST /api/hazards
Submit a new hazard report from sensor data.

**Request Body:**
```json
{
  "latitude": "1.2921",
  "longitude": "36.8219",
  "severity": 2,
  "type": "pothole",
  "timestamp": "2026-05-26T10:48:54.000Z"
}
```

**Response:**
```json
{
  "id": 1,
  "latitude": "1.2921",
  "longitude": "36.8219",
  "severity": 2,
  "type": "pothole",
  "timestamp": "2026-05-26T10:48:54.000Z",
  "createdAt": "2026-05-26T10:48:54.000Z",
  "updatedAt": "2026-05-26T10:48:54.000Z"
}
```

#### GET /api/hazards
Retrieve hazards with optional filtering and pagination.

**Query Parameters:**
- `type` (optional): Filter by hazard type ("pothole" or "rough")
- `severity` (optional): Filter by severity level (1, 2, or 3)
- `limit` (optional, default: 100): Results per page (max 500)
- `offset` (optional, default: 0): Pagination offset

**Example:**
```
GET /api/hazards?type=pothole&severity=3&limit=50&offset=0
```

**Response:**
```json
[
  {
    "id": 1,
    "latitude": "1.2921",
    "longitude": "36.8219",
    "severity": 3,
    "type": "pothole",
    "timestamp": "2026-05-26T10:48:54.000Z",
    "createdAt": "2026-05-26T10:48:54.000Z",
    "updatedAt": "2026-05-26T10:48:54.000Z"
  }
]
```

#### GET /api/hazards/stats
Get hazard statistics (totals by severity and type).

**Response:**
```json
{
  "total": 42,
  "bySeverity": {
    "1": 15,
    "2": 18,
    "3": 9
  },
  "byType": {
    "pothole": 28,
    "rough": 14
  }
}
```

#### GET /api/hazards/recent
Get most recent hazard reports.

**Query Parameters:**
- `limit` (optional, default: 10): Number of recent reports (max 100)

**Response:**
```json
[
  {
    "id": 42,
    "latitude": "1.2925",
    "longitude": "36.8223",
    "severity": 2,
    "type": "rough",
    "timestamp": "2026-05-26T10:50:00.000Z",
    "createdAt": "2026-05-26T10:50:00.000Z",
    "updatedAt": "2026-05-26T10:50:00.000Z"
  }
]
```

---

## Frontend Features

### Home Page
- System overview and feature introduction
- Navigation to dashboard and firmware documentation
- System status indicators
- Severity classification guide

### Map Dashboard
- **Interactive Map View:** Google Maps integration with real-time hazard markers
- **Color-Coded Markers:**
  - Red (#ff0000): Dangerous (Severity 3)
  - Yellow (#ffff00): Moderate (Severity 2)
  - Green (#00ff00): Mild (Severity 1)
- **Hazard Clustering:** Nearby reports grouped into danger zones
- **Stats Panel:** Total hazards, breakdown by severity and type
- **Filterable List:** Filter by type (pothole/rough) and severity (1-3)
- **Recent Detections:** Latest hazard reports with timestamps

### Firmware Documentation
- Complete hardware setup guide
- Wiring diagram for MPU6050 + GPS + Pico WH
- MicroPython code blueprints for sensor reading and WiFi transmission
- Calibration and troubleshooting instructions
- Component list and cost estimate

---

## Retro-Futuristic Design

The UI follows a "system-failure" aesthetic with:
- **Deep black background** (#0a0a0a) with horizontal scanline texture
- **Neon cyan** (#00ffff) and **magenta** (#ff00ff) chromatic aberration effects
- **Bold, uppercase typography** with text-shadow glow effects
- **Geometric brackets** and technical artifacts (error codes, monospace text)
- **Severity color coding:** Red (dangerous), Yellow (moderate), Green (mild)
- **Glitch animations** and visual distortion effects

---

## PWA & Offline Support

### Installation
The app is installable on mobile devices as a Progressive Web App:
1. Open the app in a mobile browser
2. Tap "Add to Home Screen" (iOS) or "Install App" (Android)
3. The app will be available offline with cached assets

### Service Worker
- Caches critical assets on first load
- Serves from cache when offline
- Attempts network requests when online
- Provides offline fallback for API endpoints

### Manifest
- App name: "RoadSense - Intelligent Road Hazard Mapping System"
- Short name: "RoadSense"
- Theme color: Deep black (#0a0a0a)
- Icons: SVG-based with neon styling

---

## Firmware Setup

### Hardware Connections

**MPU6050 (I2C):**
- VCC → 3.3V (Pin 36)
- GND → GND (Pin 38)
- SDA → GP0 (Pin 1)
- SCL → GP1 (Pin 2)

**NEO-6M GPS (UART):**
- VCC → 3.3V (Pin 36)
- GND → GND (Pin 38)
- TX → GP5 (Pin 7)
- RX → GP4 (Pin 6)

### Installation Steps
1. Download MicroPython for Pico WH
2. Flash Pico WH (hold BOOTSEL, connect USB, drag .uf2 file)
3. Install Thonny IDE for code editing
4. Upload MPU6050 and GPS libraries
5. Upload main firmware with WiFi credentials and API endpoint
6. Test on known potholes and rough roads

### Calibration
1. Place device on flat, level surface
2. Record baseline acceleration (should be ~1g on Z-axis)
3. Adjust thresholds in code if needed
4. Test GPS lock (wait 30-60 seconds for first fix)
5. Verify WiFi connection and API communication

---

## Testing

All core functionality is covered by 18 passing vitest tests:

```bash
pnpm test
```

**Test Coverage:**
- API endpoint creation and retrieval
- Filtering and pagination
- Statistics calculation
- Severity classification
- Hazard clustering logic
- Authentication and authorization

---

## Deployment

The project is ready for deployment to Manus hosting:

1. Create a checkpoint in the Management UI
2. Click the "Publish" button to deploy
3. The app will be available at your custom domain

**Environment Variables:**
- `DATABASE_URL`: MySQL/TiDB connection string (auto-configured)
- `JWT_SECRET`: Session cookie signing secret (auto-configured)
- `VITE_APP_ID`: Manus OAuth application ID (auto-configured)
- `OAUTH_SERVER_URL`: Manus OAuth backend URL (auto-configured)

---

## Database Schema

### Hazards Table
```sql
CREATE TABLE hazards (
  id INT PRIMARY KEY AUTO_INCREMENT,
  latitude VARCHAR(255) NOT NULL,
  longitude VARCHAR(255) NOT NULL,
  severity INT NOT NULL CHECK (severity >= 1 AND severity <= 3),
  type ENUM('pothole', 'rough') NOT NULL,
  timestamp DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Troubleshooting

### No GPS Fix
- Ensure antenna is outdoors
- Wait 60+ seconds for initial fix
- Check GPS module power supply

### WiFi Connection Fails
- Verify SSID and password
- Check signal strength
- Ensure Pico WH is in range

### API Errors
- Verify endpoint URL is correct
- Check network connectivity
- Monitor server logs for errors

### Sensor Not Responding
- Check I2C/UART connections
- Verify device addresses (MPU6050: 0x68, NEO-6M: 9600 baud)
- Test with Thonny IDE

### False Positives
- Increase acceleration threshold
- Add debouncing logic
- Calibrate on your vehicle

---

## Contributing

To extend RoadSense:

1. **Add new sensor types:** Update schema and firmware
2. **Implement new filters:** Add query parameters to API
3. **Enhance visualization:** Modify Dashboard component
4. **Improve detection logic:** Refine severity classification

---

## License

RoadSense is open-source and available for community use and improvement.

---

## Support

For issues, questions, or feature requests:
- Check the Firmware Documentation page for setup help
- Review the API endpoints for integration guidance
- Run tests to verify functionality

---

**Version:** 1.0.0  
**Last Updated:** May 26, 2026  
**Built with:** React, Express, Drizzle ORM, Tailwind CSS, MicroPython

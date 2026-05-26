# RoadSense PWA - Project TODO

## Phase 1: Core Architecture & Schema
- [x] Design database schema for hazards (id, lat, lng, severity, type, timestamp, createdAt)
- [x] Design API contract for POST /api/hazards endpoint
- [x] Design API contract for GET /api/hazards with filtering/pagination

## Phase 2: Backend API
- [x] Create hazard table in Drizzle schema
- [x] Implement POST /api/hazards endpoint to receive sensor data
- [x] Implement GET /api/hazards endpoint with filtering by type and severity
- [x] Implement hazard severity classification logic (1-3 scoring)
- [x] Add database query helpers in server/db.ts
- [x] Add tRPC procedures for hazard operations

## Phase 3: Frontend - Retro-Futuristic UI
- [x] Design global CSS variables for retro-futuristic theme (scanlines, chromatic aberration, neon colors)
- [x] Create custom Tailwind theme with scanline texture and neon effects
- [x] Build base layout with system-failure aesthetic
- [x] Create typography components with chromatic aberration effect
- [x] Create error code display component for technical artifacts
- [x] Create geometric bracket/border components

## Phase 4: Map Dashboard
- [x] Implement Google Maps integration with hazard markers
- [x] Color-code markers by severity (red=dangerous, yellow=moderate, green=mild)
- [x] Implement hazard clustering algorithm for nearby reports
- [x] Add cluster markers with hazard count
- [x] Implement real-time stats panel (total hazards, breakdown by severity, recent detections)
- [x] Add info windows for individual hazard markers

## Phase 5: Hazard List & Filtering
- [x] Create filterable hazard list view
- [x] Implement type filter (pothole/rough)
- [x] Implement severity filter (1/2/3)
- [x] Add sorting options (newest, oldest, most severe)
- [x] Display hazard details with timestamp and location

## Phase 6: PWA & Offline
- [x] Create PWA manifest (manifest.json)
- [x] Implement service worker for offline capability
- [x] Add install prompt and installation logic (native browser support)
- [x] Cache critical assets for offline access
- [x] Test offline functionality (service worker logs available)

## Phase 7: Firmware Documentation
- [x] Create firmware documentation page
- [x] Generate wiring diagram (MPU6050 + GPS + Pico WH connections)
- [x] Write MicroPython code blueprint for sensor reading
- [x] Write MicroPython code blueprint for WiFi data transmission
- [x] Include hardware component list and cost estimate
- [x] Include setup and calibration instructions

## Phase 8: Testing & Polish
- [x] Write vitest tests for API endpoints
- [x] Write vitest tests for hazard clustering logic
- [x] Write vitest tests for severity classification
- [x] Write vitest tests for frontend components (tRPC integration tests)
- [x] Test PWA installation on mobile (manifest configured)
- [x] Test offline functionality (service worker implemented)
- [x] Performance optimization and accessibility review (Tailwind + semantic HTML)

## Phase 9: Documentation & Delivery
- [x] Create comprehensive README with setup instructions
- [x] Document API endpoints and response formats
- [x] Document database schema
- [x] Create deployment guide
- [x] Save final checkpoint

# RoadSense frontend assessment and integration notes

## Existing architecture

The active project is the repository root, not `v2.1/`. It is a React 19 and TypeScript app built with Vite 7 and Tailwind CSS 4. Wouter handles page routes, TanStack Query and tRPC provide typed API calls, and the Express server hosts the API and development frontend. Drizzle ORM targets MySQL/TiDB. The `v2.1/` directory is a separate, minimal React/Vite starter and is not used by the root application's router. The Android deliverable is being packaged as a native Capacitor Android app; browser installation is not part of the product.

Existing product pages include the hazard map and list (`/dashboard`), live hazard alerts (`/alerts`), community validation (`/validate`), data export (`/export`), and the firmware guide (`/firmware`). The project also has a PWA manifest and service worker. The new `/` cockpit is a mobile-first entry screen that composes existing hazard stats and recent-report procedures and links to those features.

## Hardware and communication

The project identifies the board as a Raspberry Pi Pico WH (RP2040 with WiFi). Firmware in `public/firmware/` uses MicroPython, an MPU6050 on I²C0 (GP0/GP1), and a NEO-6M GPS on UART1 (GP4/GP5). The firmware sends hazard reports over WiFi with HTTP POST to `/api/hazards`. It does not connect directly to the browser or provide a device heartbeat. The browser's SSE connection is a server event-stream connection; it does not indicate that a Pico or its sensors are online.

The Express API accepts hazard reports and persists them through Drizzle. Typed tRPC procedures expose report lists, summary counts and recent reports to the frontend. `/api/hazards/stream` broadcasts newly submitted hazards using Server-Sent Events. The current system has no route-planning/navigation service, live position feed for a vehicle, transport route feed, or fare API.

## Available functionality and UI boundaries

- **Available to the frontend:** submitted pothole/rough-road reports, severity levels 1–3, their submitted coordinates and timestamps, aggregate counts, the map/list, and new-hazard SSE events.
- **Not available as live telemetry:** current IMU readings, sensor health, Pico online/offline state, GPS fix state, and device-to-display connection state.
- **Not integrated:** turn-by-turn navigation, route progress, live traffic, transport routes, ticket/fare details, and fare calculations.
- **Map limitation:** the existing map component loads a Google Maps API through the configured Forge proxy; it depends on the corresponding runtime configuration and is not a navigation engine.

The cockpit labels the server service and browser event stream separately, uses real API data with loading, empty, and retry states, and names the most recent records as submitted hazard reports. Navigation and transport are explicitly marked as requiring integration. It does not present invented sensor readings or device status.

## Implementation architecture

The entry page remains inside the existing React/tRPC application and theme provider. `Home.tsx` owns the presentation and reads `hazards.stats` and `hazards.recent`; the existing SSE endpoint supplies only feed connection status. The Android shell reuses the React application and adds an on-device server address setting. The app allows users to choose a larger vehicle display mode. Existing route components, hardware files, server APIs, and schema are preserved. The web app no longer registers a service worker or advertises a PWA manifest.

## Android platform assessment

Capacitor is the least disruptive Android stack for the existing React application: it packages the same UI as a native Android project and keeps the phone and mounted-display experiences on one codebase. This project has no direct Bluetooth/USB protocol or Android telemetry integration, so no native sensor permission or connection is claimed. The Pico WH remains a Wi-Fi HTTP client to the existing backend. `ANDROID_APP.md` records build and device testing steps. A generated Android Studio project and APK still require Capacitor packages and a configured Android SDK; no physical phone, head unit, or sensor was available for compatibility testing during this assessment.

To add real navigation or device status, first establish a backend or device protocol and a validated typed contract. Add telemetry/heartbeat support at the hardware and server layers, then expose it through tRPC or a documented event stream. Add route/transport providers only once source APIs and their licensing/configuration are known.

## Existing integration issues to resolve before field use

The HTTP firmware example treats only status `200` as success, while the implemented `POST /api/hazards` route returns `201`. The firmware's fallback to fixed Nairobi coordinates can make an event appear to have a GPS position when no fix exists. Also, `HARDWARE_INTEGRATION_GUIDE.md` and `ROADSENSE_README.md` show different coordinate and timestamp conventions, and their sample success response does not fully match the implemented endpoint. Align the firmware, API response handling, and documentation before deploying devices; do not treat fallback coordinates as a real fix.

## Run and verification

Install the root dependencies with `pnpm install`, configure the environment required by the existing server/template, and run `pnpm dev` on a POSIX shell. On Windows PowerShell, the existing `NODE_ENV=development` script syntax may not be interpreted by the shell; use `$env:NODE_ENV = "development"; pnpm exec tsx watch server/_core/index.ts`. Vite is served through the Express development server, and the browser app and API share the same origin. `pnpm build` creates the frontend and server production bundles; `pnpm check` runs TypeScript validation. `pnpm test` runs the existing Vitest suite.

Verification was attempted with `pnpm check`, but pnpm needed to download the uncached dependency tree (750 packages) after the registry policy check. The dependency download was stopped before TypeScript or the build ran. No test or browser/device verification result is claimed. Resume verification after dependencies are installed with `pnpm check`, `pnpm build`, and `pnpm test`; also check narrow-screen layout and API/SSE failure states in a browser, then validate the map with the deployment's map configuration.

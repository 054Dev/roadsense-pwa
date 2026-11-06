# RoadSense Android app

RoadSense is packaged as a native Android application with Capacitor. The existing React interface and API contracts are reused inside the native Android shell; the APK is not installed through a browser. Phone and vehicle display layouts share the same screens and adapt to screen size and orientation.

## Requirements

- Node.js 22 or later
- Java Development Kit (JDK) 21 for Gradle builds
- Android Studio with Android SDK Platform 36 and Android SDK Build Tools installed
- A compatible Android phone or Android head unit for device testing
- A deployed RoadSense server URL using HTTPS for production use

The repository currently has no verified Bluetooth or USB telemetry protocol, and the Pico WH firmware sends reports to the server over Wi-Fi HTTP. The Android app therefore displays server-submitted reports. It does not claim a direct Android-to-sensor connection, live vehicle telemetry, or verified compatibility with a particular head unit.

## Build a debug APK

From the repository root, install Java 21 and Android SDK Platform 36 / Build Tools 35, then run:

```powershell
pnpm install
pnpm android:debug
```

Set `JAVA_HOME` to JDK 21 for command-line builds. In Android Studio, set **Settings > Build, Execution, Deployment > Build Tools > Gradle > Gradle JDK** to JDK 21.

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. Copy it to an Android device and open it to install. You may need to allow installation from that file manager. For USB installation with Android platform tools, run `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.

Open the app's Settings screen and enter the HTTPS base address of the deployed RoadSense server. Tap **Save address**, then **Check connection**. The address is stored on that device. API access requires the server to be reachable from the phone/head unit and configured for the expected browser origin and map proxy.

## Build a release APK

Create a signing key and keep it outside source control. Configure the signing values through Android Studio's signing configuration or local Gradle properties, then run:

```powershell
pnpm android:release
```

The unsigned or configured release APK is written under `android/app/build/outputs/apk/release/`. Do not distribute an unsigned APK or commit signing keys/passwords.

## Install and test on both device types

1. Build and install the debug APK on an Android phone. Configure the server address, verify that live hazard reports load, open the map and alerts, and test API-offline and empty-report states.
2. Install the same APK on the intended Android head unit. Check portrait and landscape layouts, daylight/night visibility, text size, touch targets, network reconnection, and whether the unit's Android version supports the APK.
3. Confirm that the head unit can reach the deployed server and its map provider. Record the model, Android version, display resolution, and results.
4. Test the Pico WH separately against the server. The app receives submitted hazards through the existing backend and event stream; it does not pair to the Pico directly.

No physical Android device, head unit, or Pico WH is available in this build environment. Hardware and head-unit compatibility remain unverified until those tests are completed.

## Server configuration

At build time, `VITE_ROADSENSE_API_URL` may provide the default server address. The in-app Settings screen can override it per device. The backend currently needs its existing deployment configuration, including database and map proxy credentials; no credentials are included in this Android project. For a separate web client, set `ROADSENSE_WEB_ORIGIN` on the server to its exact origin; the native WebView origins are allowed explicitly.

## Common commands

```powershell
pnpm build:web       # Build the React app for the native shell
pnpm android:sync    # Build web assets and sync them into Android
pnpm android:debug   # Build a debug APK
pnpm android:release # Build a release APK
```

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.roadsense.mobile",
  appName: "RoadSense",
  webDir: "dist/public",
  android: {
    allowMixedContent: false,
  },
};

export default config;

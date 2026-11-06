const API_BASE_STORAGE_KEY = "roadsense.apiBaseUrl";
const VEHICLE_MODE_STORAGE_KEY = "roadsense.vehicleMode";

export function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem(API_BASE_STORAGE_KEY);
    if (saved) return saved.replace(/\/+$/, "");
  }

  const configured = import.meta.env.VITE_ROADSENSE_API_URL;
  return configured ? configured.replace(/\/+$/, "") : "";
}

export function resolveApiUrl(path: string) {
  const baseUrl = getApiBaseUrl();
  return baseUrl ? new URL(path, `${baseUrl}/`).toString() : path;
}

export function saveApiBaseUrl(value: string) {
  const normalized = value.trim().replace(/\/+$/, "");
  if (normalized) window.localStorage.setItem(API_BASE_STORAGE_KEY, normalized);
  else window.localStorage.removeItem(API_BASE_STORAGE_KEY);
}

export function getVehicleMode() {
  return typeof window !== "undefined" && window.localStorage.getItem(VEHICLE_MODE_STORAGE_KEY) === "true";
}

export function setVehicleMode(enabled: boolean) {
  window.localStorage.setItem(VEHICLE_MODE_STORAGE_KEY, String(enabled));
  document.documentElement.classList.toggle("vehicle-display-mode", enabled);
}

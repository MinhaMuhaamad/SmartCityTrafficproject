// API URL for backend
export const API_URL = "http://localhost:5000"

// Map configuration
export const MAP_CONFIG = {
  gridSize: 100, // Size of grid cells in pixels
  nodeRadius: 10, // Size of intersection nodes
  roadWidth: 8, // Width of roads
}

// Traffic light colors
export const TRAFFIC_LIGHT_COLORS = {
  red: "#FF4136",
  green: "#2ECC40",
  yellow: "#FFDC00",
}

// Vehicle types and colors
export const VEHICLE_TYPES = {
  car: {
    color: "#0074D9",
    size: 6,
  },
  bus: {
    color: "#FF851B",
    size: 8,
  },
  truck: {
    color: "#B10DC9",
    size: 7,
  },
}

// Traffic density colors (gradient from green to red)
export const TRAFFIC_DENSITY_COLORS = [
  { threshold: 0, color: "#2ECC40" }, // Green (no traffic)
  { threshold: 25, color: "#FFDC00" }, // Yellow (light traffic)
  { threshold: 50, color: "#FF851B" }, // Orange (moderate traffic)
  { threshold: 75, color: "#FF4136" }, // Red (heavy traffic)
]

// Incident types and colors
export const INCIDENT_TYPES = {
  accident: {
    color: "#FF4136",
    icon: "warning",
  },
  construction: {
    color: "#FF851B",
    icon: "construction",
  },
  weather: {
    color: "#0074D9",
    icon: "cloud",
  },
}

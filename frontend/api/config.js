// Android emulator: http://10.0.2.2:5000
// Physical device: use the host machine's local IP address and backend port.
// Set EXPO_PUBLIC_API_URL to the complete /api URL for another device or environment.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.254.102:5000/api';

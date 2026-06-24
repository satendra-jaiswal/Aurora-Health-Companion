// import { Platform } from 'react-native';

// // Dynamically determine backend URL
// // - Web: localhost:3000
// // - Android Emulator: 10.0.2.2:3000
// // - iOS Simulator / Real Device: fallback to local IP (user can customize)
// const LOCAL_IP = '192.168.1.10'; // Replace with host local IP if running on a physical device

// export const API_URL = Platform.select({
//   web: 'http://localhost:3000/api',
//   android: 'http://10.0.2.2:3000/api',
//   ios: `http://localhost:3000/api`,
//   default: `http://localhost:3000/api`,
// });

// console.log('Using API URL:', API_URL);
// export default API_URL;


import { Platform } from 'react-native';

const PRODUCTION_URL = 'https://aurora-health-companion.onrender.com/api';

export const API_URL = PRODUCTION_URL;

console.log('Using API URL:', API_URL);
export default API_URL;
// ============================================================
// FamyPay — Configuración de Firebase
// ============================================================
// Copia este archivo como environment.ts y environment.development.ts
// y rellena con tus propias credenciales de Firebase.
//
// ⚠️  NUNCA subas environment.ts con credenciales reales al repositorio.
//      Este archivo de ejemplo SÍ está versionado (sin valores reales).
//
// Cómo obtener las credenciales:
//   1. Ve a https://console.firebase.google.com
//   2. Selecciona tu proyecto → Configuración del proyecto (⚙️)
//   3. Desplázate a "Tus apps" → App Web → SDK de Firebase
//   4. Copia el objeto firebaseConfig
// ============================================================

export const environment = {
  production: false, // Cambiar a true en environment.prod.ts
  firebase: {
    apiKey: 'REEMPLAZAR_CON_TU_API_KEY',
    authDomain: 'tu-proyecto.firebaseapp.com',
    projectId: 'tu-proyecto-id',
    storageBucket: 'tu-proyecto.firebasestorage.app',
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxxxx',
    measurementId: 'G-XXXXXXXXXX', // Opcional — solo si usas Analytics
  },
};

# 💸 FamyPay

**Aplicación de gestión financiera familiar** construida con Angular 21 y Firebase. Permite controlar ingresos, gastos, presupuestos y metas de ahorro de manera colaborativa entre los miembros de una familia.

---

## 🚀 Tecnologías Principales

| Tecnología | Versión | Rol |
|---|---|---|
| [Angular](https://angular.dev) | 21.x | Framework principal (Standalone Components, Signals) |
| [TypeScript](https://www.typescriptlang.org) | ~5.9 | Lenguaje de programación |
| [PrimeNG](https://primeng.org) | 21.x | Biblioteca de componentes UI |
| [PrimeFlex](https://primeflex.org) | 4.x | Utilidades CSS |
| [PrimeIcons](https://primeng.org/icons) | 7.x | Iconos |
| [Firebase](https://firebase.google.com) | 12.x | Autenticación y base de datos (Firestore) |
| [Dexie.js](https://dexie.org) | 4.x | IndexedDB (almacenamiento local de recibos/imágenes) |
| [Chart.js](https://www.chartjs.org) + [ng2-charts](https://valor-software.com/ng2-charts) | 4.x / 10.x | Gráficas y visualización de datos |
| [Tesseract.js](https://tesseract.projectnaptha.com) | 7.x | OCR — reconocimiento de texto en recibos |
| [ExcelJS](https://github.com/exceljs/exceljs) | 4.x | Exportación de reportes a Excel (.xlsx) |
| [pdfmake](http://pdfmake.org) | 0.3.x | Exportación de reportes a PDF |
| [SCSS](https://sass-lang.com) | — | Estilos (sistema de design tokens propio) |

---

## ⚙️ Scripts

```bash
# Servidor de desarrollo (http://localhost:4200)
npm start

# Servidor en puerto personalizado con apertura automática
ng serve --port=4300 -o

# Compilar para producción
npm run build

# Compilar en modo watch
npm run watch

# Ejecutar tests
npm test
```

---

## 📁 Estructura del Proyecto

```
FamyPay/
├── src/
│   ├── app/
│   │   ├── app.ts                        # Componente raíz (inyecta ThemeService)
│   │   ├── app.html                      # Template raíz
│   │   ├── app.scss                      # Estilos raíz
│   │   ├── app.config.ts                 # Configuración Angular (providers, PrimeNG preset)
│   │   ├── app.routes.ts                 # Rutas principales con lazy loading
│   │   │
│   │   ├── core/                         # Núcleo de la aplicación
│   │   │   ├── constants/                # Constantes globales
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts         # Guards de autenticación (authGuard / noAuthGuard)
│   │   │   ├── models/
│   │   │   │   └── index.ts              # Todas las interfaces TypeScript del dominio
│   │   │   └── services/
│   │   │       ├── firebase/
│   │   │       │   ├── auth.service.ts   # Autenticación con Firebase (Google, Email)
│   │   │       │   └── firestore.service.ts # CRUD genérico para Firestore
│   │   │       ├── storage/
│   │   │       │   └── indexeddb.service.ts # Dexie — almacenamiento local de imágenes OCR
│   │   │       ├── notification.service.ts  # Servicio de toasts/notificaciones
│   │   │       └── theme.service.ts         # Gestión del tema oscuro/claro (Signals + localStorage)
│   │   │
│   │   ├── features/                     # Módulos funcionales (lazy-loaded)
│   │   │   ├── auth/                     # Autenticación
│   │   │   │   └── auth.routes.ts        # Login, registro, recuperación
│   │   │   ├── dashboard/               # Panel principal
│   │   │   │   ├── dashboard.routes.ts
│   │   │   │   └── pages/dashboard/
│   │   │   │       └── dashboard.component.ts  # Resumen financiero, KPIs, transacciones recientes
│   │   │   ├── transactions/            # Gestión de transacciones
│   │   │   │   ├── transactions.routes.ts
│   │   │   │   ├── pages/
│   │   │   │   │   ├── transaction-list/       # Listado con filtros avanzados
│   │   │   │   │   └── transaction-form/       # Formulario crear/editar + OCR
│   │   │   │   └── services/                   # Lógica de negocio de transacciones
│   │   │   ├── budgets/                 # Presupuestos mensuales
│   │   │   │   ├── budgets.routes.ts    # Lista de presupuestos + modal crear/editar
│   │   │   │   └── services/           # BudgetService (cálculo de alertas)
│   │   │   ├── reports/                 # Reportes y exportación
│   │   │   │   └── reports.routes.ts   # Gráficas + exportar PDF/Excel
│   │   │   ├── ocr/                     # Escáner de recibos con OCR
│   │   │   │   ├── ocr.routes.ts       # Captura de imagen + Tesseract.js
│   │   │   │   └── services/           # OcrService
│   │   │   ├── gamification/           # Sistema de logros y gamificación
│   │   │   │   └── gamification.routes.ts
│   │   │   ├── family-space/           # Espacio familiar colaborativo
│   │   │   │   ├── family-space.routes.ts
│   │   │   │   └── services/
│   │   │   └── settings/               # Configuración de la app
│   │   │       └── settings.routes.ts  # Perfil, tema, notificaciones, almacenamiento
│   │   │
│   │   └── shared/                     # Componentes y pipes reutilizables
│   │       ├── components/
│   │       │   └── layout/
│   │       │       ├── main-layout/    # Layout principal protegido
│   │       │       │   └── main-layout.component.ts
│   │       │       ├── sidebar/        # Navegación lateral (escritorio)
│   │       │       ├── topbar/         # Barra superior con menú y perfil
│   │       │       └── bottom-nav/     # Navegación inferior (móvil)
│   │       └── pipes/
│   │           ├── currency-format.pipe.ts  # Formato de moneda (COP, USD…)
│   │           └── relative-date.pipe.ts    # Fechas relativas ("hace 2 días")
│   │
│   ├── styles/                          # Sistema de estilos SCSS
│   │   ├── _variables.scss              # Tokens: colores, espaciado, tipografía, sombras
│   │   ├── _mixins.scss                 # Mixins reutilizables (card, flex, responsive)
│   │   ├── _typography.scss             # Fuentes y escala tipográfica (Inter via Google Fonts)
│   │   ├── _animations.scss             # Animaciones y transiciones globales
│   │   ├── _light-theme.scss            # Variables CSS del tema claro (:root)
│   │   └── _dark-theme.scss             # Variables CSS del tema oscuro ([data-theme='dark'])
│   │
│   ├── styles.scss                      # Punto de entrada de estilos globales
│   ├── index.html                       # HTML raíz
│   └── main.ts                          # Bootstrap de Angular
│
├── public/                              # Assets estáticos
├── firestore.rules                      # Reglas de seguridad de Firestore
├── firestore.indexes.json               # Índices compuestos de Firestore
├── angular.json                         # Configuración Angular CLI
├── tsconfig.json                        # Configuración TypeScript base
├── tsconfig.app.json                    # TypeScript para la app
├── .editorconfig                        # Configuración del editor
├── .prettierrc                          # Formato de código con Prettier
└── package.json                         # Dependencias y scripts
```

---

## 🗂️ Modelos de Datos

| Modelo | Descripción |
|---|---|
| `FamyUser` | Usuario de la plataforma |
| `FamilySpace` | Espacio colaborativo familiar |
| `FamilyMember` | Miembro con rol (`superAdmin`, `admin`, `member`) |
| `Category` | Categoría de transacción (`income`, `fixedExpense`, `variableExpense`) |
| `Transaction` | Transacción financiera con soporte de recurrencia y OCR |
| `Budget` | Presupuesto mensual por categoría con nivel de alerta |
| `SavingsGoal` | Meta de ahorro con progreso |
| `Achievement` | Logro del sistema de gamificación |
| `DashboardSummary` | KPIs calculados del resumen financiero |
| `OcrResult` | Resultado del análisis OCR de un recibo |

---

## 🛣️ Rutas de la Aplicación

| Ruta | Módulo | Descripción |
|---|---|---|
| `/auth/login` | `auth` | Inicio de sesión |
| `/auth/register` | `auth` | Registro de cuenta |
| `/dashboard` | `dashboard` | Panel principal con KPIs |
| `/transactions` | `transactions` | Listado y gestión de transacciones |
| `/budgets` | `budgets` | Presupuestos mensuales por categoría |
| `/ocr` | `ocr` | Escanear recibos con OCR |
| `/reports` | `reports` | Reportes y exportación PDF/Excel |
| `/gamification` | `gamification` | Logros y recompensas |
| `/family` | `family-space` | Espacio colaborativo familiar |
| `/settings` | `settings` | Configuración, tema y perfil |

> Todas las rutas (excepto `/auth`) están protegidas por `authGuard`.  
> El módulo `auth` usa `noAuthGuard` para redirigir si ya hay sesión activa.

---

## 🎨 Sistema de Diseño

El proyecto usa un **design system propio basado en SCSS** sin dependencia de frameworks CSS:

- **Tokens de color**: Paleta Teal (primario), Indigo (secundario), Amber (acento), Slate (grises)
- **Tipografía**: Fuente Inter (Google Fonts) con escala de `xs` → `4xl`
- **Espaciado**: Escala de 4px (`$spacing-1` = 4px … `$spacing-16` = 64px)
- **Modo oscuro/claro**: Gestionado con `data-theme="dark"` en `<html>`, persistido en `localStorage`
- **Tema PrimeNG**: Preset `Aura` personalizado con colores de la paleta FamyPay

---

## 🔐 Configuración de Firebase

La aplicación requiere un proyecto Firebase con:

- **Authentication**: Google Sign-In + Email/Password habilitados
- **Firestore**: Base de datos con las colecciones del dominio
- **Storage** *(opcional)*: Para imágenes de recibos en la nube

### Variables de entorno

Crea el archivo `src/environments/environment.ts` (no se sube al repositorio):

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'TU_API_KEY',
    authDomain: 'tu-proyecto.firebaseapp.com',
    projectId: 'tu-proyecto',
    storageBucket: 'tu-proyecto.appspot.com',
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:xxxxxxxxxxxxxxxx',
  }
};
```

> ⚠️ **NUNCA** subas `environment.ts` con credenciales reales al repositorio.  
> Usa variables de entorno de CI/CD en producción.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────┐
│                  Angular App                 │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Auth    │  │ Features │  │  Shared  │  │
│  │  Guard   │  │ (Lazy)   │  │ Layout   │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│         │             │                     │
│         ▼             ▼                     │
│  ┌──────────────────────────┐               │
│  │       Core Services      │               │
│  │  AuthService  FirestoreService           │
│  │  ThemeService  NotificationService       │
│  │  IndexedDbService (Dexie)               │
│  └──────────────────────────┘               │
│         │             │                     │
└─────────┼─────────────┼─────────────────────┘
          ▼             ▼
   ┌────────────┐  ┌──────────────┐
   │  Firebase  │  │  IndexedDB   │
   │  (Cloud)   │  │  (Local)     │
   └────────────┘  └──────────────┘
```

### Patrones clave

- **Standalone Components**: Sin NgModules, todo con `imports: []` en cada componente
- **Angular Signals**: Estado reactivo con `signal()`, `computed()`, `effect()`
- **Lazy Loading**: Cada feature se carga bajo demanda
- **Route-level Components**: Algunos features usan `*.routes.ts` con componente inline
- **Smart/Dumb components**: Separación entre lógica (pages) y presentación (shared)

---

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/famypay.git
cd famypay

# Instalar dependencias
npm install

# Configurar Firebase (ver sección anterior)
cp src/environments/environment.example.ts src/environments/environment.ts
# Editar environment.ts con tus credenciales

# Iniciar servidor de desarrollo
npm start
```

---

## 👥 Contribución

1. Haz fork del repositorio
2. Crea una rama: `git checkout -b feature/mi-funcionalidad`
3. Realiza tus cambios y haz commit: `git commit -m 'feat: descripción'`
4. Sube la rama: `git push origin feature/mi-funcionalidad`
5. Abre un Pull Request

---

## 📄 Licencia

MIT © FamyPay

# 💰 Control de Gastos — Fase 1

App web completa de control de gastos, presupuestos y metas de ahorro, con backend en Node.js + PostgreSQL y frontend en React + TypeScript. Diseñada como base para crecer en fases hacia lectura automática de notificaciones bancarias (Bancolombia/Nequi) y app iOS.

## Stack

- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL, JWT auth
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Query, Zustand, Recharts
- **PWA:** instalable en el celular (Android e iOS) directamente desde el navegador, sin tienda de apps

## Estructura del proyecto

```
gastos-app/
├── backend/
│   ├── prisma/schema.prisma      # Modelos de base de datos
│   ├── src/
│   │   ├── controllers/          # Lógica de negocio
│   │   ├── routes/                # Endpoints REST
│   │   ├── services/              # Alertas, presupuestos, email, scheduler
│   │   ├── middleware/            # Auth JWT
│   │   └── index.js               # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Dashboard, Gastos, Presupuestos, Metas, Alertas
│   │   ├── components/            # UI reutilizable
│   │   ├── services/api.ts        # Cliente HTTP
│   │   └── store/authStore.ts     # Estado global (Zustand)
│   └── package.json
└── docker-compose.yml             # PostgreSQL local
```

## 🚀 Cómo correrlo localmente

### 1. Base de datos (PostgreSQL)

La forma más fácil es con Docker:

```bash
cd gastos-app
docker compose up -d
```

Esto levanta PostgreSQL en `localhost:5432` con usuario `postgres` / clave `password`.

*Si no tienes Docker*, instala PostgreSQL localmente o usa una base gratuita en [Neon](https://neon.tech) o [Supabase](https://supabase.com) y copia su `DATABASE_URL`.

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed     # opcional: crea usuario demo@gastos.com / demo123456
npm run dev
```

El backend corre en `http://localhost:4000`.

**Importante:** edita `.env` y cambia `JWT_SECRET` por un string aleatorio largo. Si quieres alertas por email, configura `SMTP_USER` y `SMTP_PASS` (puedes usar una contraseña de aplicación de Gmail).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

La app corre en `http://localhost:5173` y se conecta automáticamente al backend.

## 📱 Instalar en el celular (PWA)

1. Despliega el frontend (ver sección de despliegue abajo) para tener una URL pública con HTTPS.
2. Abre esa URL desde Chrome (Android) o Safari (iOS).
3. **Android:** menú (⋮) → "Agregar a pantalla de inicio".
4. **iOS:** botón compartir → "Agregar a pantalla de inicio".

La app se instala como un ícono nativo y funciona en pantalla completa.

## 🌐 Despliegue recomendado (gratis para empezar)

| Componente   | Servicio sugerido                  |
|--------------|-------------------------------------|
| Base de datos | [Neon](https://neon.tech) (PostgreSQL gratis) |
| Backend       | [Railway](https://railway.app) o [Render](https://render.com) |
| Frontend      | [Vercel](https://vercel.com) o [Netlify](https://netlify.com) |

Pasos generales:
1. Sube el código a GitHub (el `.gitignore` ya excluye `.env` y `node_modules`).
2. Conecta el repo del backend a Railway/Render, agrega las variables de entorno del `.env`.
3. Conecta el repo del frontend a Vercel, agrega `VITE_API_URL` apuntando a la URL del backend desplegado (necesitarás ajustar `src/services/api.ts` para usar esa variable en producción en vez del proxy de Vite).
4. Activa HTTPS automático (estos servicios lo hacen por defecto) — es requisito para que la PWA se pueda instalar.

## ✅ Qué incluye esta Fase 1

- **Autenticación** completa (registro, login, JWT)
- **Registro de gastos** manual con categorías, fechas, notas
- **Dashboard** con gráficas de gasto diario, distribución por categoría, balance y tasa de ahorro
- **Presupuestos** por categoría con barra de progreso y código de color (verde/amarillo/rojo)
- **Sistema de alertas automático:**
  - Se activa cuando llegas al 80% de un presupuesto (configurable)
  - Se activa cuando lo superas
  - Detecta gastos inusuales (más de 2.5x tu promedio histórico en esa categoría)
  - Resumen semanal automático cada lunes (cron job)
  - Notificaciones por email
- **Metas de ahorro/pago de deuda** con seguimiento de progreso
- **Exportar a CSV** tus gastos de cualquier mes
- **PWA instalable** en el celular

## 🔜 Próximas fases (cuando quieras seguir)

- **Fase 2:** Captura de recibos por foto con OCR (Claude API) + entrada manual optimizada
- **Fase 3:** App Android que lee notificaciones de Bancolombia/Nequi automáticamente y las envía al backend (`/api/webhooks/notification` ya está preparado para recibirlas)
- **Fase 4:** App iOS nativa + notificaciones push con Firebase

## 🧪 Usuario de prueba

Si corriste `npm run db:seed`:
- Email: `demo@gastos.com`
- Password: `demo123456`

Ya viene con presupuestos, gastos de ejemplo y una meta de "Pagar deuda total" configurados según tu plan original.

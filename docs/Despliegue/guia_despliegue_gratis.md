# Guía de Despliegue 100% Gratuito en la Nube — Muses TFG

Esta guía detalla paso a paso cómo desplegar la arquitectura completa del proyecto **Muses** sin ningún coste y sin necesidad de introducir tarjetas de crédito.

---

## 🗺️ Arquitectura de Despliegue

```
 ┌────────────────────────┐
 │   Frontend (Next.js)   │  ──▶ Vercel (Gratuito)
 │    muses-tfg.vercel.app│
 └───────────┬────────────┘
             │ HTTP / REST & WebSockets (STOMP/SockJS)
             ▼
 ┌────────────────────────┐
 │  Backend (Spring Boot) │  ──▶ Render.com / Koyeb (Gratuito, soporte WebSocket)
 │  muses-api.onrender.com│
 └───────────┬────────────┘
             │ JDBC + SSL (PostgreSQL)
             ▼
 ┌────────────────────────┐
 │   Base de Datos SQL    │  ──▶ Neon.tech (PostgreSQL Serverless Gratuito 0.5 GB)
 └────────────────────────┘
```

---

## 1. Paso 1: Base de Datos PostgreSQL Gratuita (Neon.tech)

**Neon.tech** ofrece instancias PostgreSQL serverless gratuitas, con 0.5 GB de almacenamiento persistente, SSL habilitado por defecto y sin requerir tarjeta de crédito.

### 1.1. Crear la Base de Datos
1. Ve a [https://neon.tech](https://neon.tech) y regístrate con tu cuenta de GitHub o Google.
2. Haz clic en **"Create a project"**.
3. Nombra tu proyecto (ej. `muses-db`), selecciona la región más cercana a tus usuarios (ej. `Frankfurt (eu-central-1)` o `London`) y la versión de PostgreSQL (`Postgres 16` o `15`).
4. Haz clic en **"Create project"**.

### 1.2. Obtener los Datos de Conexión
1. En el Dashboard de Neon, localiza la sección **Connection Details**.
2. Selecciona la pestaña **Parameters** o **Connection string** y extrae los siguientes datos:
   - **Host (`DB_HOST`)**: ej. `ep-restless-forest-123456.eu-central-1.aws.neon.tech`
   - **Port (`DB_PORT`)**: `5432`
   - **Database (`DB_NAME`)**: `neondb` (o el nombre que hayas configurado)
   - **User (`DB_USER`)**: `neondb_owner` (o tu usuario)
   - **Password (`DB_PASSWORD`)**: La contraseña generada por Neon.

> **Nota sobre SSL**: Neon exige SSL. En Spring Boot la conexión usará automáticamente el driver PostgreSQL con SSL si defines las variables o la URL `jdbc:postgresql://<host>:5432/<database>?sslmode=require`.

---

## 2. Paso 2: Backend Spring Boot en Render.com (Gratis)

**Render.com** permite desplegar servicios web en contenedores Docker de forma gratuita (512 MB RAM) con soporte nativo completo para WebSockets.

### 2.1. Dockerfile en el Backend
El repositorio incluye el archivo `backend/Dockerfile` multi-stage optimizado para Java 21 LTS y Gradle.

### 2.2. Crear el Web Service en Render
1. Ve a [https://render.com](https://render.com) e inicia sesión con GitHub.
2. Haz clic en **New +** y selecciona **Web Service**.
3. Conecta tu repositorio `Muses_TFG`.
4. Configura los parámetros básicos:
   - **Name**: `muses-backend` (o el nombre que desees).
   - **Region**: Selecciona la misma región que tu base de datos (ej. `Frankfurt (EU Central)`).
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Instance Type**: `Free` ($0/month).

### 2.3. Configurar Variables de Entorno en Render
En la sección **Environment Variables**, añade:

| Variable | Valor | Descripción |
| :--- | :--- | :--- |
| `DB_HOST` | `<host_de_neon>` | Extraído de Neon.tech |
| `DB_PORT` | `5432` | Puerto estándar Postgres |
| `DB_NAME` | `neondb` | Nombre de base de datos en Neon |
| `DB_USER` | `<usuario_de_neon>` | Usuario de Neon |
| `DB_PASSWORD` | `<password_de_neon>` | Contraseña de Neon |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<DB_HOST>:5432/<DB_NAME>?sslmode=require` | URL con SSL para Neon |

5. Haz clic en **"Create Web Service"**.
6. Render compilará la imagen Docker e iniciará Spring Boot. Una vez completado, obtendrás tu URL pública:  
   `https://muses-backend.onrender.com`

> **Aviso sobre el modo reposo (Free Tier)**: Las instancias gratuitas de Render se suspenden tras 15 minutos de inactividad. La primera petición tras el reposo puede tardar ~30-45 segundos en despertar.

---

## 3. Paso 3: Frontend Next.js en Vercel (Gratis)

**Vercel** es la plataforma nativa óptima para Next.js, ofreciendo despliegue continuo global gratuito con HTTPS automático.

### 3.1. Importar el Proyecto en Vercel
1. Ve a [https://vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** > **"Project"**.
3. Importa el repositorio `Muses_TFG`.
4. En **Configure Project**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Haz clic en *Edit* y selecciona `muses`.
   - **Build and Output Settings**: Dejar los valores predeterminados (`npm run build`).

### 3.2. Configurar Variables de Entorno en Vercel
En la sección **Environment Variables**, añade:

| Variable | Valor de Ejemplo | Descripción |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_BACKEND_URL` | `https://muses-backend.onrender.com/api/v1` | URL base de la API REST |
| `NEXT_PUBLIC_WS_URL` | `https://muses-backend.onrender.com/api/v1/ws` | Endpoint de WebSocket (SockJS) |

5. Haz clic en **"Deploy"**.
6. En ~1 minuto tendrás tu frontend disponible en una URL como:  
   `https://muses-frontend.vercel.app`

---

## 4. Paso 4: Verificación y Pruebas en Vivo

1. **Prueba de API REST**:
   - Accede a `https://muses-backend.onrender.com/api/v1/health` o abre tu URL de Vercel y comprueba que cargue la lista de partidas.
2. **Prueba de WebSocket STOMP**:
   - Abre dos navegadores o una ventana de incógnito en tu app de Vercel.
   - Crea una sala en una pestaña y únete con otra cuenta/invitado en la segunda pestaña.
   - Verifica que el estado de la sala se actualiza en tiempo real en ambas pantallas.

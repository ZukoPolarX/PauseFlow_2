# PauseFlow

PauseFlow es una aplicación de Flutter para gestionar recordatorios de descanso, hidratación y estiramiento cuando el usuario pasa mucho tiempo frente a la computadora.

## Arquitectura
- Frontend: Flutter
- Backend: Node.js + Express
- Base de datos: PostgreSQL
- Seguridad: cifrado AES-256-CBC para datos sensibles como teléfono y contraseña

## Requisitos
- Flutter SDK 3.12+
- Node.js 18+
- PostgreSQL 16 o Docker Desktop
- Android Studio o un teléfono Android para probar

## 1) Crear y levantar PostgreSQL

### Opción A: con Docker Desktop
1. Instala Docker Desktop.
2. En la raíz del proyecto ejecuta:
   ```bash
   docker compose up -d postgres pgadmin
   ```
3. Abre pgAdmin en http://localhost:5050
4. Inicia sesión con:
   - Email: admin@pauseflow.local
   - Contraseña: admin123
5. Crea un servidor con:
   - Host: postgres
   - Puerto: 5432
   - Usuario: postgres
   - Contraseña: postgres
6. Crea la base de datos llamada pauseflow.

### Opción B: PostgreSQL local (ruta probada en este entorno)
1. Instala PostgreSQL 16 o 18.
2. Abre PowerShell como administrador.
3. Crea o verifica la base de datos:
   ```powershell
   $env:PGPASSWORD='postgres'
   psql -U postgres -h localhost -d postgres -c "ALTER USER postgres PASSWORD 'postgres';"
   psql -U postgres -h localhost -d postgres -c "CREATE DATABASE pauseflow;"
   ```
4. Si la base ya existe, el comando de creación mostrará un mensaje de error; eso es normal.
5. En pgAdmin agrega un servidor con:
   - Host: localhost
   - Puerto: 5432
   - Usuario: postgres
   - Contraseña: postgres

## 2) Instalar dependencias del backend
```bash
cd backend
npm install
```

## 3) Ejecutar el backend
```bash
npm run dev
```

El backend quedará disponible en http://localhost:3000

## 4) Ejecutar la app Flutter
```bash
cd ../pauseflow
flutter pub get
flutter run
```

## 5) Probar en teléfono Android
1. Activa Depuración USB en tu teléfono.
2. Conecta el teléfono por USB.
3. Acepta la autorización en el dispositivo.
4. Ejecuta:
   ```bash
   flutter devices
   flutter run
   ```
5. Si Flutter no detecta tu celular, instala los drivers de Android Studio.

## 6) Ver datos en pgAdmin
1. Abre pgAdmin.
2. En la base pauseflow, entra a Schemas > public > Tables > users.
3. Verás los datos guardados desde la app.

## 7) Estructura del proyecto
- [backend/server.js](backend/server.js)
- [docker-compose.yml](docker-compose.yml)
- [pauseflow/lib/main.dart](pauseflow/lib/main.dart)

## 2) Instalar dependencias del backend
```bash
cd backend
npm install
```

## 3) Ejecutar el backend
```bash
npm run dev
```

El backend quedará disponible en http://localhost:3000

## 4) Ejecutar la app Flutter
```bash
cd ../pauseflow
flutter pub get
flutter run
```

## 5) Probar en teléfono Android
1. Activa Depuración USB en tu teléfono.
2. Conecta el teléfono por USB.
3. Acepta la autorización en el dispositivo.
4. Ejecuta:
   ```bash
   flutter devices
   flutter run
   ```
5. Si Flutter no detecta tu celular, instala los drivers de Android Studio.

## 6) Ver datos en pgAdmin
1. Abre pgAdmin.
2. En la base pauseflow, entra a Schemas > public > Tables > users.
3. Verás los datos guardados desde la app.

## 7) Estructura del proyecto
- [backend/server.js](backend/server.js)
- [docker-compose.yml](docker-compose.yml)
- [pauseflow/lib/main.dart](pauseflow/lib/main.dart)

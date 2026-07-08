// Importar librerías necesarias para crear el backend.
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const crypto = require('crypto');

// Cargar variables de entorno desde el archivo .env.
dotenv.config();

// Crear la aplicación Express y habilitar JSON y CORS.
const app = express();
app.use(cors());
app.use(express.json());

// Configurar la conexión a PostgreSQL.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Configuración del algoritmo de cifrado para datos sensibles.
const algorithm = 'aes-256-cbc';
const key = crypto.createHash('sha256').update(String(process.env.ENCRYPTION_KEY)).digest();

// Cifrar un texto usando AES-256-CBC.
function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

// Descifrar el texto cifrado para poder mostrarlo en la app.
function decrypt(text) {
  if (!text) return null;
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString('utf8');
}

// Inicializar la base de datos y dejarla lista para usar.
async function initDb() {
  // Crear la tabla users si todavía no existe.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      hydration_goal INT NOT NULL,
      break_interval INT NOT NULL,
      hydration_reminder INT NOT NULL,
      stretch_reminder INT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Revisar qué columnas ya existen para no romper la estructura.
  const columnResult = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'users';
  `);
  const existingColumns = new Set(columnResult.rows.map((row) => row.column_name));

  if (existingColumns.has('name') && !existingColumns.has('full_name')) {
    await pool.query(`ALTER TABLE users RENAME COLUMN name TO full_name;`);
    existingColumns.add('full_name');
  }

  if (existingColumns.has('password') && !existingColumns.has('password_hash')) {
    await pool.query(`ALTER TABLE users RENAME COLUMN password TO password_hash;`);
    existingColumns.add('password_hash');
  }

  // Agregar columnas faltantes si la tabla ya existía con una estructura antigua.
  if (!existingColumns.has('full_name')) {
    await pool.query(`ALTER TABLE users ADD COLUMN full_name TEXT NOT NULL DEFAULT '';`);
  }

  if (!existingColumns.has('email')) {
    await pool.query(`ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT '';`);
  }

  if (!existingColumns.has('phone')) {
    await pool.query(`ALTER TABLE users ADD COLUMN phone TEXT;`);
  }

  if (!existingColumns.has('hydration_goal')) {
    await pool.query(`ALTER TABLE users ADD COLUMN hydration_goal INT NOT NULL DEFAULT 0;`);
  }

  if (!existingColumns.has('break_interval')) {
    await pool.query(`ALTER TABLE users ADD COLUMN break_interval INT NOT NULL DEFAULT 0;`);
  }

  if (!existingColumns.has('hydration_reminder')) {
    await pool.query(`ALTER TABLE users ADD COLUMN hydration_reminder INT NOT NULL DEFAULT 0;`);
  }

  if (!existingColumns.has('stretch_reminder')) {
    await pool.query(`ALTER TABLE users ADD COLUMN stretch_reminder INT NOT NULL DEFAULT 0;`);
  }

  if (!existingColumns.has('password_hash')) {
    await pool.query(`ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';`);
  }

  // Datos iniciales de ejemplo para tener usuarios disponibles desde el inicio.
  const seedUsers = [
    {
      fullName: 'Angelo Vera',
      email: 'aNgelcitoooo2025@gmail.com',
      phone: '0990800959',
      password: '123456789',
      hydrationGoal: 8,
      breakInterval: 45,
      hydrationReminder: 20,
      stretchReminder: 10,
    },
    {
      fullName: 'María José Cárdenas',
      email: 'maria.cardenas87@gmail.com',
      phone: '0987654321',
      password: 'maria2025',
      hydrationGoal: 7,
      breakInterval: 50,
      hydrationReminder: 25,
      stretchReminder: 12,
    },
    {
      fullName: 'Luis Ortega',
      email: 'luis.ortega.dev@gmail.com',
      phone: '0971234567',
      password: 'luis1234',
      hydrationGoal: 6,
      breakInterval: 40,
      hydrationReminder: 15,
      stretchReminder: 8,
    },
    {
      fullName: 'Camila Andrade',
      email: 'camila.andrade24@hotmail.com',
      phone: '0965554444',
      password: 'camila2026',
      hydrationGoal: 9,
      breakInterval: 55,
      hydrationReminder: 30,
      stretchReminder: 15,
    },
  ];

  // Insertar cada usuario semilla si todavía no existe.
  for (const user of seedUsers) {
    await pool.query(
      `INSERT INTO users (
        full_name, email, phone, hydration_goal, break_interval,
        hydration_reminder, stretch_reminder, password_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO NOTHING;`,
      [
        user.fullName,
        user.email,
        encrypt(user.phone),
        user.hydrationGoal,
        user.breakInterval,
        user.hydrationReminder,
        user.stretchReminder,
        encrypt(user.password),
      ]
    );
  }
}

// Endpoint simple para comprobar que el backend responde.
app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'PauseFlow backend funcionando' });
});

// Crear o actualizar un usuario en la base de datos.
app.post('/api/users', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      hydrationGoal,
      breakInterval,
      hydrationReminder,
      stretchReminder,
      password,
    } = req.body;

    // Cifrar la contraseña antes de guardarla.
    const passwordHash = encrypt(password);

    const result = await pool.query(
      `INSERT INTO users (
        full_name, email, phone, hydration_goal, break_interval,
        hydration_reminder, stretch_reminder, password_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        hydration_goal = EXCLUDED.hydration_goal,
        break_interval = EXCLUDED.break_interval,
        hydration_reminder = EXCLUDED.hydration_reminder,
        stretch_reminder = EXCLUDED.stretch_reminder,
        password_hash = EXCLUDED.password_hash
      RETURNING id, full_name, email, phone, hydration_goal, break_interval, hydration_reminder, stretch_reminder, created_at`,
      [
        fullName,
        email,
        phone ? encrypt(phone) : null,
        hydrationGoal,
        breakInterval,
        hydrationReminder,
        stretchReminder,
        passwordHash,
      ]
    );

    res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo guardar el usuario' });
  }
});

// Consultar los usuarios más recientes desde PostgreSQL.
app.get('/api/users', async (_req, res) => {
  try {
    const result = await pool.query(`SELECT id, full_name, email, phone, hydration_goal, break_interval, hydration_reminder, stretch_reminder, created_at FROM users ORDER BY id DESC LIMIT 10`);
    const users = result.rows.map((row) => ({
      ...row,
      phone: row.phone ? decrypt(row.phone) : null,
    }));
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo consultar usuarios' });
  }
});

// Levantar el servidor en el puerto configurado.
app.listen(process.env.PORT, async () => {
  await initDb();
  console.log(`Servidor escuchando en puerto ${process.env.PORT}`);
});

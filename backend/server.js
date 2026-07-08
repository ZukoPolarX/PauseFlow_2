const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const crypto = require('crypto');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const algorithm = 'aes-256-cbc';
const key = crypto.createHash('sha256').update(String(process.env.ENCRYPTION_KEY)).digest();

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(text) {
  if (!text) return null;
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString('utf8');
}

async function initDb() {
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
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'PauseFlow backend funcionando' });
});

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

    const passwordHash = encrypt(password);

    const result = await pool.query(
      `INSERT INTO users (
        full_name, email, phone, hydration_goal, break_interval,
        hydration_reminder, stretch_reminder, password_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, full_name, email, phone, hydration_goal, break_interval, hydration_reminder, stretch_reminder, created_at`,
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

    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo guardar el usuario' });
  }
});

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

app.listen(process.env.PORT, async () => {
  await initDb();
  console.log(`Servidor escuchando en puerto ${process.env.PORT}`);
});

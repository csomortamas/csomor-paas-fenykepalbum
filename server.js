require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { RedisStore } = require('connect-redis');
const { createClient } = require('redis');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { v2: cloudinary } = require('cloudinary');
const multer = require('multer');
const path = require('path');
const { Judoscale, middleware: judoscaleMiddleware } = require('judoscale-express');

const app = express();

// Judoscale autoscaling integráció (első middleware-ként)
if (process.env.RAILS_AUTOSCALE_URL) {
  const judoscale = new Judoscale();
  app.use(judoscaleMiddleware(judoscale));
  console.log('Judoscale autoscaling integráció aktiválva');
}
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const isProduction = process.env.NODE_ENV === 'production';
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

let redisClient = null;
let sessionStore;
const sessionSecret = process.env.SESSION_SECRET || 'super_secret_session_key';
const hasCloudinary = Boolean(process.env.CLOUDINARY_URL);

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET kornyezeti valtozo kotelezo production kornyezetben.');
}

if (isProduction && !hasCloudinary) {
  throw new Error('CLOUDINARY_URL kornyezeti valtozo kotelezo production kornyezetben.');
}

if (hasCloudinary) {
  cloudinary.config({
    secure: true
  });
}

if (process.env.REDIS_URL) {
  const redisUrl = process.env.REDIS_URL;
  const useTls = redisUrl.startsWith('rediss://');

  redisClient = createClient({
    url: redisUrl,
    socket: useTls
      ? {
          tls: true,
          rejectUnauthorized: false
        }
      : undefined
  });
  redisClient.on('error', (err) => {
    console.error('Redis hiba:', err);
  });
  redisClient.connect().catch((err) => {
    console.error('Nem sikerult csatlakozni a Redishez:', err);
  });
  sessionStore = new RedisStore({
    client: redisClient,
    prefix: 'fenykepalbum:sess:'
  });
}

if (isProduction && !sessionStore) {
  console.warn('REDIS_URL nincs beallitva, a session tarolas nem lesz tobb dyno-kompatibilis.');
}

app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));
app.use(compression());
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Tul sok belepesi probalkozas. Probald ujra kesobb.' }
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Tul sok feltoltesi keres. Probald ujra kesobb.' }
});

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true });
});

const uploadToCloudinary = (fileBuffer) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'fenykepalbum',
      resource_type: 'image'
    },
    (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    }
  );

  stream.end(fileBuffer);
});

app.get('/api/photos', async (req, res) => {
  try {
    const { sort } = req.query;
    const maxPageSize = 10;
    const requestedPage = Number.parseInt(req.query.page, 10);
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, maxPageSize)
      : maxPageSize;
    const offset = (page - 1) * limit;
    const order = sort === 'date' ? 'upload_date DESC' : 'name ASC';

    const [result, countResult] = await Promise.all([
      pool.query(`
      SELECT p.id, p.name, p.upload_date, p.user_id, u.username as uploader
      FROM photos p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY ${order}
      LIMIT $1 OFFSET $2
    `, [limit, offset]),
      pool.query('SELECT COUNT(*)::int AS total FROM photos')
    ]);

    const total = countResult.rows[0]?.total || 0;
    const hasMore = offset + result.rows.length < total;

    res.json({
      items: result.rows,
      pagination: {
        page,
        limit,
        total,
        hasMore
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a fotók lekérésekor.' });
  }
});

app.get('/api/photos/:id', async (req, res) => {
  try {
    const photo = await pool.query('SELECT * FROM photos WHERE id = $1', [req.params.id]);
    if (photo.rows.length === 0) return res.status(404).json({ error: 'Fotó nem található.' });
    res.json(photo.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a fotó lekérésekor.' });
  }
});

app.post('/api/upload', uploadLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: 'Belépés szükséges!' });
    if (!req.file) return res.status(400).json({ error: 'Nincs kép csatolva!' });
    if (!req.body.name || req.body.name.trim().length === 0) return res.status(400).json({ error: 'A név megadása kötelező!' });
    if (!hasCloudinary) return res.status(503).json({ error: 'A kep tarolo szolgaltatas nincs beallitva.' });

    const uploadResult = await uploadToCloudinary(req.file.buffer);
    const name = req.body.name.trim().substring(0, 40);
    await pool.query(
      'INSERT INTO photos (name, image_url, image_public_id, user_id, upload_date) VALUES ($1, $2, $3, $4, NOW())',
      [name, uploadResult.secure_url, uploadResult.public_id, req.session.userId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a feltöltéskor.' });
  }
});

app.delete('/api/photos/:id', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: 'Belépés szükséges!' });
    const result = await pool.query('DELETE FROM photos WHERE id = $1 RETURNING id, image_public_id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Fotó nem található.' });

    const publicId = result.rows[0].image_public_id;
    if (publicId && hasCloudinary) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      } catch (cloudinaryErr) {
        console.error('Cloudinary torlesi hiba:', cloudinaryErr);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a törléskor.' });
  }
});

app.post('/api/register', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Felhasználónév és jelszó szükséges!' });
    const exists = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (exists.rows.length > 0) return res.status(409).json({ error: 'Ez a felhasználónév már foglalt!' });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username', [username, hash]);
    req.session.userId = result.rows[0].id;
    req.session.username = result.rows[0].username;
    res.json({ username: result.rows[0].username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a regisztrációkor.' });
  }
});

app.post('/api/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Felhasználónév és jelszó szükséges!' });
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user.id;
      req.session.username = user.username;
      return res.json({ username: user.username });
    }
    res.status(401).json({ error: 'Hibás felhasználónév vagy jelszó!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a belépéskor.' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('/api/user', (req, res) => {
  res.json({ user: req.session.username || null, userId: req.session.userId || null });
});

app.use(express.static(path.join(__dirname, 'client/dist')));

app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log('Szerver fut a', port, 'porton');
});

const shutdown = async () => {
  console.log('Leallas folyamatban...');
  server.close(async () => {
    await pool.end();
    if (redisClient) {
      await redisClient.quit();
    }
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (err) => {
  console.error('Nem kezelt Promise hiba:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Nem kezelt kivetel:', err);
});
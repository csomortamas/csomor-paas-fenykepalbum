require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const multer = require('multer');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

app.use(express.json({ limit: '10mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'super_secret_session_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.get('/api/photos', async (req, res) => {
  try {
    const { sort } = req.query;
    const order = sort === 'date' ? 'upload_date DESC' : 'name ASC';
    const result = await pool.query(`
      SELECT p.id, p.name, p.upload_date, p.user_id, u.username as uploader
      FROM photos p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY ${order}
    `);
    res.json(result.rows);
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

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: 'Belépés szükséges!' });
    if (!req.file) return res.status(400).json({ error: 'Nincs kép csatolva!' });
    if (!req.body.name || req.body.name.trim().length === 0) return res.status(400).json({ error: 'A név megadása kötelező!' });

    const imgData = req.file.buffer.toString('base64');
    const name = req.body.name.trim().substring(0, 40);
    await pool.query(
      'INSERT INTO photos (name, image_data, user_id, upload_date) VALUES ($1, $2, $3, NOW())',
      [name, imgData, req.session.userId]
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
    const result = await pool.query('DELETE FROM photos WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Fotó nem található.' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a törléskor.' });
  }
});

app.post('/api/register', async (req, res) => {
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

app.post('/api/login', async (req, res) => {
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

app.listen(process.env.PORT || 3000, () => {
  console.log('Szerver fut a', process.env.PORT || 3000, 'porton');
});
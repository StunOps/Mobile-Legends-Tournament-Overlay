const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure asset directories exist
['public/assets/logos', 'public/assets/photos', 'public/assets/sponsors', 'public/assets/organizers', 'public/fonts']
  .forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
  });

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.query.type || 'logos';
    const uploadDir = path.join(__dirname, 'public', 'assets', type);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage });

// --- API ---

// Get overlay data
app.get('/api/data', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// Save overlay data
app.post('/api/data', (req, res) => {
  try {
    fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Upload a file (logo, photo, sponsor)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const type = req.query.type || 'logos';
  res.json({ success: true, path: `/assets/${type}/${req.file.filename}` });
});

// Delete a file
app.delete('/api/file', (req, res) => {
  try {
    const fullPath = path.join(__dirname, 'public', req.body.filePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// --- Turtle / Lord Video Trigger ---
let tlState = { triggerId: null, video: null, type: null };

// Panel sends a trigger
app.post('/api/tl-trigger', (req, res) => {
  const { video, type } = req.body;
  if (!video || !type) return res.status(400).json({ error: 'Missing video or type' });
  tlState = { triggerId: Date.now().toString(), video, type };
  res.json({ success: true });
});

// Overlay polls for current trigger
app.get('/api/tl-status', (req, res) => {
  res.json(tlState);
});

// Overlay signals playback finished
app.post('/api/tl-clear', (req, res) => {
  tlState = { triggerId: null, video: null, type: null };
  res.json({ success: true });
});

// --- In-Game Timer ---
let timerState = { running: false, startedAt: null, elapsed: 0 };

app.get('/api/timer', (req, res) => {
  let elapsed = timerState.elapsed;
  if (timerState.running && timerState.startedAt) {
    elapsed += (Date.now() - timerState.startedAt) / 1000;
  }
  res.json({ running: timerState.running, elapsed });
});

app.post('/api/timer/start', (req, res) => {
  if (!timerState.running) {
    timerState.running = true;
    timerState.startedAt = Date.now();
  }
  res.json({ success: true });
});

app.post('/api/timer/pause', (req, res) => {
  if (timerState.running) {
    timerState.elapsed += (Date.now() - timerState.startedAt) / 1000;
    timerState.running = false;
    timerState.startedAt = null;
  }
  res.json({ success: true });
});

app.post('/api/timer/reset', (req, res) => {
  timerState = { running: false, startedAt: null, elapsed: 0 };
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`\n  🎮  ML Live Overlay Server`);
  console.log(`  ─────────────────────────`);
  console.log(`  📺  Initial:    http://localhost:${PORT}/initial.html`);
  console.log(`  🕹️   In-Game:    http://localhost:${PORT}/ingame.html`);
  console.log(`  🎤  Interview:  http://localhost:${PORT}/interview.html`);
  console.log(`  🎛️   Admin:      http://localhost:${PORT}/admin.html`);
  console.log(`  🐢  TL Panel:   http://localhost:${PORT}/tl-panel.html`);
  console.log(`  🎬  TL Overlay: http://localhost:${PORT}/tl-overlay.html\n`);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// JSON body parser (50MB limit for base64 images)
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ══════════════════════════════════════
//  In-memory work storage (works without Firebase)
// ══════════════════════════════════════
const works = new Map();

// Save a work
app.post('/api/works/:id', (req, res) => {
  const id = req.params.id;
  works.set(id, { ...req.body, savedAt: Date.now() });
  console.log(`Work saved: ${id} (total: ${works.size})`);
  res.json({ ok: true, id });
});

// Get a work
app.get('/api/works/:id', (req, res) => {
  const id = req.params.id;
  const work = works.get(id);
  if (!work) return res.status(404).json({ error: 'Not found' });
  res.json(work);
});

// List all works (for gallery)
app.get('/api/works', (req, res) => {
  const list = [];
  works.forEach((val, key) => list.push({ id: key, ...val }));
  list.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  res.json(list.slice(0, 50));
});

// Global mood state
let globalMood = { melt: 0, tiltshift: 0, badtv: 0, edge: 0, slices: 0, vignette: 0, wobble: 0, polar: 0, smear: 0, dot: 0 };

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('draw', (data) => socket.broadcast.emit('draw', data));
  socket.on('emotion', (data) => socket.broadcast.emit('emotion', data));
  socket.on('vaseShape', (data) => socket.broadcast.emit('vaseShape', data));

  socket.on('save', (data) => {
    console.log('Save triggered, forwarding to viewer...');
    socket.broadcast.emit('save', data);
  });

  socket.on('saveComplete', (data) => {
    console.log(`Save complete: workId=${data.workId}`);
    socket.broadcast.emit('saveComplete', data);
  });

  socket.on('enterGallery', () => socket.broadcast.emit('enterGallery'));
  socket.on('exitGallery', () => socket.broadcast.emit('exitGallery'));
  socket.on('loadWork', (data) => socket.broadcast.emit('loadWork', data));

  socket.on('updateGlobalMood', (data) => {
    globalMood = data;
    io.emit('globalMood', globalMood);
  });

  socket.emit('globalMood', globalMood);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Controller: http://localhost:${PORT}?role=controller`);
  console.log(`Viewer:     http://localhost:${PORT}?role=viewer`);
});

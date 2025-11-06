const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// --- In-memory database for mock data ---
let users = [
  { id: 1, email: 'alice@tudominio.com', domain: 'tudominio.com', quota: 500, status: 'active', createdAt: new Date().toISOString() },
  { id: 2, email: 'bob@tudominio.com', domain: 'tudominio.com', quota: 500, status: 'active', createdAt: new Date().toISOString() },
  { id: 3, email: 'charlie@example.org', domain: 'example.org', quota: 1000, status: 'blocked', createdAt: new Date().toISOString() },
];
let nextUserId = 4;

// --- Admin API Endpoints ---

// Get all users
app.get('/admin/users', (req, res) => {
  res.json(users);
});

// Create a new user
app.post('/admin/users', (req, res) => {
  const { email, quota } = req.body;
  if (!email || !quota) {
    return res.status(400).json({ error: 'Email and quota are required' });
  }
  const newUser = {
    id: nextUserId++,
    email,
    domain: email.split('@')[1],
    quota: parseInt(quota, 10),
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  res.status(201).json(newUser);
});

// Delete a user
app.delete('/admin/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  users = users.filter(user => user.id !== userId);
  res.status(204).send();
});

// Export a user's mailbox
app.post('/admin/users/:id/export', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  console.log(`Simulating mailbox export for user ${user.email}...`);
  // Simulate an async job
  setTimeout(() => {
    console.log(`Export for ${user.email} completed.`);
  }, 3000);
  res.status(202).json({ message: `Mailbox export started for ${user.email}.` });
});


// --- IT API Endpoints ---

// Get system health metrics
app.get('/it/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: '2d 4h 32m',
    smtpQueue: Math.floor(Math.random() * 10),
    jmapRequests: Math.floor(Math.random() * 100) + 50,
    cpuUsage: `${(Math.random() * 20 + 5).toFixed(2)}%`,
    memoryUsage: '4.2 GB / 16 GB',
  });
});

// Get backup status
app.get('/it/backups', (req, res) => {
  res.json({
    lastBackup: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    status: 'success',
    size: '128.4 GB',
    nextBackup: new Date(Date.now() + 3600 * 1000 * 20).toISOString(),
  });
});


app.listen(port, () => {
  console.log(`Mock API server listening at http://localhost:${port}`);
});

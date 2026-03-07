require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// ── CORS — accept requests from React frontend ──
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ── Request logger ──
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// ── Routes ──
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/clubs', require('./routes/clubs'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/club-requests', require('./routes/clubRequests'));

// ── Health check ──
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── MongoDB connection ──
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://admin:admin123@cluster0.b5kri5x.mongodb.net/campus-connect?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

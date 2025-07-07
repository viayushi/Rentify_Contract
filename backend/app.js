const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const path = require('path');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/property');
const chatRoutes = require('./routes/chat');
const contractRoutes = require('./routes/contract');
const userRoutes = require('./routes/user');

app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/property', propertyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/contract', contractRoutes);
app.use('/api/user', userRoutes);

app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app; 
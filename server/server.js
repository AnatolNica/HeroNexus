const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const NodeCache = require('node-cache');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const friendsRouter = require('./routes/friends');
const userRoutes = require('./routes/user');
const marvelRouter = require('./routes/marvel');
const reviewRoutes = require('./routes/reviews');
const cartRoutes = require('./routes/cartuser');
const adminRoutes = require('./routes/Admin');
const favoritesRouter = require('./routes/favorites');
const contactRoutes = require('./routes/contactRoutes');
const offerRoutes = require('./routes/AllOffers');
const collectionsRoutes = require('./routes/collections');
const roulettes = require('./routes/Roulette');
const tradesRouter = require('./routes/trades');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swaggerOptions');
const app = express();

app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  exposedHeaders: ['Content-Length', 'Authorization']
}));

app.use(express.json({ limit: '45mb' }));
app.use(express.urlencoded({ extended: true, limit: '45mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const marvelCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
app.set('marvelCache', marvelCache);
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/friends', friendsRouter);
app.use('/api/user', userRoutes);
app.use('/api/marvel', marvelRouter);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorites', favoritesRouter);
app.use('/api/cart', cartRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/roulettes', roulettes);
app.use('/api/trades', tradesRouter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(` [${new Date().toISOString()}] Error: ${err.message}`);

  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

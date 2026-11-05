const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

const path = require('path');

require('dotenv').config({
    path: path.resolve(__dirname, '.env')
});

const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const transactionRoutes = require('./routes/transactions');
const dashboardRoutes = require('./routes/dashboard');
const quickItemRoutes = require('./routes/quickItems');
const { checkLowStock } = require('./services/emailService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/quick-items', quickItemRoutes);

// MongoDB Connection
const startServer = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is missing. Check your .env file.');
        }

        await mongoose.connect(process.env.MONGODB_URI);

        console.log('MongoDB Atlas connected successfully');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};
// Schedule low stock check every day at 9 AM
cron.schedule('0 9 * * *', () => {
  console.log('Running scheduled low stock check...');
  checkLowStock();
});

const PORT = process.env.PORT || 5000;
startServer();


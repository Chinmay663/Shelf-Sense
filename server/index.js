
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

// Load environment variables from server/.env
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

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// ------------------------------------
// MIDDLEWARE
// ------------------------------------

// CORS only in development.
// Production frontend and backend share the same origin.
if (!isProduction) {
    app.use(cors({
        origin: 'http://localhost:3000'
    }));
}

app.use(express.json());

// ------------------------------------
// HEALTH CHECK
// ------------------------------------

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        environment: NODE_ENV,
        database:
            mongoose.connection.readyState === 1
                ? 'connected'
                : 'disconnected'
    });
});

// ------------------------------------
// API ROUTES
// ------------------------------------

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/quick-items', quickItemRoutes);

// ------------------------------------
// PRODUCTION: SERVE REACT BUILD
// ------------------------------------

if (isProduction) {
    const clientBuildPath = path.resolve(
        __dirname,
        '../client/build'
    );

    if (!fs.existsSync(clientBuildPath)) {
        throw new Error(
            'React production build not found. Run npm run build first.'
        );
    }

    app.use(express.static(clientBuildPath));

    // React Router fallback
    app.get('*', (req, res, next) => {

        if (req.path.startsWith('/api')) {
            return next();
        }

        if (!req.accepts('html')) {
            return next();
        }

        res.sendFile(
            path.join(clientBuildPath, 'index.html')
        );
    });
}

// ------------------------------------
// API 404 HANDLER
// ------------------------------------

app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// ------------------------------------
// DATABASE + SERVER STARTUP
// ------------------------------------

const startServer = async () => {
    try {

        if (!process.env.MONGODB_URI) {
            throw new Error(
                'MONGODB_URI is missing. Check environment configuration.'
            );
        }

        await mongoose.connect(process.env.MONGODB_URI);

        console.log('MongoDB connected successfully');
        console.log(`Environment: ${NODE_ENV}`);

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {

        console.error('Application startup failed:', error.message);

        process.exit(1);
    }
};

// ------------------------------------
// SCHEDULED LOW-STOCK CHECK
// ------------------------------------

cron.schedule(
    '0 9 * * *',
    async () => {
        try {
            console.log('Running scheduled low-stock check...');

            await checkLowStock();

        } catch (error) {
            console.error('Low-stock check failed:', error);
        }
    },
    {
        timezone: 'Asia/Kolkata'
    }
);

// Start application
startServer();

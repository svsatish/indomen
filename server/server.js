import express from 'express';
import session from 'express-session';
import FileStore from 'session-file-store';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from './config/database.js';

import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import settingsRoutes from './routes/settings.js';
import auditLogRoutes from './routes/auditLog.js';
import paymentRoutes from './routes/payment.js';
import uploadRoutes from './routes/upload.js';
import searchRoutes from './routes/search.js';
import analyticsRoutes from './routes/analytics.js';
import creditsRoutes from './routes/credits.js';
import notificationRoutes from './routes/notifications.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize file-based session store
const FileStoreSession = FileStore(session);

// Connect to MongoDB
connectDB().catch(err => {
    console.error('⚠️  Failed to connect to MongoDB:', err.message);
    console.log('');
    console.log('📝 To fix this:');
    console.log('   1. Set up MongoDB Atlas (FREE): https://cloud.mongodb.com');
    console.log('   2. Update MONGODB_URI in server/.env file');
    console.log('   3. Or install MongoDB locally');
    console.log('');
    console.log('ℹ️  See MONGODB_ERROR_FIX.md for detailed instructions');
    console.log('');
    console.log('⚡ Server will continue running without database...');
    console.log('   (JSON files in server/data/ will be used instead)');
    console.log('');
});

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration with file-based store for persistence
app.use(session({
    store: new FileStoreSession({
        path: path.join(__dirname, 'sessions'),
        ttl: 86400, // 24 hours in seconds
        retries: 0
    }),
    secret: process.env.SESSION_SECRET || 'fresh-farm-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    },
    name: 'sessionId' // Custom session cookie name
}));

// Debug middleware to log session info
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        console.log(`🔍 ${req.method} ${req.path} | SessionID: ${req.sessionID} | User: ${req.session.userId || 'none'} | Role: ${req.session.userRole || 'none'}`);
    }
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-log', auditLogRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});

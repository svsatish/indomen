import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/indomen';

let isConnected = false;

export const connectDB = async () => {
    if (isConnected) {
        console.log('✅ Using existing database connection');
        return;
    }

    try {
        // These options are no longer needed in Mongoose 6+
        const db = await mongoose.connect(MONGODB_URI);

        isConnected = db.connections[0].readyState === 1;
        console.log('✅ MongoDB connected successfully');
        console.log(`📦 Database: ${db.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error; // Let the caller handle the error
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('📴 MongoDB connection closed through app termination');
    process.exit(0);
});

export default connectDB;


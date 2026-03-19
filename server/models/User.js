import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['customer', 'admin', 'kiosk'],
        default: 'customer'
    },
    accountId: {
        type: String,
        default: null
    },
    accountRole: {
        type: String,
        enum: ['admin', 'member', 'viewer'],
        default: null
    },
    permissions: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ accountId: 1 });

export default mongoose.model('User', userSchema);


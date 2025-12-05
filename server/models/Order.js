import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: String,
    price: Number,
    quantity: Number,
    unit: String,
    category: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    accountId: {
        type: String,
        default: null
    },
    placedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    items: [orderItemSchema],
    total: {
        type: Number,
        required: true,
        min: 0
    },
    pickupLocation: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'ready', 'completed', 'cancelled'],
        default: 'pending'
    },
    paymentId: {
        type: String,
        default: ''
    },
    paymentMethod: {
        type: String,
        enum: ['stripe', 'cash', 'demo'],
        default: 'stripe'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    fulfilledAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for faster queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ pickupLocation: 1, status: 1 });
orderSchema.index({ accountId: 1 });

export default mongoose.model('Order', orderSchema);


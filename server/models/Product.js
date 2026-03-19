import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['dairy', 'eggs', 'juices', 'bread', 'vegetables', 'fruits', 'misc']
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: '/images/default.jpg'
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for faster queries
productSchema.index({ category: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ name: 'text' }); // Text search

export default mongoose.model('Product', productSchema);


import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const productsPath = path.join(__dirname, '../data/products.json');

// Get all products (public)
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        const data = await fs.readFile(productsPath, 'utf-8');
        let products = JSON.parse(data);

        if (category) {
            products = products.filter(p => p.category === category);
        }

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single product (public)
router.get('/:id', async (req, res) => {
    try {
        const data = await fs.readFile(productsPath, 'utf-8');
        const products = JSON.parse(data);
        const product = products.find(p => p.id === req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create product (admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const data = await fs.readFile(productsPath, 'utf-8');
        const products = JSON.parse(data);

        const newProduct = {
            id: String(Date.now()),
            ...req.body,
            createdAt: new Date().toISOString()
        };

        products.push(newProduct);
        await fs.writeFile(productsPath, JSON.stringify(products, null, 2));

        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update product (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const data = await fs.readFile(productsPath, 'utf-8');
        const products = JSON.parse(data);
        const index = products.findIndex(p => p.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }

        products[index] = {
            ...products[index],
            ...req.body,
            id: req.params.id,
            updatedAt: new Date().toISOString()
        };

        await fs.writeFile(productsPath, JSON.stringify(products, null, 2));
        res.json(products[index]);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete product (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const data = await fs.readFile(productsPath, 'utf-8');
        let products = JSON.parse(data);
        const index = products.findIndex(p => p.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }

        products = products.filter(p => p.id !== req.params.id);
        await fs.writeFile(productsPath, JSON.stringify(products, null, 2));

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;

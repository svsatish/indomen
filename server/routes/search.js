import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const productsPath = path.join(__dirname, '../data/products.json');

// Advanced search endpoint
router.get('/search', async (req, res) => {
    try {
        const {
            q,              // Search query
            category,       // Category filter
            minPrice,       // Minimum price
            maxPrice,       // Maximum price
            inStock,        // Only in-stock items
            featured,       // Only featured items
            sortBy,         // Sort field (name, price, stock)
            sortOrder       // Sort order (asc, desc)
        } = req.query;

        console.log('🔍 Search request:', req.query);

        // Load products
        const data = await fs.readFile(productsPath, 'utf-8');
        let products = JSON.parse(data);

        // Filter by search query
        if (q && q.trim()) {
            const searchTerm = q.toLowerCase().trim();
            products = products.filter(product => {
                const nameMatch = product.name.toLowerCase().includes(searchTerm);
                const descriptionMatch = product.description?.toLowerCase().includes(searchTerm) || false;
                const categoryMatch = product.category.toLowerCase().includes(searchTerm);
                return nameMatch || descriptionMatch || categoryMatch;
            });
            console.log(`📝 Search "${q}": ${products.length} results`);
        }

        // Filter by category
        if (category && category !== 'all') {
            products = products.filter(product => product.category === category);
            console.log(`🏷️  Category "${category}": ${products.length} results`);
        }

        // Filter by price range
        if (minPrice !== undefined) {
            const min = parseFloat(minPrice);
            if (!isNaN(min)) {
                products = products.filter(product => product.price >= min);
                console.log(`💰 Min price $${min}: ${products.length} results`);
            }
        }

        if (maxPrice !== undefined) {
            const max = parseFloat(maxPrice);
            if (!isNaN(max)) {
                products = products.filter(product => product.price <= max);
                console.log(`💰 Max price $${max}: ${products.length} results`);
            }
        }

        // Filter by stock availability
        if (inStock === 'true') {
            products = products.filter(product => product.stock > 0);
            console.log(`📦 In stock only: ${products.length} results`);
        }

        // Filter by featured
        if (featured === 'true') {
            products = products.filter(product => product.featured === true);
            console.log(`⭐ Featured only: ${products.length} results`);
        }

        // Sort products
        if (sortBy) {
            const order = sortOrder === 'desc' ? -1 : 1;
            products.sort((a, b) => {
                let aVal, bVal;

                switch (sortBy) {
                    case 'name':
                        aVal = a.name.toLowerCase();
                        bVal = b.name.toLowerCase();
                        return aVal < bVal ? -order : aVal > bVal ? order : 0;

                    case 'price':
                        aVal = a.price;
                        bVal = b.price;
                        return (aVal - bVal) * order;

                    case 'stock':
                        aVal = a.stock;
                        bVal = b.stock;
                        return (aVal - bVal) * order;

                    default:
                        return 0;
                }
            });
            console.log(`🔀 Sorted by ${sortBy} (${sortOrder || 'asc'})`);
        }

        console.log(`✅ Returning ${products.length} products`);

        res.json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        console.error('❌ Search error:', error);
        res.status(500).json({ error: 'Failed to search products' });
    }
});

// Get filter options (categories, price range, etc.)
router.get('/filters', async (req, res) => {
    try {
        const data = await fs.readFile(productsPath, 'utf-8');
        const products = JSON.parse(data);

        // Get unique categories
        const categories = [...new Set(products.map(p => p.category))].sort();

        // Get price range
        const prices = products.map(p => p.price);
        const minPrice = Math.floor(Math.min(...prices));
        const maxPrice = Math.ceil(Math.max(...prices));

        // Count products by category
        const categoryCounts = {};
        products.forEach(product => {
            categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
        });

        const filters = {
            categories: categories.map(cat => ({
                value: cat,
                label: cat.charAt(0).toUpperCase() + cat.slice(1),
                count: categoryCounts[cat] || 0
            })),
            priceRange: {
                min: minPrice,
                max: maxPrice
            },
            totalProducts: products.length,
            inStockCount: products.filter(p => p.stock > 0).length,
            featuredCount: products.filter(p => p.featured).length
        };

        res.json(filters);

    } catch (error) {
        console.error('Error getting filters:', error);
        res.status(500).json({ error: 'Failed to get filter options' });
    }
});

export default router;


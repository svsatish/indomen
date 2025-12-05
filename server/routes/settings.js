import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const settingsPath = path.join(__dirname, '../data/settings.json');

// Get settings (public)
router.get('/', async (req, res) => {
    try {
        const data = await fs.readFile(settingsPath, 'utf-8');
        const settings = JSON.parse(data);
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update settings (admin only)
router.put('/', requireAdmin, async (req, res) => {
    try {
        const settings = {
            ...req.body,
            updatedAt: new Date().toISOString()
        };

        await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
        res.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;

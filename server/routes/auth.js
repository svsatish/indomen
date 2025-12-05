import express from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const usersData = await fs.readFile(
            path.join(__dirname, '../data/users.json'),
            'utf-8'
        );
        const users = JSON.parse(usersData);

        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Set session
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.userName = user.name;
        req.session.userRole = user.role;

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

// Get current session
router.get('/session', (req, res) => {
    if (req.session.userId) {
        res.json({
            user: {
                id: req.session.userId,
                email: req.session.userEmail,
                name: req.session.userName,
                role: req.session.userRole
            }
        });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

export default router;

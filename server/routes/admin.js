import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const usersPath = path.join(__dirname, '../data/users.json');
const noticesPath = path.join(__dirname, '../data/notices.json');

// Get all users (admin only)
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const data = await fs.readFile(usersPath, 'utf-8');
        const users = JSON.parse(data);

        // Remove passwords from response
        const safeUsers = users.map(({ password, ...user }) => user);

        res.json(safeUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create user (admin only)
router.post('/users', requireAdmin, async (req, res) => {
    try {
        const data = await fs.readFile(usersPath, 'utf-8');
        const users = JSON.parse(data);

        const { email, password, name, phone, address, role } = req.body;

        // Check if user already exists
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: String(Date.now()),
            email,
            password: hashedPassword,
            name,
            phone,
            address,
            role: role || 'customer', // Support role assignment
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));

        // Remove password from response
        const { password: _, ...safeUser } = newUser;
        res.status(201).json(safeUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user (admin only)
router.put('/users/:id', requireAdmin, async (req, res) => {
    try {
        const data = await fs.readFile(usersPath, 'utf-8');
        const users = JSON.parse(data);
        const index = users.findIndex(u => u.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updates = { ...req.body };

        // Hash password if being updated
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        users[index] = {
            ...users[index],
            ...updates,
            id: req.params.id,
            updatedAt: new Date().toISOString()
        };

        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));

        const { password: _, ...safeUser } = users[index];
        res.json(safeUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user (admin only)
router.delete('/users/:id', requireAdmin, async (req, res) => {
    try {
        const data = await fs.readFile(usersPath, 'utf-8');
        let users = JSON.parse(data);

        const userToDelete = users.find(u => u.id === req.params.id);
        if (!userToDelete) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deleting yourself
        if (req.session.userId === req.params.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        users = users.filter(u => u.id !== req.params.id);
        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


// Get notices (public)
router.get('/notices', async (req, res) => {
    try {
        const data = await fs.readFile(noticesPath, 'utf-8');
        const notices = JSON.parse(data);

        // Only return active notices for non-admin users
        const activeNotices = notices.filter(n => n.active);

        res.json(activeNotices);
    } catch (error) {
        console.error('Error fetching notices:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create/update notice (admin only)
router.post('/notices', requireAdmin, async (req, res) => {
    try {
        const data = await fs.readFile(noticesPath, 'utf-8');
        const notices = JSON.parse(data);

        const newNotice = {
            id: String(Date.now()),
            ...req.body,
            createdAt: new Date().toISOString()
        };

        notices.push(newNotice);
        await fs.writeFile(noticesPath, JSON.stringify(notices, null, 2));

        res.status(201).json(newNotice);
    } catch (error) {
        console.error('Error creating notice:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete notice (admin only)
router.delete('/notices/:id', requireAdmin, async (req, res) => {
    try {
        const data = await fs.readFile(noticesPath, 'utf-8');
        let notices = JSON.parse(data);

        notices = notices.filter(n => n.id !== req.params.id);
        await fs.writeFile(noticesPath, JSON.stringify(notices, null, 2));

        res.json({ message: 'Notice deleted successfully' });
    } catch (error) {
        console.error('Error deleting notice:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;

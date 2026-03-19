import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const notificationsPath = path.join(__dirname, '../data/notifications.json');

// Get user's unread notifications
router.get('/unread', requireAuth, async (req, res) => {
    try {
        const data = await fs.readFile(notificationsPath, 'utf-8');
        const notifications = JSON.parse(data);

        const userNotifications = notifications.filter(
            n => n.userId === req.session.userId && n.status === 'unread'
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(userNotifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark notification as read
router.put('/:id/read', requireAuth, async (req, res) => {
    try {
        const data = await fs.readFile(notificationsPath, 'utf-8');
        const notifications = JSON.parse(data);

        const index = notifications.findIndex(
            n => n.id === req.params.id && n.userId === req.session.userId
        );

        if (index === -1) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        notifications[index].status = 'read';
        notifications[index].readAt = new Date().toISOString();

        await fs.writeFile(notificationsPath, JSON.stringify(notifications, null, 2));

        res.json(notifications[index]);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark all notifications as read
router.put('/read-all', requireAuth, async (req, res) => {
    try {
        const data = await fs.readFile(notificationsPath, 'utf-8');
        const notifications = JSON.parse(data);

        let updatedCount = 0;

        notifications.forEach(n => {
            if (n.userId === req.session.userId && n.status === 'unread') {
                n.status = 'read';
                n.readAt = new Date().toISOString();
                updatedCount++;
            }
        });

        await fs.writeFile(notificationsPath, JSON.stringify(notifications, null, 2));

        res.json({ message: `${updatedCount} notifications marked as read` });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Helper function to create notification (can be called from other routes)
export const createNotification = async (userId, userEmail, userName, type, message, amount = null, relatedId = null) => {
    try {
        const data = await fs.readFile(notificationsPath, 'utf-8');
        const notifications = JSON.parse(data);

        const notification = {
            id: `NOTIF_${Date.now()}`,
            userId,
            userEmail,
            userName,
            type, // 'credit', 'debit', 'info', 'warning', 'success'
            message,
            amount,
            relatedId, // Order ID, Credit ID, etc.
            status: 'unread', // 'unread', 'read'
            createdAt: new Date().toISOString(),
            readAt: null
        };

        notifications.push(notification);
        await fs.writeFile(notificationsPath, JSON.stringify(notifications, null, 2));

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

export default router;


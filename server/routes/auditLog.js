import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const auditLogPath = path.join(__dirname, '../data/audit_log.json');

// Get audit logs (admin only)
router.get('/', requireAdmin, async (req, res) => {
    try {
        const { limit = 100, action, userId, startDate, endDate } = req.query;

        // Read audit logs
        let logs = [];
        try {
            const data = await fs.readFile(auditLogPath, 'utf-8');
            logs = JSON.parse(data);
        } catch (error) {
            // File doesn't exist yet
            return res.json([]);
        }

        // Apply filters
        let filteredLogs = logs;

        if (action) {
            filteredLogs = filteredLogs.filter(log => log.action === action);
        }

        if (userId) {
            filteredLogs = filteredLogs.filter(log => log.userId === userId);
        }

        if (startDate) {
            const start = new Date(startDate);
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start);
        }

        if (endDate) {
            const end = new Date(endDate);
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end);
        }

        // Limit results
        const limitedLogs = filteredLogs.slice(0, parseInt(limit));

        res.json(limitedLogs);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get audit log statistics
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        const data = await fs.readFile(auditLogPath, 'utf-8');
        const logs = JSON.parse(data);

        const stats = {
            totalEvents: logs.length,
            actionCounts: {},
            userCounts: {},
            recentActivity: logs.slice(0, 10)
        };

        // Count by action type
        logs.forEach(log => {
            stats.actionCounts[log.action] = (stats.actionCounts[log.action] || 0) + 1;
            stats.userCounts[log.userName] = (stats.userCounts[log.userName] || 0) + 1;
        });

        res.json(stats);
    } catch (error) {
        console.error('Error fetching audit stats:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;

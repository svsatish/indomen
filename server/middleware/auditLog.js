// Audit logging middleware for admin actions
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const auditLogPath = path.join(__dirname, '../data/audit_log.json');

export const logAuditEvent = async (req, action, details = {}) => {
    try {
        // Read existing logs
        let logs = [];
        try {
            const data = await fs.readFile(auditLogPath, 'utf-8');
            logs = JSON.parse(data);
        } catch (error) {
            // File doesn't exist yet, will be created
            logs = [];
        }

        // Create audit entry
        const auditEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            userId: req.session?.userId || 'unknown',
            userName: req.session?.userName || 'Unknown User',
            userEmail: req.session?.userEmail || 'unknown@email.com',
            action,
            details,
            ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown'
        };

        // Add to logs
        logs.unshift(auditEntry); // Add to beginning for most recent first

        // Keep only last 1000 entries to prevent file from growing too large
        if (logs.length > 1000) {
            logs = logs.slice(0, 1000);
        }

        // Write back to file
        await fs.writeFile(auditLogPath, JSON.stringify(logs, null, 2));

        return auditEntry;
    } catch (error) {
        console.error('Error logging audit event:', error);
    }
};

// Middleware to automatically log admin actions
export const auditMiddleware = (action) => {
    return async (req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json method to log after successful response
        res.json = function (data) {
            // Only log if response is successful (2xx status)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                logAuditEvent(req, action, {
                    method: req.method,
                    path: req.path,
                    body: req.body,
                    params: req.params,
                    query: req.query,
                    response: data
                }).catch(err => console.error('Audit logging failed:', err));
            }
            return originalJson(data);
        };

        next();
    };
};

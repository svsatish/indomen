import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, requireAdmin, requireAdminOrKiosk } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/auditLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const ordersPath = path.join(__dirname, '../data/orders.json');

// Get orders (user gets their own, admin gets all)
router.get('/', requireAuth, async (req, res) => {
    try {
        const data = await fs.readFile(ordersPath, 'utf-8');
        let orders = JSON.parse(data);

        // If not admin or kiosk, filter to user's orders only
        if (req.session.userRole !== 'admin' && req.session.userRole !== 'kiosk') {
            orders = orders.filter(o => o.userId === req.session.userId);
        }

        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single order
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const data = await fs.readFile(ordersPath, 'utf-8');
        const orders = JSON.parse(data);
        const order = orders.find(o => o.id === req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if user owns this order or is admin/kiosk
        if (order.userId !== req.session.userId &&
            req.session.userRole !== 'admin' &&
            req.session.userRole !== 'kiosk') {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create order
router.post('/', requireAuth, async (req, res) => {
    try {
        const data = await fs.readFile(ordersPath, 'utf-8');
        const orders = JSON.parse(data);

        // Generate order ID: FirstNameLastName_MMDDYYYY_HHMM
        const nameParts = req.session.userName.split(' ');
        const firstName = nameParts[0] || 'Customer';
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

        const date = new Date();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        const dateStr = `${month}${day}${year}`;
        const timeStr = `${hours}${minutes}`;
        const orderId = `${firstName}${lastName}_${dateStr}_${timeStr}`;

        const newOrder = {
            id: orderId,
            userId: req.session.userId,
            userName: req.session.userName,
            userEmail: req.session.userEmail,
            items: req.body.items,
            total: req.body.total,
            pickupLocation: req.body.pickupLocation,
            phone: req.body.phone,
            notes: req.body.notes,
            status: 'submitted',
            createdAt: new Date().toISOString()
        };

        orders.push(newOrder);
        await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2));

        res.status(201).json(newOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update order status (admin or kiosk)
router.put('/:id', requireAdminOrKiosk, async (req, res) => {
    try {
        const data = await fs.readFile(ordersPath, 'utf-8');
        const orders = JSON.parse(data);
        const index = orders.findIndex(o => o.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ error: 'Order not found' });
        }

        orders[index] = {
            ...orders[index],
            ...req.body,
            id: req.params.id,
            updatedAt: new Date().toISOString()
        };

        await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2));

        // Log audit event
        await logAuditEvent(req, 'ORDER_STATUS_UPDATED', {
            orderId: req.params.id,
            previousStatus: orders[index].status,
            newStatus: req.body.status,
            previousPaymentStatus: orders[index].paymentStatus,
            newPaymentStatus: req.body.paymentStatus
        });

        res.json(orders[index]);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


// Archive orders (admin only)
router.post('/archive', requireAdmin, async (req, res) => {
    try {
        const { orderIds } = req.body;

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({ error: 'Invalid order IDs' });
        }

        // Read current orders
        const ordersData = await fs.readFile(ordersPath, 'utf-8');
        const orders = JSON.parse(ordersData);

        // Find orders to archive
        const ordersToArchive = orders.filter(o => orderIds.includes(o.id));
        const remainingOrders = orders.filter(o => !orderIds.includes(o.id));

        if (ordersToArchive.length === 0) {
            return res.status(404).json({ error: 'No orders found to archive' });
        }

        // Read or create archive file
        const archivePath = path.join(__dirname, '../data/orders_archive.json');
        let archivedOrders = [];

        try {
            const archiveData = await fs.readFile(archivePath, 'utf-8');
            archivedOrders = JSON.parse(archiveData);
        } catch (error) {
            // Archive file doesn't exist yet, will be created
            archivedOrders = [];
        }

        // Add archived timestamp to orders
        const timestampedOrders = ordersToArchive.map(order => ({
            ...order,
            archivedAt: new Date().toISOString()
        }));

        // Append to archive
        archivedOrders.push(...timestampedOrders);

        // Write both files
        await fs.writeFile(archivePath, JSON.stringify(archivedOrders, null, 2));
        await fs.writeFile(ordersPath, JSON.stringify(remainingOrders, null, 2));

        // Log audit event
        await logAuditEvent(req, 'ORDERS_ARCHIVED', {
            orderIds,
            count: ordersToArchive.length,
            orderDetails: ordersToArchive.map(o => ({
                id: o.id,
                customer: o.userName,
                total: o.total,
                status: o.status
            }))
        });

        res.json({
            message: `${ordersToArchive.length} orders archived successfully`,
            archivedCount: ordersToArchive.length
        });
    } catch (error) {
        console.error('Error archiving orders:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;

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

        console.log('📋 Fetching orders for session:', {
            userId: req.session.userId,
            userEmail: req.session.userEmail,
            role: req.session.userRole
        });
        console.log(`📦 Total orders in database: ${orders.length}`);

        // If not admin or kiosk, filter to user's orders only
        if (req.session.userRole !== 'admin' && req.session.userRole !== 'kiosk') {
            const userOrders = orders.filter(o => o.userId === req.session.userId);
            console.log(`👤 User's orders filtered: ${userOrders.length}`);
            orders = userOrders;
        }

        console.log(`✅ Returning ${orders.length} orders`);
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

        console.log('🛒 Creating new order for session:', {
            userId: req.session.userId,
            userEmail: req.session.userEmail,
            userName: req.session.userName
        });

        // ===== SECURITY: Validate prices against actual product database =====
        const productsPath = path.join(__dirname, '../data/products.json');
        const productsData = await fs.readFile(productsPath, 'utf-8');
        const products = JSON.parse(productsData);

        // Create a map of product IDs to prices for quick lookup
        const productPriceMap = {};
        products.forEach(p => {
            productPriceMap[p.id] = p.price;
        });

        // Validate each item and recalculate total
        let validatedItems = [];
        let calculatedTotal = 0;

        for (const item of req.body.items) {
            const actualPrice = productPriceMap[item.productId];

            if (!actualPrice) {
                console.warn(`⚠️ Product not found: ${item.productId}`);
                return res.status(400).json({
                    error: `Product not found: ${item.name}`
                });
            }

            // Check if the submitted price matches the actual price
            if (Math.abs(item.price - actualPrice) > 0.01) {
                console.warn(`🚨 PRICE MANIPULATION DETECTED!`, {
                    productId: item.productId,
                    submittedPrice: item.price,
                    actualPrice: actualPrice,
                    userId: req.session.userId
                });

                // Log security event
                await logAuditEvent(req, 'SECURITY_PRICE_MANIPULATION', {
                    productId: item.productId,
                    productName: item.name,
                    submittedPrice: item.price,
                    actualPrice: actualPrice,
                    difference: item.price - actualPrice
                });

                return res.status(400).json({
                    error: 'Price mismatch detected. Please refresh and try again.'
                });
            }

            // Use the actual price from database (not submitted price)
            validatedItems.push({
                productId: item.productId,
                name: item.name,
                price: actualPrice, // Use actual price from database
                quantity: item.quantity,
                unit: item.unit,
                category: item.category
            });

            calculatedTotal += actualPrice * item.quantity;
        }

        // Check if submitted total matches calculated total
        if (Math.abs(req.body.total - calculatedTotal) > 0.01) {
            console.warn(`🚨 TOTAL MANIPULATION DETECTED!`, {
                submittedTotal: req.body.total,
                calculatedTotal: calculatedTotal,
                userId: req.session.userId
            });

            await logAuditEvent(req, 'SECURITY_TOTAL_MANIPULATION', {
                submittedTotal: req.body.total,
                calculatedTotal: calculatedTotal,
                difference: req.body.total - calculatedTotal
            });

            return res.status(400).json({
                error: 'Order total mismatch. Please refresh and try again.'
            });
        }

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

        // Calculate final amount including any credits/debits
        const creditApplied = parseFloat(req.body.creditApplied) || 0;
        const debitApplied = parseFloat(req.body.debitApplied) || 0;
        const finalAmount = parseFloat(req.body.finalAmount) || (calculatedTotal - creditApplied + debitApplied);

        const newOrder = {
            id: orderId,
            userId: req.session.userId,
            userName: req.session.userName,
            userEmail: req.session.userEmail,
            items: validatedItems, // Use validated items with actual prices
            total: calculatedTotal, // Subtotal before credits/debits
            creditApplied: creditApplied,
            debitApplied: debitApplied,
            finalAmount: finalAmount, // Final amount paid
            pickupLocation: req.body.pickupLocation,
            phone: req.body.phone,
            notes: req.body.notes,
            status: 'submitted',
            paymentId: req.body.paymentId || null,
            paymentMethod: req.body.paymentMethod || 'demo',
            createdAt: new Date().toISOString()
        };

        console.log('💾 Saving order:', orderId, 'for userId:', newOrder.userId, 'Subtotal:', calculatedTotal, 'Credit:', creditApplied, 'Debit:', debitApplied, 'Final:', finalAmount);
        orders.push(newOrder);
        await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2));

        console.log('✅ Order created successfully');
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

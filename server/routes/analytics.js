import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const ordersPath = path.join(__dirname, '../data/orders.json');
const productsPath = path.join(__dirname, '../data/products.json');

// Get sales analytics
router.get('/sales', requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate, status, pickupLocation } = req.query;

        // Load orders and products
        const ordersData = await fs.readFile(ordersPath, 'utf-8');
        const productsData = await fs.readFile(productsPath, 'utf-8');
        let orders = JSON.parse(ordersData);
        const products = JSON.parse(productsData);

        console.log('📊 Analytics request:', { startDate, endDate, status, pickupLocation });

        // Filter by date range
        if (startDate || endDate) {
            orders = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                const start = startDate ? new Date(startDate) : new Date(0);
                const end = endDate ? new Date(endDate) : new Date();
                end.setHours(23, 59, 59, 999); // Include entire end date
                return orderDate >= start && orderDate <= end;
            });
        }

        // Filter by status
        if (status) {
            orders = orders.filter(order => order.status === status);
        }

        // Filter by pickup location
        if (pickupLocation) {
            orders = orders.filter(order => order.pickupLocation === pickupLocation);
        }

        // Calculate item counts
        const itemCounts = {};
        const categoryTotals = {};
        let totalRevenue = 0;
        let totalOrders = orders.length;

        orders.forEach(order => {
            totalRevenue += order.total;

            order.items.forEach(item => {
                const key = item.name;

                if (!itemCounts[key]) {
                    itemCounts[key] = {
                        name: item.name,
                        category: item.category || 'misc',
                        totalQuantity: 0,
                        totalRevenue: 0,
                        unit: item.unit,
                        orders: 0
                    };
                }

                itemCounts[key].totalQuantity += item.quantity;
                itemCounts[key].totalRevenue += item.price * item.quantity;
                itemCounts[key].orders += 1;

                // Category totals
                const category = item.category || 'misc';
                if (!categoryTotals[category]) {
                    categoryTotals[category] = {
                        totalRevenue: 0,
                        itemCount: 0
                    };
                }
                categoryTotals[category].totalRevenue += item.price * item.quantity;
                categoryTotals[category].itemCount += item.quantity;
            });
        });

        // Convert to arrays and sort
        const itemsList = Object.values(itemCounts).sort((a, b) => b.totalQuantity - a.totalQuantity);

        // Group by category
        const itemsByCategory = {};
        itemsList.forEach(item => {
            const category = item.category;
            if (!itemsByCategory[category]) {
                itemsByCategory[category] = [];
            }
            itemsByCategory[category].push(item);
        });

        // Get pickup locations
        const pickupLocations = [...new Set(orders.map(o => o.pickupLocation))];

        // Calculate average order value
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Status breakdown
        const statusBreakdown = {};
        orders.forEach(order => {
            statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
        });

        const analytics = {
            summary: {
                totalOrders,
                totalRevenue,
                avgOrderValue,
                uniqueItems: itemsList.length,
                dateRange: {
                    start: startDate || 'All time',
                    end: endDate || 'Now'
                }
            },
            items: itemsList,
            itemsByCategory,
            categoryTotals,
            statusBreakdown,
            pickupLocations: pickupLocations.map(location => ({
                location,
                orderCount: orders.filter(o => o.pickupLocation === location).length
            }))
        };

        console.log('✅ Analytics generated:', {
            orders: totalOrders,
            items: itemsList.length,
            revenue: totalRevenue.toFixed(2)
        });

        res.json(analytics);

    } catch (error) {
        console.error('❌ Analytics error:', error);
        res.status(500).json({ error: 'Failed to generate analytics' });
    }
});

// Get pickup list (optimized for Saturday pickup)
router.get('/pickup-list', requireAdmin, async (req, res) => {
    try {
        const { date, pickupLocation } = req.query;

        const ordersData = await fs.readFile(ordersPath, 'utf-8');
        let orders = JSON.parse(ordersData);

        console.log('📋 Pickup list request:', { date, pickupLocation });

        // Filter by date if provided (otherwise use today)
        const targetDate = date ? new Date(date) : new Date();
        const dayStart = new Date(targetDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(targetDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Filter orders for pickup (pending, confirmed, ready)
        orders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            const isInDateRange = orderDate >= dayStart && orderDate <= dayEnd;
            const isPickupStatus = ['submitted', 'confirmed', 'ready', 'pending'].includes(order.status);
            const matchesLocation = !pickupLocation || order.pickupLocation === pickupLocation;

            return isInDateRange && isPickupStatus && matchesLocation;
        });

        // Aggregate items
        const pickupItems = {};

        orders.forEach(order => {
            order.items.forEach(item => {
                const key = item.name;

                if (!pickupItems[key]) {
                    pickupItems[key] = {
                        name: item.name,
                        category: item.category || 'misc',
                        unit: item.unit,
                        totalQuantity: 0,
                        orders: []
                    };
                }

                pickupItems[key].totalQuantity += item.quantity;
                pickupItems[key].orders.push({
                    orderId: order.id,
                    customerName: order.userName,
                    quantity: item.quantity,
                    pickupLocation: order.pickupLocation
                });
            });
        });

        // Convert to array and group by category
        const itemsList = Object.values(pickupItems);
        const itemsByCategory = {};

        itemsList.forEach(item => {
            const category = item.category;
            if (!itemsByCategory[category]) {
                itemsByCategory[category] = [];
            }
            itemsByCategory[category].push(item);
        });

        // Sort categories in logical order
        const categoryOrder = ['dairy', 'eggs', 'juices', 'bread', 'vegetables', 'fruits', 'misc'];
        const sortedCategories = {};
        categoryOrder.forEach(cat => {
            if (itemsByCategory[cat]) {
                sortedCategories[cat] = itemsByCategory[cat].sort((a, b) =>
                    a.name.localeCompare(b.name)
                );
            }
        });

        const pickupList = {
            date: targetDate.toISOString().split('T')[0],
            pickupLocation: pickupLocation || 'All locations',
            totalOrders: orders.length,
            totalItems: itemsList.reduce((sum, item) => sum + item.totalQuantity, 0),
            itemsByCategory: sortedCategories,
            orders: orders.map(o => ({
                id: o.id,
                customerName: o.userName,
                pickupLocation: o.pickupLocation,
                total: o.total,
                status: o.status
            }))
        };

        console.log('✅ Pickup list generated:', {
            orders: pickupList.totalOrders,
            items: pickupList.totalItems
        });

        res.json(pickupList);

    } catch (error) {
        console.error('❌ Pickup list error:', error);
        res.status(500).json({ error: 'Failed to generate pickup list' });
    }
});

// Get daily summary
router.get('/daily-summary', requireAdmin, async (req, res) => {
    try {
        const { days = 7 } = req.query;

        const ordersData = await fs.readFile(ordersPath, 'utf-8');
        const orders = JSON.parse(ordersData);

        const dailyData = {};
        const daysNum = parseInt(days);

        // Initialize last N days
        for (let i = 0; i < daysNum; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            dailyData[dateKey] = {
                date: dateKey,
                orders: 0,
                revenue: 0,
                items: 0
            };
        }

        // Aggregate orders by day
        orders.forEach(order => {
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];

            if (dailyData[orderDate]) {
                dailyData[orderDate].orders += 1;
                dailyData[orderDate].revenue += order.total;
                dailyData[orderDate].items += order.items.reduce((sum, item) => sum + item.quantity, 0);
            }
        });

        const summary = Object.values(dailyData).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        res.json({
            days: daysNum,
            summary
        });

    } catch (error) {
        console.error('❌ Daily summary error:', error);
        res.status(500).json({ error: 'Failed to generate daily summary' });
    }
});

export default router;


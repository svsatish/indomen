import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ordersPath = path.join(__dirname, '../data/orders.json');

async function migrateOrders() {
    try {
        console.log('Reading orders...');
        const data = await fs.readFile(ordersPath, 'utf-8');
        let orders = JSON.parse(data);

        let updatedCount = 0;

        orders = orders.map(order => {
            // Migrate 'pending' and 'confirmed' to 'submitted'
            if (order.status === 'pending' || order.status === 'confirmed') {
                updatedCount++;
                return {
                    ...order,
                    status: 'submitted',
                    // Remove paymentStatus if it exists
                    paymentStatus: undefined
                };
            }
            // Remove paymentStatus from other orders too
            if (order.paymentStatus) {
                const { paymentStatus, ...rest } = order;
                return rest;
            }
            return order;
        });

        console.log(`Updating ${updatedCount} orders to 'submitted' status...`);

        await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2));
        console.log('Migration complete! ✅');

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrateOrders();

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Settings from '../models/Settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');

async function importData() {
    try {
        console.log('🚀 Starting data migration to MongoDB...\n');

        // Connect to MongoDB
        await connectDB();

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Product.deleteMany({});
        await Order.deleteMany({});
        await Settings.deleteMany({});
        console.log('✅ Existing data cleared\n');

        // Import Users
        console.log('👥 Importing users...');
        const usersData = JSON.parse(await fs.readFile(path.join(dataDir, 'users.json'), 'utf-8'));
        const users = await User.insertMany(usersData);
        console.log(`✅ Imported ${users.length} users\n`);

        // Import Products
        console.log('📦 Importing products...');
        const productsData = JSON.parse(await fs.readFile(path.join(dataDir, 'products.json'), 'utf-8'));
        const products = await Product.insertMany(productsData);
        console.log(`✅ Imported ${products.length} products\n`);

        // Import Orders
        console.log('🛒 Importing orders...');
        const ordersData = JSON.parse(await fs.readFile(path.join(dataDir, 'orders.json'), 'utf-8'));

        // Map user emails to MongoDB IDs
        const userMap = {};
        for (const user of users) {
            userMap[user.email] = user._id;
        }

        // Map old product IDs to new MongoDB IDs
        const productMap = {};
        for (const product of products) {
            // Assuming products in JSON have an 'id' field
            const oldId = product.id || product._id.toString();
            productMap[oldId] = product._id;
        }

        // Update orders with proper user IDs and product IDs
        const ordersToImport = ordersData.map(order => {
            const userId = userMap[order.userEmail] || users[0]._id;

            // Map productIds in items
            const updatedItems = order.items.map(item => ({
                ...item,
                productId: productMap[item.productId] || products[0]._id
            }));

            // Fix status enum - map 'hold' to 'pending'
            let status = order.status || 'pending';
            if (status === 'hold') {
                status = 'pending';
            }

            return {
                ...order,
                userId,
                placedBy: userId,
                items: updatedItems,
                status,
                paymentStatus: order.paymentStatus || 'pending'
            };
        });

        const orders = await Order.insertMany(ordersToImport);
        console.log(`✅ Imported ${orders.length} orders\n`);

        // Import Settings
        console.log('⚙️  Importing settings...');
        const settingsData = JSON.parse(await fs.readFile(path.join(dataDir, 'settings.json'), 'utf-8'));

        const settingsToImport = [
            {
                key: 'siteBanner',
                value: settingsData,
                description: 'Site-wide banner settings'
            }
        ];

        const settings = await Settings.insertMany(settingsToImport);
        console.log(`✅ Imported ${settings.length} settings\n`);

        console.log('🎉 Migration completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   Users: ${users.length}`);
        console.log(`   Products: ${products.length}`);
        console.log(`   Orders: ${orders.length}`);
        console.log(`   Settings: ${settings.length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
importData();


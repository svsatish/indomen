# 🗄️ MongoDB Database Setup Guide

## Why MongoDB Atlas (Free Tier)?

### Benefits
- ✅ **512MB Free Storage** - Enough for 10,000+ orders
- ✅ **Shared Cluster** - Perfect for MVP and early-stage
- ✅ **No Credit Card Required** - Truly free to start
- ✅ **Auto-Scaling** - Easy upgrade path as you grow
- ✅ **Built-in Backups** - Data protection included
- ✅ **Global Deployment** - Deploy closer to users
- ✅ **Monitoring & Alerts** - Track performance
- ✅ **99.95% SLA** - Production-ready reliability

### Other Free Database Options

| Database | Free Tier | Storage | Best For |
|----------|-----------|---------|----------|
| **MongoDB Atlas** | ✅ Yes | 512MB | Documents, flexible schema |
| **PostgreSQL (Supabase)** | ✅ Yes | 500MB | Relational data, SQL |
| **Firebase** | ✅ Yes | 1GB | Real-time features |
| **PlanetScale** | ✅ Yes | 5GB | MySQL, serverless |
| **CockroachDB** | ✅ Yes | 5GB | Distributed SQL |

**Recommendation: MongoDB Atlas** - Best fit for this e-commerce platform

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with Google/GitHub or email (FREE - no credit card)
3. Complete the welcome survey (select "I'm learning MongoDB")

### Step 2: Create a Free Cluster

1. Click **"Build a Database"**
2. Choose **"FREE"** shared cluster (M0 Sandbox)
3. Select **Cloud Provider**: AWS (recommended)
4. Select **Region**: Closest to your users (e.g., US East)
5. **Cluster Name**: `indomen-cluster` (or keep default)
6. Click **"Create"** (takes 1-3 minutes)

### Step 3: Configure Database Access

1. **Create Database User**:
   - Click "Database Access" in left sidebar
   - Click "Add New Database User"
   - **Authentication Method**: Password
   - **Username**: `indomen_admin`
   - **Password**: Generate Secure Password (copy it!)
   - **Database User Privileges**: "Read and write to any database"
   - Click "Add User"

2. **Whitelist IP Address**:
   - Click "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"
   - ⚠️ In production, restrict to specific IPs

### Step 4: Get Connection String

1. Click "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. **Driver**: Node.js
5. **Version**: 5.5 or later
6. **Copy the connection string**:
   ```
   mongodb+srv://indomen_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace `<password>` with your actual password
8. Add database name before `?`: `/indomen?retryWrites=true&w=majority`

### Step 5: Configure Environment Variables

1. Copy the example file:
   ```bash
   cd server
   cp .env.example .env
   ```

2. Edit `.env` and update:
   ```env
   MONGODB_URI=mongodb+srv://indomen_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/indomen?retryWrites=true&w=majority
   ```

3. **Important**: Never commit `.env` to git!

### Step 6: Migrate Existing Data

Run the migration script to import your JSON data:

```bash
cd server
node scripts/migrate_to_mongodb.js
```

You should see:
```
🚀 Starting data migration to MongoDB...
🗑️  Clearing existing data...
✅ Existing data cleared

👥 Importing users...
✅ Imported 4 users

📦 Importing products...
✅ Imported 34 products

🛒 Importing orders...
✅ Imported 12 orders

⚙️  Importing settings...
✅ Imported 1 settings

🎉 Migration completed successfully!
```

### Step 7: Start the Server

```bash
npm start
```

You should see:
```
✅ MongoDB connected successfully
📦 Database: indomen
🚀 Server running on http://localhost:3000
```

---

## 📊 Database Structure

### Collections

#### **users**
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  name: String,
  phone: String,
  role: 'customer' | 'admin' | 'kiosk',
  accountId: String,
  accountRole: 'admin' | 'member' | 'viewer',
  permissions: [String],
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### **products**
```javascript
{
  _id: ObjectId,
  name: String,
  category: String,
  price: Number,
  unit: String,
  description: String,
  image: String,
  stock: Number,
  featured: Boolean,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### **orders**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  accountId: String,
  placedBy: ObjectId (ref: User),
  items: [{
    productId: ObjectId (ref: Product),
    name: String,
    price: Number,
    quantity: Number,
    unit: String,
    category: String
  }],
  total: Number,
  pickupLocation: String,
  phone: String,
  notes: String,
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled',
  paymentId: String,
  paymentMethod: 'stripe' | 'cash' | 'demo',
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded',
  fulfilledAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### **settings**
```javascript
{
  _id: ObjectId,
  key: String,
  value: Mixed,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔍 MongoDB Atlas Dashboard Features

### 1. **Data Explorer**
- Browse collections
- Run queries
- Edit documents
- Create indexes

### 2. **Metrics**
- Requests per second
- Database size
- Connection count
- Query performance

### 3. **Alerts**
- Set up email alerts
- Disk space warnings
- Connection spikes
- Custom metrics

### 4. **Backups**
- Point-in-time recovery
- Download backups
- Automated daily backups

### 5. **Performance Advisor**
- Index recommendations
- Query optimization tips
- Schema suggestions

---

## 📈 Scaling Path

### Current: Free Tier (M0)
- **Storage**: 512MB
- **RAM**: Shared
- **vCPUs**: Shared
- **Connections**: 500
- **Cost**: $0/month
- **Suitable for**: 1,000-5,000 users

### Growth: Shared Tier (M2/M5)
- **Storage**: 2-5GB
- **RAM**: Shared
- **vCPUs**: Shared
- **Connections**: 500
- **Cost**: $9-25/month
- **Suitable for**: 10,000-50,000 users

### Scale: Dedicated (M10+)
- **Storage**: 10GB+
- **RAM**: Dedicated 2GB+
- **vCPUs**: Dedicated
- **Connections**: Unlimited
- **Cost**: $57+/month
- **Suitable for**: 100,000+ users

---

## 🔧 MongoDB Compass (Optional)

Download [MongoDB Compass](https://www.mongodb.com/products/compass) - Free GUI tool

1. Download and install
2. Use same connection string
3. Visual query builder
4. Schema analysis
5. Index management

---

## 🔐 Security Best Practices

### 1. **Environment Variables**
```bash
# Never commit .env
echo ".env" >> .gitignore
```

### 2. **Strong Passwords**
- Use generated passwords (20+ characters)
- Rotate passwords quarterly
- Different password per environment

### 3. **IP Whitelisting**
```
Development: 0.0.0.0/0 (anywhere)
Staging: Your office IP + server IP
Production: Only production server IPs
```

### 4. **Least Privilege**
- Create separate users for different environments
- Read-only user for analytics
- Write access only where needed

### 5. **Audit Logs**
- Enable in Atlas (free tier has basic logs)
- Monitor suspicious activity
- Set up alerts

---

## 🧪 Testing the Database

### Check Connection
```bash
# In server directory
node -e "require('./config/database.js').default()"
```

### Query Data
```javascript
// test.js
import connectDB from './config/database.js';
import Product from './models/Product.js';

await connectDB();

// Get all products
const products = await Product.find();
console.log(`Found ${products.length} products`);

// Get featured products
const featured = await Product.find({ featured: true });
console.log(`Found ${featured.length} featured products`);

// Search products
const dairy = await Product.find({ category: 'dairy' });
console.log(`Found ${dairy.length} dairy products`);
```

---

## 📝 Common Commands

### Development
```bash
# Start with MongoDB
npm start

# Run migration
node scripts/migrate_to_mongodb.js

# Check MongoDB status
mongosh "mongodb+srv://cluster0.xxxxx.mongodb.net" --username indomen_admin
```

### Production
```bash
# Set environment
export NODE_ENV=production

# Start server
npm start

# Or with PM2
pm2 start server.js --name indomen-api
```

---

## 🆘 Troubleshooting

### Issue: Connection Timeout
**Solution**: 
- Check IP whitelist in MongoDB Atlas
- Verify connection string
- Check firewall settings

### Issue: Authentication Failed
**Solution**:
- Verify username/password
- Check if user has correct permissions
- Try regenerating password

### Issue: Migration Failed
**Solution**:
- Check if JSON files exist in `data/` folder
- Verify MongoDB connection
- Check console for specific errors

### Issue: Slow Queries
**Solution**:
- Create indexes on frequently queried fields
- Use MongoDB Compass to analyze queries
- Check Performance Advisor in Atlas

---

## 🎯 Next Steps

1. ✅ **Set up MongoDB Atlas** (5 minutes)
2. ✅ **Run migration** to import data
3. ✅ **Test the application** with real database
4. 📊 **Monitor usage** in Atlas dashboard
5. 🔔 **Set up alerts** for storage/connections
6. 📈 **Plan scaling** based on growth

---

## 💡 Pro Tips

### Tip 1: Use Indexes
```javascript
// Already added in models!
// For custom queries, create indexes:
Product.index({ name: 'text', description: 'text' });
Order.index({ createdAt: -1 });
```

### Tip 2: Aggregation Pipeline
```javascript
// Get sales by category
const salesByCategory = await Order.aggregate([
  { $unwind: '$items' },
  { $group: {
    _id: '$items.category',
    totalSales: { $sum: '$items.price' },
    orderCount: { $sum: 1 }
  }}
]);
```

### Tip 3: Populate References
```javascript
// Get order with user details
const order = await Order.findById(orderId)
  .populate('userId', 'name email')
  .populate('placedBy', 'name');
```

### Tip 4: Backup Before Changes
```bash
# Export data
mongoexport --uri="mongodb+srv://..." --collection=products --out=products.json

# Import data
mongoimport --uri="mongodb+srv://..." --collection=products --file=products.json
```

---

## 🌟 Benefits for Investors

### Scalability Proof
- ✅ Production-ready database from day 1
- ✅ Handle 100,000+ users without code changes
- ✅ Auto-scaling with single click
- ✅ 99.95% uptime SLA

### Cost Efficiency
- ✅ $0/month for first 10,000 users
- ✅ Linear cost scaling (not exponential)
- ✅ No surprise bills
- ✅ Predictable growth costs

### Developer Productivity
- ✅ Mongoose ORM = faster development
- ✅ Built-in validation
- ✅ Easy schema evolution
- ✅ Excellent documentation

### Data Insights
- ✅ Built-in analytics
- ✅ Query performance monitoring
- ✅ Schema recommendations
- ✅ Usage patterns

---

**Your data is now enterprise-ready! 🚀**


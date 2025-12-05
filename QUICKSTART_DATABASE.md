# 🚀 Quick Start - MongoDB Setup

## Option A: MongoDB Atlas (FREE - Recommended)

**Best for**: Production-ready database in 5 minutes

### Step-by-Step:

1. **Create Free Account**: https://cloud.mongodb.com/
   - Sign up (no credit card needed)
   - Click "Build a Database"
   - Choose "FREE" tier (M0 Sandbox)
   - Select region (closest to you)
   - Click "Create"

2. **Create Database User**:
   - Click "Database Access"
   - Add New Database User
   - Username: `indomen_admin`
   - Password: (generate & copy it)
   - Privileges: "Read and write to any database"
   - Click "Add User"

3. **Allow Network Access**:
   - Click "Network Access"
   - Add IP Address
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

4. **Get Connection String**:
   - Click "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Add `/indomen` before the `?`

5. **Configure `.env`**:
   ```bash
   cd server
   # Edit .env file
   ```
   
   Update this line:
   ```env
   MONGODB_URI=mongodb+srv://indomen_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/indomen?retryWrites=true&w=majority
   ```

6. **Migrate Data**:
   ```bash
   npm run migrate
   ```

7. **Start Server**:
   ```bash
   npm start
   ```

✅ **Done!** Your app now uses a production-ready database.

---

## Option B: Local MongoDB (For Testing Only)

**Best for**: Local development without internet

### Prerequisites:
- Install MongoDB locally: https://www.mongodb.com/try/download/community

### Setup:

1. **Start MongoDB**:
   ```bash
   # macOS (with Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   # MongoDB should auto-start as a service
   ```

2. **Use Local Connection**:
   The `.env` file already has:
   ```env
   MONGODB_URI=mongodb://localhost:27017/indomen
   ```

3. **Migrate Data**:
   ```bash
   cd server
   npm run migrate
   ```

4. **Start Server**:
   ```bash
   npm start
   ```

---

## Verify Setup

### Test Database Connection:
```bash
cd server
npm run db:test
```

You should see:
```
✅ MongoDB connected successfully
📦 Database: indomen
✅ Database connected!
```

### Check Migrated Data:

**Option 1: MongoDB Compass** (GUI)
- Download: https://www.mongodb.com/products/compass
- Connect using your connection string
- Browse collections: users, products, orders

**Option 2: Command Line**
```bash
# For MongoDB Atlas
mongosh "mongodb+srv://cluster0.xxxxx.mongodb.net" --username indomen_admin

# For Local MongoDB
mongosh

# Then run:
use indomen
db.products.countDocuments()  // Should show 34
db.users.countDocuments()     // Should show 4
db.orders.countDocuments()    // Should show your order count
```

---

## Quick Commands

```bash
# Test connection
npm run db:test

# Migrate/Re-import data
npm run migrate

# Start development server
npm run dev

# Start production server
npm start
```

---

## Troubleshooting

### ❌ "Connection failed"
**Fix**: 
1. Check `.env` file has correct `MONGODB_URI`
2. Verify password (no special characters need URL encoding)
3. Check Network Access in MongoDB Atlas (allow 0.0.0.0/0)

### ❌ "Authentication failed"
**Fix**:
1. Verify username/password in connection string
2. Make sure database user has "Read and write" permissions

### ❌ "Migration failed"
**Fix**:
1. Ensure JSON files exist in `server/data/` folder
2. Check MongoDB connection first with `npm run db:test`

---

## What's Next?

1. ✅ Database is now production-ready
2. ✅ Data is automatically backed up (Atlas)
3. ✅ Can scale to 10,000+ users on free tier
4. 📊 Monitor usage in MongoDB Atlas dashboard
5. 🚀 Deploy to production (Heroku, Railway, Vercel, etc.)

---

## Need Help?

- **MongoDB Docs**: https://docs.mongodb.com/
- **MongoDB University**: https://university.mongodb.com/ (free courses)
- **Support**: MongoDB Atlas has chat support

**Happy coding! 🎉**


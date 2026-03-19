
# 🌾 Farm to Table - Farm Fresh E-Commerce Platform
A modern full-stack platform built with React (Vite) and Node.js/Express that enables customers to receive fresh dairy and produce sourced weekly from Mennonite and Amish farms. We transport and coordinate delivery—we are not resellers.

> 📘 **User Guide**: Check out [demo.md](./demo.md) for a visual walkthrough of the application features.

## ✨ Features

### Customer Features
- **Browse Products** by category (Dairy, Eggs, Juices, Bread, Vegetables, Fruits, Misc)
- **Shopping Cart** with persistent storage and real-time sidebar
- **User Authentication** (admin-created accounts only)
- **Secure Checkout** with Stripe payment integration (Cards, Apple Pay, Google Pay, Link)
- **Order History** and tracking with "Upcoming Weekend" organization
- **Pay Outstanding Balance** - Pay any owed amounts without placing an order
- **Store Credits** - Apply credits to future orders
- **Responsive Design** - Mobile-friendly interface with dark/light theme support
- **Advanced Search & Filtering** - Search by keyword, filter by category, price, availability
- **Real-time Cart Sidebar** - View cart items without leaving the page
- **WhatsApp Integration** - Quick contact for order inquiries

### Admin Features
- **Dashboard** with statistics, quick actions, and real-time metrics
- **Product Management** - Add, edit, delete products with image upload
- **Order Management** - View and update order status, filter by location/status
- **User Management** - Create and manage customer/kiosk accounts
- **Site Settings** - Banner management, order acceptance toggle
- **Sales Analytics Dashboard** - Track sales, generate pickup lists, view trends by date
- **Account Balances** - View all customer credit/debit balances in one place
- **Credit/Debit Management** - Issue store credits or charge customers with automatic notifications
- **Audit Log** - Track all admin actions for accountability
- **Kiosk Access** - Admin users can access and use all kiosk features

### Kiosk Features (For Pickup Fulfillment)
- **Order Pickup Dashboard** - Streamlined interface for order fulfillment
- **Search & Filter** - Find orders by name, email, location, or status
- **Quick Actions** - Mark orders as delivered or on hold
- **Auto-refresh** - Real-time order updates every 30 seconds
- **WhatsApp Quick Contact** - Message customers directly

### Payment System
- **Stripe Integration** - Secure payments with Cards, Apple Pay, Google Pay, Link
- **PayPal Support** - Enable through Stripe Dashboard
- **Amazon Pay Support** - Enable through Stripe Dashboard
- **Store Credits** - Apply credits at checkout
- **Balance Payments** - Pay outstanding balances without ordering
- **Price Security** - Server-side validation prevents price manipulation

### Technical Features
- **MongoDB Database** - Production-ready with auto-backups
- **Session Persistence** - Stay logged in across page refreshes
- **Image Upload** - Upload and optimize product images
- **Data Caching** - Fast page loads with intelligent caching
- **Dark/Light Theme** - User preference saved locally
- **Modern Typography** - Space Grotesk font family

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (FREE) - [Sign up here](https://cloud.mongodb.com)

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd freshfarm
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

4. **Configure Environment**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your MongoDB and Stripe credentials
   ```

5. **Migrate Data to Database** (if using fresh MongoDB)
   ```bash
   npm run migrate
   ```

### Running the Application

1. **Start the backend server** (in one terminal)
   ```bash
   cd server
   npm run dev
   ```
   Server will run on http://localhost:3000

2. **Start the frontend dev server** (in another terminal)
   ```bash
   npm run dev
   ```
   Frontend will run on http://localhost:5173

3. **Open your browser** and navigate to http://localhost:5173

## 👤 Demo Accounts

### Admin Account
- **Email:** admin@freshfarm.com
- **Password:** password123
- **Access:** Full admin panel + kiosk access

### Customer Accounts
- **Email:** john@example.com / sarah@example.com
- **Password:** password123

### Kiosk Account
- **Email:** kiosk@freshfarm.com
- **Password:** kiosk123
- **Access:** Kiosk Dashboard for order fulfillment only

## 📁 Project Structure

```
freshfarm/
├── server/                 # Backend (Node.js/Express)
│   ├── server.js          # Main server file
│   ├── config/            # Database configuration
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   │   ├── auth.js       # Authentication
│   │   ├── products.js   # Product CRUD
│   │   ├── orders.js     # Order management
│   │   ├── credits.js    # Credit/debit system
│   │   ├── payment.js    # Stripe/PayPal integration
│   │   ├── analytics.js  # Sales analytics
│   │   ├── settings.js   # Site settings
│   │   ├── upload.js     # Image upload
│   │   └── admin.js      # Admin operations
│   ├── middleware/        # Express middleware
│   └── data/             # JSON data (backup/migration)
│
├── src/                   # Frontend (React)
│   ├── App.jsx           # Main app with routing
│   ├── index.css         # Design system
│   ├── context/          # React Context providers
│   │   ├── AuthContext.jsx
│   │   ├── CartContext.jsx
│   │   ├── ThemeContext.jsx
│   │   ├── SettingsContext.jsx
│   │   └── CacheContext.jsx
│   ├── components/       # Reusable components
│   │   ├── Header.jsx
│   │   ├── CartSidebar.jsx
│   │   ├── MultiPayment.jsx
│   │   ├── ProductCard.jsx
│   │   └── ...
│   └── pages/            # Page components
│       ├── Home.jsx
│       ├── Products.jsx
│       ├── Checkout.jsx
│       ├── PayBalance.jsx
│       ├── Orders.jsx
│       ├── admin/        # Admin pages
│       │   ├── Dashboard.jsx
│       │   ├── Analytics.jsx
│       │   ├── AccountBalances.jsx
│       │   └── ...
│       └── kiosk/        # Kiosk pages
│           └── KioskDashboard.jsx
│
└── public/images/        # Product images
```

## 🎨 Design System

- **Typography:** Space Grotesk (modern, clean)
- **Color Palette:** Earthy tones with green primary accent
- **Components:** Buttons, cards, forms, badges, alerts
- **Themes:** Light and Dark mode support
- **Responsive:** Mobile-first with tablet/desktop breakpoints

## 💳 Payment Integration

See [PAYMENT_INTEGRATION.md](./PAYMENT_INTEGRATION.md) for detailed setup instructions.

**Supported Methods:**
- Credit/Debit Cards (Visa, Mastercard, Amex)
- Apple Pay (Safari/iOS)
- Google Pay (Chrome/Android)
- Link (Stripe's fast checkout)
- PayPal (enable in Stripe Dashboard)
- Amazon Pay (enable in Stripe Dashboard)

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Check current session

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `GET /api/orders` - Get orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status

### Credits
- `GET /api/credits/balance` - Get user's credit/debit balance
- `GET /api/credits/all-balances` - Get all users' balances (admin)
- `POST /api/credits/issue` - Issue credit/debit (admin)
- `POST /api/credits/apply` - Apply credit to order
- `POST /api/credits/pay-debit` - Pay outstanding balance

### Payment
- `POST /api/payment/create-payment-intent` - Create Stripe payment
- `GET /api/payment/payment-methods` - Get available methods
- `POST /api/payment/paypal/create-order` - Create PayPal order
- `POST /api/payment/paypal/capture-order` - Capture PayPal payment

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/pickup-list` - Pickup list by date

### Settings
- `GET /api/settings` - Get site settings
- `PUT /api/settings` - Update settings (admin)

## 🚢 Deployment

### Production Build
```bash
npm run build
cd server
NODE_ENV=production npm start
```

### Environment Variables
```env
# Database
MONGODB_URI=mongodb+srv://...

# Server
PORT=3000
SESSION_SECRET=your-secret-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...

# PayPal (optional)
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

## 📝 Recent Updates

- ✅ Multi-payment support (Stripe, PayPal, Amazon Pay)
- ✅ Pay outstanding balance without ordering
- ✅ Account balances dashboard for admin
- ✅ Kiosk dashboard with order fulfillment
- ✅ Dark/Light theme support
- ✅ Real-time cart sidebar
- ✅ Audit logging
- ✅ Session persistence
- ✅ Credit/Debit notification system

## 📄 License

This project is for demonstration purposes.


---

**Built with ❤️ for Farm to Table**

# 🌾 Indomen Connection - E-Commerce Platform

A modern full-stack platform built with React (Vite) and Node.js/Express that enables customers to receive fresh dairy and produce sourced weekly from Mennonite and Amish farms. We transport and coordinate delivery—we are not resellers.

> 📘 **User Guide**: Check out [demo.md](./demo.md) for a visual walkthrough of the application features.
> 🗄️ **Database Setup**: See [QUICKSTART_DATABASE.md](./QUICKSTART_DATABASE.md) for MongoDB setup (FREE, production-ready)

## ✨ Features

### Customer Features
- **Browse Products** by category (Dairy, Eggs, Juices, Bread, Vegetables, Fruits)
- **Shopping Cart** with persistent storage
- **User Authentication** (admin-created accounts only)
- **Checkout Flow** with Stripe payment instructions
- **Order History** and tracking
- **Responsive Design** - mobile-friendly interface
- **SEO Optimized** with proper meta tags and semantic HTML
- **🆕 Production Database** - MongoDB Atlas (FREE tier, handles 10,000+ users)

### Admin Features
- **Dashboard** with statistics and quick actions
- **Product Management** - Add, edit, delete products and manage inventory
- **Order Management** - View and update order status and payment confirmation
- **User Management** - Create customer accounts
- **Notices** - Post announcements for customers
- **🆕 Scalable Database** - Auto-backups, monitoring, and easy scaling

### Database
- **MongoDB Atlas** - Free tier with 512MB storage
- **Production-Ready** - 99.95% uptime SLA
- **Auto-Scaling** - Grows with your business
- **Built-in Backups** - Data protection included
- See [DATABASE_OPTIONS.md](./DATABASE_OPTIONS.md) for all free database options

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (FREE) - [Sign up here](https://cloud.mongodb.com)

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd indomen
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

4. **Set up Database** (5 minutes)
   
   **Option A: MongoDB Atlas (Recommended)**
   - Follow [QUICKSTART_DATABASE.md](./QUICKSTART_DATABASE.md)
   - FREE tier, production-ready
   - Handles 10,000+ users
   
   **Option B: Local MongoDB**
   - Install MongoDB locally
   - Use default `.env` configuration

5. **Configure Environment**
   ```bash
   cd server
   # Edit .env file with your MongoDB connection string
   ```

6. **Migrate Data to Database**
   ```bash
   npm run migrate
   ```
   
   You should see:
   ```
   ✅ Imported 34 products
   ✅ Imported 4 users  
   ✅ Imported orders
   🎉 Migration completed successfully!
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
- **Email:** admin@indomen.com
- **Password:** password123
- **Access:** Full admin panel access

### Customer Accounts
- **Email:** john@example.com
- **Password:** password123

- **Email:** sarah@example.com
- **Password:** password123

### Kiosk Account
- **Email:** kiosk@freshfarm.com
- **Password:** kiosk123
- **Access:** Kiosk Dashboard for order fulfillment

## 📁 Project Structure

```
indomen/
├── server/                 # Backend (Node.js/Express)
│   ├── server.js          # Main server file
│   ├── routes/            # API routes
│   │   ├── auth.js       # Authentication endpoints
│   │   ├── products.js   # Product CRUD operations
│   │   ├── orders.js     # Order management
│   │   └── admin.js      # Admin-only endpoints
│   ├── middleware/        # Express middleware
│   │   └── auth.js       # Auth & admin checks
│   └── data/             # JSON data storage
│       ├── users.json    # User accounts
│       ├── products.json # Product catalog
│       ├── orders.json   # Customer orders
│       └── notices.json  # Announcements
│
├── src/                   # Frontend (React)
│   ├── App.jsx           # Main app component with routing
│   ├── index.css         # Design system & global styles
│   ├── context/          # React Context providers
│   │   ├── AuthContext.jsx
│   │   └── CartContext.jsx
│   ├── components/       # Reusable components
│   │   ├── Header.jsx
│   │   ├── ProductCard.jsx
│   │   ├── ProtectedRoute.jsx
│   ├── pages/            # Page components
│   │   ├── Home.jsx
│   │   ├── Products.jsx
│   │   ├── Cart.jsx
│   │   ├── Checkout.jsx
│   │   ├── Orders.jsx
│   │   ├── Login.jsx
│   │   ├── OrderConfirmation.jsx
│   │   └── admin/        # Admin pages
│   │       ├── Dashboard.jsx
│   │       ├── ProductManagement.jsx
│   │       ├── OrderManagement.jsx
│   │       └── UserManagement.jsx
│   └── public/
│       └── images/       # Product images
│
└── package.json          # Frontend dependencies
```

## 🎨 Design System

The application uses a custom design system with:
- **Color Palette:** Warm, earthy tones (oranges, greens, browns)
- **Typography:** Inter (sans-serif) + Playfair Display (headings)
- **Components:** Buttons, cards, forms, badges, alerts
- **Animations:** Fade-in, slide-in, scale effects
- **Responsive:** Mobile-first approach with breakpoints

## 💳 Payment Integration

The application uses **Stripe** for secure credit card payments:
- **Stripe Elements** for secure UI components.
- **Payment Intents** for server-side security.
- **Automatic Order Creation** upon successful payment.
- **Demo Mode**: Includes a simulation button if API keys are not configured.

## 🔐 Authentication

- **No self-registration** - Admin creates all user accounts
- **Session-based authentication** using express-session
- **Password hashing** with bcryptjs
- **Protected routes** for authenticated users
- **Admin-only routes** for management features

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Check current session

### Products (Public)
- `GET /api/products` - Get all products (optional ?category filter)
- `GET /api/products/:id` - Get single product

### Products (Admin Only)
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get orders (user's own or all for admin)
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status (admin only)

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `GET /api/admin/notices` - Get notices
- `POST /api/admin/notices` - Create notice
- `DELETE /api/admin/notices/:id` - Delete notice

## 🚢 Deployment

### Production Build

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Set environment variables**
   ```bash
   export NODE_ENV=production
   export PORT=3000
   ```

3. **Start the server**
   ```bash
   cd server
   npm start
   ```

The server will serve the built frontend from the `dist` directory.

### Environment Variables

Create a `.env` file in the server directory:
```
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-secret-key-here
```

## 🛠️ Technologies Used

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Context API** - State management
- **CSS3** - Styling with custom properties

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **express-session** - Session management
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 📝 Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Image upload functionality
- [ ] Email notifications
- [ ] Advanced search and filtering
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Multiple payment gateway options
- [ ] Inventory alerts
- [ ] Sales analytics dashboard

## 📄 License

This project is for demonstration purposes.

## 👥 Support

For questions or issues, please contact the development team.

---

**Built with ❤️ for Indomen Connection**

# 🥬 Indomen Connection - Application Demo & User Guide

Welcome to **Indomen Connection**, a modern web application for managing farm-to-table orders. This guide provides a walkthrough of the application's features for Customers, Administrators, and Kiosk Operators.

![Indomen Home Page](screenshots/landing_page.png)

---

## 👥 User Roles

The application supports three distinct user roles, each with specific permissions and interfaces:

1.  **Customer**: Browses products, places orders, and tracks order status.
2.  **Admin**: Manages products, users, orders, and system settings.
3.  **Kiosk**: A specialized role for on-site staff to fulfill orders and manage pickups.

---

## 🛍️ Customer Experience

Customers must log in to access the full catalog and place orders.

### 1. **Product Catalog**
*   **Browse**: View high-quality images and details of fresh produce, bakery items, and more.
*   **Filter**: Easily filter products by category (Vegetables, Fruits, Bakery, Dairy, etc.).
*   **Search**: Find specific items instantly using the search bar.

![Product Catalog](screenshots/customer_addItems.png)

### 2. **Shopping Cart**
*   **Add to Cart**: Add items with a single click.
*   **Manage**: Adjust quantities or remove items directly from the cart slide-out or page.
*   **Real-time Total**: See the subtotal update instantly as you shop.

### 3. **Checkout Process**
*   **Review**: Verify items and total cost.
*   **Pickup Location**: Select a convenient pickup location (Ashburn, Centerville, Herndon, Fairfax).
*   **Secure Payment**: Pay securely using credit/debit card via **Stripe Integration**.
    *   *Note: For demo purposes, a simulation mode is available if API keys are not configured.*
*   **Contact Info**: Confirm phone number for order updates.
*   **Notes**: Add special instructions for the packing team.
*   **Order Confirmation**: Receive a unique Order ID (e.g., `JohnSmith_12042025_1430`) upon success.

![Checkout](screenshots/customer_checkout.png)


### 4. **Order Tracking**
*   **My Orders**: View a history of all past and current orders.
*   **Status Badges**: Track progress with clear status indicators:
    *   🔵 **SUBMITTED**: Order received.
    *   🟡 **HOLD**: Order on hold (e.g., someone holding your order to pickup).
    *   🟢 **DELIVERED**: Order picked up.

---

## 🛡️ Admin Dashboard

Admins have full control over the platform via a dedicated dashboard.

![Admin Dashboard](screenshots/admin_dashboard.png)

### 1. **Dashboard Overview**
*   **Key Metrics**: View real-time stats for Total Orders, Submitted Orders, Delivered Orders, and Total Products.
*   **Quick Actions**: One-click access to key management areas.

### 2. **Order Management**
*   **List View**: See all orders with sortable columns.
*   **Filtering**: Filter by status (Submitted, Hold, Delivered) or search by Order ID/Name.
*   **Order Details**: Click any **Order ID** to open a detailed modal showing:
    *   Customer contact info.
    *   Full item list with prices.
    *   Hold notes and special instructions.
*   **Status Updates**: Manually update order statuses if needed.

### 3. **Product Management**
*   **CRUD Operations**: Create, Read, Update, and Delete products.
*   **Inventory Control**: Update stock levels and prices.
*   **Image Management**: Add image URLs for products.

![Product Management](screenshots/admin_productManagement.png)

### 4. **User Management**
*   **User List**: View all registered users.
*   **Role Assignment**: Promote users to **Admin** or **Kiosk** roles.
*   **Edit/Delete**: Update user details or remove accounts.

### 5. **Audit & Security**
*   **Audit Trail**: A comprehensive log of all sensitive actions (login, order updates, product changes) for security and accountability.
*   **Settings**: Configure site-wide settings like tax rates or maintenance mode.

---

## 🖥️ Kiosk Dashboard

Designed for fast-paced, on-site fulfillment centers.

![Kiosk Dashboard](screenshots/kiosk_orders.png)

### 1. **Optimized Interface**
*   **Compact View**: Displays many orders at once for quick scanning.
*   **Auto-Refresh**: The dashboard automatically updates every 30 seconds to show new orders.

### 2. **Order Fulfillment**
*   **Search**: Instantly find orders by Customer Name, Email, or Order ID.
*   **Expand Details**: Click to reveal order items and customer notes without leaving the list.
*   **Action Buttons**:
    *   **✓ Mark as Delivered**: Confirms the customer has picked up the order.
    *   **⏸ Put on Hold**: Flags an issue (e.g., "Out of stock"). Requires entering a mandatory note.

### 3. **Status Feedback**
*   **Visual Cues**: Color-coded borders and icons (⏳, ✅, ⏸) indicate status at a glance.
*   **Hold Notes**: Clearly displays *who* put the order on hold and *why*.

---

## 🔐 Security Features

*   **RBAC (Role-Based Access Control)**: Strict middleware ensures users can only access authorized resources.
*   **Secure Sessions**: HttpOnly cookies and session management.
*   **Password Hashing**: All user passwords are securely hashed using bcrypt.
*   **Audit Logging**: Tracks "who did what and when" for compliance.

---

## 🚀 Getting Started

1.  **Login**:
    *   **Admin**: `admin@indomen.com` / `admin123`
    *   **Kiosk**: `kiosk@freshfarm.com` / `kiosk123`
    *   **Customer**: Register a new account or use `john@example.com` / `password123`
2.  **Explore**: Navigate using the top menu based on your role.

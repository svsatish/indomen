import { useState, useEffect } from 'react';
import { createWhatsAppLink } from '../../utils/whatsapp';
import './OrderManagement.css';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [locationFilter, setLocationFilter] = useState('');
    const [weekFilter, setWeekFilter] = useState('upcoming'); // 'all', 'upcoming', 'past'
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [viewingOrder, setViewingOrder] = useState(null);
    const [issuingCredit, setIssuingCredit] = useState(null); // For credit modal
    const [creditAmount, setCreditAmount] = useState('');
    const [creditReason, setCreditReason] = useState('');
    const [creditType, setCreditType] = useState('credit'); // 'credit' or 'debit'

    const pickupLocations = ['Ashburn', 'Centerville', 'Herndon', 'Fairfax'];

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/orders', {
                credentials: 'include'
            });
            const data = await response.json();
            setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                fetchOrders();
            }
        } catch (error) {
            console.error('Error updating order:', error);
        }
    };

    // Get upcoming Saturday
    const getUpcomingSaturday = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
        const upcomingSaturday = new Date(today);
        upcomingSaturday.setDate(today.getDate() + daysUntilSaturday);
        upcomingSaturday.setHours(0, 0, 0, 0);
        return upcomingSaturday;
    };

    // Filter orders by week
    const getWeekFilteredOrders = () => {
        if (weekFilter === 'all') return orders;

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        const upcomingSaturday = getUpcomingSaturday();

        return orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            orderDate.setHours(0, 0, 0, 0); // Normalize to start of day for comparison

            if (weekFilter === 'upcoming') {
                // Orders from today onwards until upcoming Saturday
                return orderDate >= today && orderDate <= upcomingSaturday;
            } else if (weekFilter === 'past') {
                // Past orders (before today)
                return orderDate < today;
            }
            return true;
        });
    };

    // Apply all filters
    const filteredOrders = getWeekFilteredOrders().filter(order => {
        const locationMatch = !locationFilter || order.pickupLocation === locationFilter;
        const statusMatch = !statusFilter || order.status === statusFilter;
        return locationMatch && statusMatch;
    });

    // Export to Excel (CSV format)
    const exportToExcel = () => {
        const headers = ['Order ID', 'Customer Name', 'Email', 'Phone', 'Pickup Location', 'Order Date', 'Total', 'Status', 'Payment Status', 'Items', 'Notes'];

        const rows = filteredOrders.map(order => [
            order.id,
            order.userName,
            order.userEmail,
            order.phone || 'N/A',
            order.pickupLocation,
            new Date(order.createdAt).toLocaleDateString(),
            order.total.toFixed(2),
            order.status,
            order.paymentStatus,
            order.items.map(item => `${item.name} (${item.quantity})`).join('; '),
            order.notes || 'N/A'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Archive orders
    const archiveOrders = async () => {
        if (!confirm(`Archive ${selectedOrders.length} selected orders? They will be moved to the archive.`)) {
            return;
        }

        try {
            const response = await fetch('/api/orders/archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ orderIds: selectedOrders })
            });

            if (response.ok) {
                alert('Orders archived successfully!');
                setSelectedOrders([]);
                fetchOrders();
            }
        } catch (error) {
            console.error('Error archiving orders:', error);
            alert('Failed to archive orders');
        }
    };

    // Toggle order selection
    const toggleOrderSelection = (orderId) => {
        setSelectedOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    // Select all filtered orders
    const toggleSelectAll = () => {
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map(o => o.id));
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'badge-warning',
            confirmed: 'badge-info',
            delivered: 'badge-success',
            cancelled: 'badge-error'
        };
        return badges[status] || 'badge-info';
    };

    // Issue credit or debit to customer
    const handleIssueCredit = async () => {
        if (!creditAmount || parseFloat(creditAmount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        try {
            const response = await fetch('/api/credits/issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    userId: issuingCredit.userId,
                    userEmail: issuingCredit.userEmail,
                    userName: issuingCredit.userName,
                    amount: parseFloat(creditAmount),
                    reason: creditReason || (creditType === 'credit' ? 'Product unavailable - store credit' : 'Additional purchases at pickup'),
                    orderId: issuingCredit.id,
                    type: creditType
                })
            });

            if (response.ok) {
                const message = creditType === 'credit'
                    ? `$${creditAmount} credit issued to ${issuingCredit.userName} successfully!`
                    : `$${creditAmount} charge added to ${issuingCredit.userName}'s account successfully!`;
                alert(message);
                setIssuingCredit(null);
                setCreditAmount('');
                setCreditReason('');
                setCreditType('credit');
            } else {
                const error = await response.json();
                alert(`Failed to issue ${creditType}: ${error.error}`);
            }
        } catch (error) {
            console.error(`Error issuing ${creditType}:`, error);
            alert(`Failed to issue ${creditType}`);
        }
    };

    if (loading) {
        return <div className="loading">Loading orders...</div>;
    }

    const upcomingSaturday = getUpcomingSaturday();

    return (
        <div className="order-management">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Order Management</h1>
                    <div className="header-actions">
                        <button onClick={exportToExcel} className="btn btn-secondary">
                            📊 Export to Excel
                        </button>
                        {selectedOrders.length > 0 && (
                            <button onClick={archiveOrders} className="btn btn-outline">
                                📦 Archive Selected ({selectedOrders.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Delivery Info Banner */}
                <div className="delivery-info-banner">
                    <span>📅 Upcoming Weekend Delivery: {upcomingSaturday.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>

                {/* Filters */}
                <div className="filters-row">
                    <div className="form-group">
                        <label className="form-label">Delivery Week</label>
                        <select
                            value={weekFilter}
                            onChange={(e) => setWeekFilter(e.target.value)}
                            className="form-select"
                        >
                            <option value="upcoming">Upcoming Weekend</option>
                            <option value="past">Past Orders</option>
                            <option value="all">All Orders</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Location</label>
                        <select
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="form-select"
                        >
                            <option value="">All Locations</option>
                            {pickupLocations.map(location => (
                                <option key={location} value={location}>{location}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="form-select"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {(locationFilter || statusFilter || weekFilter !== 'upcoming') && (
                        <button
                            onClick={() => {
                                setLocationFilter('');
                                setStatusFilter('');
                                setWeekFilter('upcoming');
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ alignSelf: 'flex-end' }}
                        >
                            Reset Filters
                        </button>
                    )}
                </div>

                <div className="orders-summary">
                    <span>Showing {filteredOrders.length} orders</span>
                    <span>Total: ${filteredOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}</span>
                </div>

                <div className="orders-table">
                    <table>
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Pickup Location</th>
                                <th>Date</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.id} className={selectedOrders.includes(order.id) ? 'selected' : ''}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedOrders.includes(order.id)}
                                            onChange={() => toggleOrderSelection(order.id)}
                                        />
                                    </td>
                                    <td>
                                        <button
                                            className="btn-link"
                                            onClick={() => setViewingOrder(order)}
                                        >
                                            #{order.id}
                                        </button>
                                    </td>
                                    <td>
                                        <div>
                                            <div>{order.userName}</div>
                                            <div className="text-muted text-sm">{order.userEmail}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="location-badge">{order.pickupLocation || 'N/A'}</span>
                                    </td>
                                    <td>
                                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td className="price-cell">${order.total.toFixed(2)}</td>
                                    <td>
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                            className={`status-select ${getStatusBadge(order.status)}`}
                                        >
                                            <option value="submitted">Submitted</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="hold">Hold</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredOrders.length === 0 && (
                    <div className="no-orders">
                        <p>No orders found matching the selected filters.</p>
                    </div>
                )}
                {/* Order Details Modal */}
                {viewingOrder && (
                    <div className="modal-backdrop" onClick={() => setViewingOrder(null)}>
                        <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Order Details</h2>
                                <button className="btn-close" onClick={() => setViewingOrder(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="order-info-grid">
                                    <div className="info-group">
                                        <label>Order ID</label>
                                        <div className="info-value">#{viewingOrder.id}</div>
                                    </div>
                                    <div className="info-group">
                                        <label>Date</label>
                                        <div className="info-value">
                                            {new Date(viewingOrder.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="info-group">
                                        <label>Status</label>
                                        <div className={`status-badge ${getStatusBadge(viewingOrder.status)}`}>
                                            {viewingOrder.status.toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="info-group">
                                        <label>Total Amount</label>
                                        <div className="info-value price-text">${viewingOrder.total.toFixed(2)}</div>
                                    </div>
                                </div>

                                <div className="customer-info-section">
                                    <h3>Customer Information</h3>
                                    <div className="info-grid-2">
                                        <div className="info-group">
                                            <label>Name</label>
                                            <div>{viewingOrder.userName}</div>
                                        </div>
                                        <div className="info-group">
                                            <label>Email</label>
                                            <div>{viewingOrder.userEmail}</div>
                                        </div>
                                        <div className="info-group">
                                            <label>Phone</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>{viewingOrder.phone || 'N/A'}</span>
                                                {viewingOrder.phone && (
                                                    <a
                                                        href={createWhatsAppLink(viewingOrder.phone, `Hi ${viewingOrder.userName}, regarding your FreshFarm order #${viewingOrder.id}...`)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Chat on WhatsApp"
                                                        style={{ textDecoration: 'none', fontSize: '1.2rem' }}
                                                    >
                                                        💬
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="info-group">
                                            <label>Pickup Location</label>
                                            <div>{viewingOrder.pickupLocation}</div>
                                        </div>
                                    </div>
                                    {viewingOrder.notes && (
                                        <div className="info-group mt-3">
                                            <label>Customer Notes</label>
                                            <div className="note-box">{viewingOrder.notes}</div>
                                        </div>
                                    )}
                                    {viewingOrder.holdNote && (
                                        <div className="info-group mt-3">
                                            <label>Hold Reason</label>
                                            <div className="note-box warning">{viewingOrder.holdNote}</div>
                                        </div>
                                    )}
                                </div>

                                <div className="order-items-section">
                                    <h3>Order Items</h3>
                                    <div className="items-table-container">
                                        <table className="items-table">
                                            <thead>
                                                <tr>
                                                    <th>Item</th>
                                                    <th>Category</th>
                                                    <th>Price</th>
                                                    <th>Qty</th>
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {viewingOrder.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{item.name}</td>
                                                        <td>{item.category}</td>
                                                        <td>${item.price.toFixed(2)}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>${(item.price * item.quantity).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td colSpan="4" className="text-right"><strong>Total:</strong></td>
                                                    <td><strong>${viewingOrder.total.toFixed(2)}</strong></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setIssuingCredit(viewingOrder);
                                        setViewingOrder(null);
                                    }}
                                >
                                    💰 Issue Credit/Charge
                                </button>
                                <button className="btn btn-secondary" onClick={() => setViewingOrder(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Credit/Debit Issuance Modal */}
                {issuingCredit && (
                    <div className="modal-backdrop" onClick={() => setIssuingCredit(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{creditType === 'credit' ? 'Issue Store Credit' : 'Add Charge to Account'}</h2>
                                <button className="btn-close" onClick={() => setIssuingCredit(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="info-group mb-lg">
                                    <label>Customer</label>
                                    <div className="info-value">{issuingCredit.userName}</div>
                                    <div className="text-muted text-sm">{issuingCredit.userEmail}</div>
                                </div>

                                <div className="info-group mb-lg">
                                    <label>Related Order</label>
                                    <div className="info-value">#{issuingCredit.id}</div>
                                    <div className="text-muted text-sm">
                                        Total: ${issuingCredit.total.toFixed(2)}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Type *</label>
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="creditType"
                                                value="credit"
                                                checked={creditType === 'credit'}
                                                onChange={(e) => setCreditType(e.target.value)}
                                            />
                                            <span>💰 Store Credit</span>
                                            <small style={{ color: 'var(--color-text-muted)' }}>(Customer can use this)</small>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="creditType"
                                                value="debit"
                                                checked={creditType === 'debit'}
                                                onChange={(e) => setCreditType(e.target.value)}
                                            />
                                            <span>📤 Charge/Debit</span>
                                            <small style={{ color: 'var(--color-text-muted)' }}>(Customer owes this)</small>
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Amount ($) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={creditAmount}
                                        onChange={(e) => setCreditAmount(e.target.value)}
                                        className="form-input"
                                        placeholder="Enter amount..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Reason</label>
                                    <textarea
                                        value={creditReason}
                                        onChange={(e) => setCreditReason(e.target.value)}
                                        className="form-textarea"
                                        placeholder={creditType === 'credit'
                                            ? 'e.g., Product unavailable, Quality issue, etc.'
                                            : 'e.g., Extra items purchased at pickup, Additional products, etc.'}
                                        rows="3"
                                    />
                                </div>

                                {creditType === 'credit' ? (
                                    <div className="alert alert-info">
                                        <strong>ℹ️ Note:</strong> This credit will be added to the customer's account
                                        and can be applied to their future orders.
                                    </div>
                                ) : (
                                    <div className="alert alert-warning">
                                        <strong>⚠️ Note:</strong> This charge will be added to the customer's account balance.
                                        They will need to pay this amount in their next order or separately.
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setIssuingCredit(null)}>
                                    Cancel
                                </button>
                                <button
                                    className={creditType === 'credit' ? 'btn btn-primary' : 'btn btn-warning'}
                                    onClick={handleIssueCredit}
                                >
                                    {creditType === 'credit'
                                        ? `💳 Issue $${creditAmount || '0.00'} Credit`
                                        : `📤 Add $${creditAmount || '0.00'} Charge`
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderManagement;

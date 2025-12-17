import { useState, useEffect } from 'react';
import { createWhatsAppLink } from '../../utils/whatsapp';
import './KioskDashboard.css';

const KioskDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [locationFilter, setLocationFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    const [holdNote, setHoldNote] = useState('');
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    const pickupLocations = ['Ashburn', 'Centerville', 'Herndon', 'Fairfax'];

    useEffect(() => {
        fetchOrders();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/orders', {
                credentials: 'include'
            });
            const data = await response.json();
            // Show submitted, hold, and delivered orders
            const activeOrders = data.filter(o => ['submitted', 'hold', 'delivered'].includes(o.status));
            setOrders(activeOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, status, note = '') => {
        try {
            const body = { status };
            if (note) {
                body.holdNote = note;
            }
            // For hold status, include the userName
            if (status === 'hold' && note) {
                body.holdWith = note; // Store who it's on hold with
            }

            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            if (response.ok) {
                alert(`Order ${status === 'delivered' ? 'marked as delivered' : 'put on hold'} successfully!`);
                fetchOrders();
                setSelectedOrderId(null);
                setHoldNote('');
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to update order');
            }
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Error updating order');
        }
    };

    const handleHoldOrder = (orderId) => {
        setSelectedOrderId(orderId);
    };

    const confirmHold = () => {
        if (selectedOrderId && holdNote.trim()) {
            updateOrderStatus(selectedOrderId, 'hold', holdNote);
        }
    };

    const toggleOrderExpansion = (orderId) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedOrders(newExpanded);
    };

    const getStatusBadge = (status) => {
        const badges = {
            submitted: 'badge-info',
            hold: 'badge-error',
            delivered: 'badge-success'
        };
        return badges[status] || 'badge-info';
    };

    const getStatusIcon = (status) => {
        const icons = {
            submitted: '📋',
            hold: '⏸',
            delivered: '✅'
        };
        return icons[status] || '📋';
    };

    // Filter and search orders
    const filteredOrders = orders.filter(order => {
        const locationMatch = !locationFilter || order.pickupLocation === locationFilter;
        const statusMatch = !statusFilter || order.status === statusFilter;
        const searchMatch = !searchQuery ||
            order.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
        return locationMatch && statusMatch && searchMatch;
    });

    if (loading) {
        return <div className="loading">Loading orders...</div>;
    }

    return (
        <div className="kiosk-dashboard">
            <div className="container">
                <div className="kiosk-header">
                    <h1 className="page-title">📦 Pickup Kiosk</h1>
                    <div className="auto-refresh-indicator">
                        <span className="pulse-dot"></span>
                        Auto-refreshing every 30s
                    </div>
                </div>

                <div className="kiosk-stats">
                    <div className="stat-box">
                        <span className="stat-number">{filteredOrders.length}</span>
                        <span className="stat-label">Active Orders</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-number">{filteredOrders.filter(o => o.status === 'submitted').length}</span>
                        <span className="stat-label">Submitted</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-number">{filteredOrders.filter(o => o.status === 'hold').length}</span>
                        <span className="stat-label">On Hold</span>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="search-filters">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="🔍 Search by name, email, or order ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="clear-search"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="filters-row">
                        <div className="form-group">
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
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="form-select"
                            >
                                <option value="">All Statuses</option>
                                <option value="submitted">Submitted</option>
                                <option value="hold">On Hold</option>
                                <option value="delivered">Delivered</option>
                            </select>
                        </div>

                        {(locationFilter || statusFilter || searchQuery) && (
                            <button
                                onClick={() => {
                                    setLocationFilter('');
                                    setStatusFilter('');
                                    setSearchQuery('');
                                }}
                                className="btn btn-outline btn-sm"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* Compact List View */}
                <div className="orders-list">
                    {filteredOrders.map(order => (
                        <div
                            key={order.id}
                            className={`order-list-item ${order.status} ${expandedOrders.has(order.id) ? 'expanded' : ''}`}
                        >
                            {/* Order Header - Always visible */}
                            <div
                                onClick={() => toggleOrderExpansion(order.id)}
                                className="order-summary"
                            >
                                {/* Left side: Arrow + Name + Details */}
                                <div className="order-summary-left">
                                    <span className="expand-icon">
                                        {expandedOrders.has(order.id) ? '▼' : '▶'}
                                    </span>
                                    <div className="order-info">
                                        <h3 className="customer-name">
                                            {order.userName || 'Unknown Customer'}
                                        </h3>
                                        <span className="order-meta">
                                            #{order.id?.slice(-8)} • {order.pickupLocation} • ${(order.finalAmount || order.total || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Right side: Status Badge */}
                                <div className="order-summary-right">
                                    <span className={`status-badge ${order.status}`}>
                                        {getStatusIcon(order.status)} {order.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {expandedOrders.has(order.id) && (
                                <div className="order-details-expanded">
                                    <div className="order-details-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">📧 Email:</span>
                                            <span className="detail-value">{order.userEmail}</span>
                                        </div>
                                        {order.phone && (
                                            <div className="detail-item">
                                                <span className="detail-label">📞 Phone:</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span className="detail-value">{order.phone}</span>
                                                    <a
                                                        href={createWhatsAppLink(order.phone, `Hi ${order.userName}, regarding your Indomen order #${order.id}...`)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Chat on WhatsApp"
                                                        style={{ textDecoration: 'none', fontSize: '1.2rem' }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        💬
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        <div className="detail-item">
                                            <span className="detail-label">📅 Ordered:</span>
                                            <span className="detail-value">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {order.holdNote && (
                                        <div className="hold-note">
                                            <strong>⏸ Hold Note:</strong> {order.holdNote}
                                        </div>
                                    )}

                                    <div className="items-section">
                                        <h4>Items ({order.items.length}):</h4>
                                        <div className="items-list-compact">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="item-row-compact">
                                                    <span className="item-name">{item.name}</span>
                                                    <span className="item-quantity">×{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="order-actions-expanded">
                                        {order.status !== 'delivered' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateOrderStatus(order.id, 'delivered');
                                                }}
                                                className="btn btn-success"
                                            >
                                                ✓ Mark as Delivered
                                            </button>
                                        )}
                                        {order.status !== 'hold' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleHoldOrder(order.id);
                                                }}
                                                className="btn btn-outline"
                                            >
                                                ⏸ Put on Hold
                                            </button>
                                        )}
                                        {order.status === 'hold' && order.phone && (
                                            <a
                                                href={createWhatsAppLink(order.phone, `Hi ${order.userName}, your Indomen order #${order.id} is currently ON HOLD. Reason: ${order.holdNote || 'Pending review'}. Please contact us.`)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-whatsapp"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                💬 Notify via WhatsApp
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {filteredOrders.length === 0 && (
                    <div className="no-orders">
                        <p>No active orders found.</p>
                        {searchQuery && <p>Try adjusting your search or filters.</p>}
                    </div>
                )}

                {/* Hold Note Modal */}
                {selectedOrderId && (
                    <div className="modal-backdrop" onClick={() => setSelectedOrderId(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>Put Order on Hold</h3>
                            <p>Please provide a reason for holding this order:</p>
                            <textarea
                                value={holdNote}
                                onChange={(e) => setHoldNote(e.target.value)}
                                placeholder="e.g., Customer requested to hold, Payment issue, etc."
                                className="form-textarea"
                                rows="4"
                                autoFocus
                            />
                            <div className="modal-actions">
                                <button
                                    onClick={() => setSelectedOrderId(null)}
                                    className="btn btn-ghost"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmHold}
                                    className="btn btn-primary"
                                    disabled={!holdNote.trim()}
                                >
                                    Confirm Hold
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KioskDashboard;

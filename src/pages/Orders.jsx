import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import './Orders.css';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creditBalance, setCreditBalance] = useState(null);
    const { user } = useAuth();
    const location = useLocation();

    const fetchCreditBalance = useCallback(async () => {
        if (!user) return;

        try {
            const response = await fetch('/api/credits/balance', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setCreditBalance(data);
            }
        } catch (error) {
            console.error('Error fetching credit balance:', error);
        }
    }, [user]);

    const fetchOrders = useCallback(async () => {
        if (!user) {
            console.log('⚠️ No user, skipping fetch');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            console.log('🔄 Fetching orders for user:', user.email);

            const response = await fetch('/api/orders', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch orders: ${response.status}`);
            }

            const data = await response.json();
            console.log('📦 Received orders:', data.length, 'orders');
            console.log('Orders data:', data);

            // Sort by creation date (newest first)
            const sortedOrders = data.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.date);
                const dateB = new Date(b.createdAt || b.date);
                return dateB - dateA;
            });

            console.log('✅ Setting orders state with', sortedOrders.length, 'orders');
            setOrders(sortedOrders);
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
            setOrders([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        console.log('🔄 Orders page effect triggered');
        fetchOrders();
        fetchCreditBalance();
    }, [fetchOrders, fetchCreditBalance, location.pathname, location.key]); // Refetch when user changes or when navigating to this page

    // Also refetch when window gains focus (user comes back to tab)
    useEffect(() => {
        const handleFocus = () => {
            if (user && document.visibilityState === 'visible') {
                console.log('👁️ Page visible, refreshing orders...');
                fetchOrders();
            }
        };

        document.addEventListener('visibilitychange', handleFocus);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleFocus);
            window.removeEventListener('focus', handleFocus);
        };
    }, [user, fetchOrders]);

    const getStatusBadge = (status) => {
        const badges = {
            submitted: 'badge-info',
            hold: 'badge-warning',
            delivered: 'badge-success'
        };
        return badges[status] || 'badge-info';
    };

    if (loading) {
        return <div className="loading">Loading orders...</div>;
    }

    return (
        <div className="orders-page">
            <div className="container">
                <h1 className="page-title">My Orders</h1>

                {creditBalance && (creditBalance.creditBalance > 0 || creditBalance.debitBalance > 0) && (
                    <div className="credit-balance-card card">
                        <div className="credit-balance-content">
                            <h3>💰 Account Balance</h3>
                            <div className="balance-items">
                                {creditBalance.creditBalance > 0 && (
                                    <div className="balance-item credit">
                                        <span className="balance-label">Store Credit Available:</span>
                                        <span className="balance-amount">${creditBalance.creditBalance.toFixed(2)}</span>
                                    </div>
                                )}
                                {creditBalance.debitBalance > 0 && (
                                    <div className="balance-item debit">
                                        <span className="balance-label">Balance Due:</span>
                                        <span className="balance-amount">${creditBalance.debitBalance.toFixed(2)}</span>
                                    </div>
                                )}
                                {creditBalance.netBalance !== 0 && (
                                    <div className={`balance-item net ${creditBalance.netBalance > 0 ? 'credit' : 'debit'}`}>
                                        <span className="balance-label">Net Balance:</span>
                                        <span className="balance-amount">
                                            ${Math.abs(creditBalance.netBalance).toFixed(2)}
                                            {creditBalance.netBalance > 0 ? ' (Credit)' : ' (Owed)'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {creditBalance.credits && creditBalance.credits.length > 0 && (
                                <details className="credit-details">
                                    <summary>View Transaction History</summary>
                                    <div className="credit-transactions">
                                        {creditBalance.credits.map(credit => (
                                            <div key={credit.id} className={`credit-transaction ${credit.type}`}>
                                                <div className="transaction-info">
                                                    <span className="transaction-type">
                                                        {credit.type === 'credit' ? '💰 Credit' : '⚠️ Charge'}
                                                    </span>
                                                    <span className="transaction-reason">{credit.reason}</span>
                                                </div>
                                                <div className="transaction-amounts">
                                                    <span className="transaction-original">
                                                        ${credit.originalAmount.toFixed(2)}
                                                    </span>
                                                    {credit.remainingAmount < credit.originalAmount && (
                                                        <span className="transaction-remaining">
                                                            ${credit.remainingAmount.toFixed(2)} left
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}
                        </div>
                    </div>
                )}

                {orders.length === 0 ? (
                    <div className="no-orders card">
                        <p>You haven't placed any orders yet.</p>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => {
                            // Handle both MongoDB (_id) and JSON (id) formats
                            const orderId = order._id || order.id;
                            const orderDate = order.createdAt || order.date;

                            return (
                                <div key={orderId} className="order-card card">
                                    <div className="order-header">
                                        <div>
                                            <h3>Order #{orderId}</h3>
                                            <p className="order-date">
                                                {new Date(orderDate).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div className="order-status">
                                            <span className={`badge ${getStatusBadge(order.status)}`}>
                                                {order.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                <div className="order-items">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="order-item">
                                            <span className="item-name">{item.name}</span>
                                            <span className="item-qty">× {item.quantity}</span>
                                            <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="order-footer">
                                    {/* Show subtotal if any adjustments were made */}
                                    {((order.creditApplied || 0) > 0 || (order.debitApplied || 0) > 0) && (
                                        <div className="order-subtotal-row">
                                            <span>Subtotal:</span>
                                            <span>${(order.total || 0).toFixed(2)}</span>
                                        </div>
                                    )}

                                    {/* Show credit applied */}
                                    {(order.creditApplied || 0) > 0 && (
                                        <div className="order-credit-row">
                                            <span>💰 Credit Applied:</span>
                                            <span className="credit-amount">-${(order.creditApplied || 0).toFixed(2)}</span>
                                        </div>
                                    )}

                                    {/* Show debit/balance paid */}
                                    {(order.debitApplied || 0) > 0 && (
                                        <div className="order-debit-row">
                                            <span>⚠️ Previous Balance Paid:</span>
                                            <span className="debit-amount">+${(order.debitApplied || 0).toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="order-total">
                                        <span>Total Paid:</span>
                                        <span className="total-amount">${(order.finalAmount || order.total || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;

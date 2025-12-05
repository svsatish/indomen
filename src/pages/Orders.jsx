import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Orders.css';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

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

                {orders.length === 0 ? (
                    <div className="no-orders card">
                        <p>You haven't placed any orders yet.</p>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => (
                            <div key={order.id} className="order-card card">
                                <div className="order-header">
                                    <div>
                                        <h3>Order #{order.id}</h3>
                                        <p className="order-date">
                                            {new Date(order.createdAt).toLocaleDateString('en-US', {
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
                                    <div className="order-total">
                                        <span>Total:</span>
                                        <span className="total-amount">${order.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;

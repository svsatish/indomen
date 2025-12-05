import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const order = location.state?.order;

    useEffect(() => {
        // If no order data, redirect to home
        if (!order) {
            navigate('/');
        }
    }, [order, navigate]);

    if (!order) {
        return null;
    }

    const orderDate = new Date(order.createdAt);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = orderDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="order-confirmation-page">
            <div className="container container-narrow">
                <div className="success-card">
                    <div className="success-icon">✅</div>
                    <h1 className="success-title">Order Placed Successfully!</h1>

                    <div className="order-details-box">
                        <p className="order-number">Order #{order.id}</p>
                        <p className="order-datetime">
                            Placed on {formattedDate} at {formattedTime}
                        </p>
                    </div>

                    <div className="confirmation-message">
                        <div className="alert alert-info">
                            <strong>📧 Confirmation Email:</strong> A confirmation has been sent to {order.userEmail}
                        </div>

                        <div className="alert alert-success">
                            <strong>💳 Payment Successful:</strong> Your payment has been processed securely via Stripe.
                        </div>

                        <div className="pickup-info">
                            <h3>📍 Pickup Information</h3>
                            <p><strong>Location:</strong> {order.pickupLocation}</p>
                            <p><strong>Phone:</strong> {order.phone || user?.phone || 'N/A'}</p>
                            {order.notes && <p><strong>Notes:</strong> {order.notes}</p>}
                        </div>

                        <div className="order-items-summary">
                            <h3>🛒 Order Items</h3>
                            {(() => {
                                const groupedItems = order.items.reduce((acc, item) => {
                                    const category = item.category || 'misc';
                                    if (!acc[category]) acc[category] = [];
                                    acc[category].push(item);
                                    return acc;
                                }, {});

                                const categoryOrder = ['dairy', 'eggs', 'juices', 'bread', 'vegetables', 'fruits', 'misc'];
                                const categoryNames = {
                                    dairy: '🥛 Dairy',
                                    eggs: '🥚 Eggs',
                                    juices: '🧃 Juices',
                                    bread: '🍞 Bread',
                                    vegetables: '🥬 Vegetables',
                                    fruits: '🍎 Fruits',
                                    misc: '📦 Misc'
                                };

                                return categoryOrder.map(category => {
                                    if (!groupedItems[category] || groupedItems[category].length === 0) return null;

                                    return (
                                        <div key={category} className="item-category">
                                            <div className="category-name">{categoryNames[category]}</div>
                                            {groupedItems[category].map((item, idx) => (
                                                <div key={idx} className="item-row">
                                                    <span className="item-name">{item.name}</span>
                                                    <span className="item-qty">× {item.quantity}</span>
                                                    <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                });
                            })()}

                            <div className="order-total">
                                <span>Total</span>
                                <span>${order.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button onClick={() => navigate('/orders')} className="btn btn-primary btn-lg">
                            View My Orders
                        </button>
                        <button onClick={() => navigate('/products')} className="btn btn-outline">
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;

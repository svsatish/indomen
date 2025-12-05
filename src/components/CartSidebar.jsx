import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './CartSidebar.css';

const CartSidebar = ({ isOpen, onClose }) => {
    const { items, removeItem, updateQuantity, getTotal } = useCart();
    const { user } = useAuth();

    // Handle ESC key press
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Group items by category
    const groupedItems = items.reduce((acc, item) => {
        const category = item.category || 'misc';
        if (!acc[category]) {
            acc[category] = [];
        }
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

    const handleCheckoutClick = () => {
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`cart-sidebar-backdrop ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="cart-sidebar-header">
                    <h2>Shopping Cart</h2>
                    <button
                        className="close-btn"
                        onClick={onClose}
                        aria-label="Close cart"
                    >
                        ✕
                    </button>
                </div>

                <div className="cart-sidebar-content">
                    {items.length === 0 ? (
                        <div className="empty-cart-message">
                            <span className="empty-icon">🛒</span>
                            <p>Your cart is empty</p>
                            <Link to="/products" className="btn btn-primary" onClick={onClose}>
                                Continue Shopping
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="cart-items-list">
                                {categoryOrder.map(category => {
                                    if (!groupedItems[category] || groupedItems[category].length === 0) return null;

                                    return (
                                        <div key={category} className="category-group">
                                            <div className="category-label">{categoryNames[category]}</div>
                                            {groupedItems[category].map(item => (
                                                <div key={item.id} className="cart-sidebar-item">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="item-image"
                                                    />
                                                    <div className="item-info">
                                                        <h4>{item.name}</h4>
                                                        <p className="item-price">
                                                            ${item.price.toFixed(2)} / {item.unit}
                                                        </p>
                                                        <div className="quantity-controls">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                className="qty-btn"
                                                                aria-label="Decrease quantity"
                                                            >
                                                                −
                                                            </button>
                                                            <span className="quantity">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                className="qty-btn"
                                                                disabled={item.quantity >= item.stock}
                                                                aria-label="Increase quantity"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="item-actions">
                                                        <div className="item-total">
                                                            ${(item.price * item.quantity).toFixed(2)}
                                                        </div>
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            className="remove-btn"
                                                            aria-label="Remove item"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="cart-sidebar-footer">
                        <div className="total-section">
                            <div className="total-row">
                                <span>Subtotal:</span>
                                <span className="total-amount">${getTotal().toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="footer-actions">
                            <Link
                                to="/cart"
                                className="btn btn-outline btn-block"
                                onClick={handleCheckoutClick}
                            >
                                View Full Cart
                            </Link>
                            <Link
                                to={user ? "/checkout" : "/login"}
                                className="btn btn-primary btn-block"
                                onClick={handleCheckoutClick}
                            >
                                {user ? "Checkout" : "Login to Checkout"}
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartSidebar;


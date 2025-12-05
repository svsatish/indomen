import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Cart.css';

const Cart = () => {
    const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleCheckout = () => {
        if (!user) {
            navigate('/login', { state: { from: { pathname: '/checkout' } } });
        } else {
            navigate('/checkout');
        }
    };

    if (items.length === 0) {
        return (
            <div className="cart-page">
                <div className="container">
                    <h1 className="page-title">Shopping Cart</h1>
                    <div className="empty-cart">
                        <p>Your cart is empty</p>
                        <Link to="/products" className="btn btn-primary">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
        dairy: '🥛 Dairy Products',
        eggs: '🥚 Eggs',
        juices: '🧃 Juices',
        bread: '🍞 Bread & Baked Goods',
        vegetables: '🥬 Vegetables',
        fruits: '🍎 Fruits',
        misc: '📦 Miscellaneous'
    };

    return (
        <div className="cart-page">
            <div className="container">
                <h1 className="page-title">Shopping Cart</h1>

                <div className="cart-items">
                    {categoryOrder.map(category => {
                        if (!groupedItems[category] || groupedItems[category].length === 0) return null;

                        return (
                            <div key={category} className="category-section">
                                <h2 className="category-heading">{categoryNames[category]}</h2>
                                <div className="items-grid">
                                    {groupedItems[category].map(item => (
                                        <div key={item.id} className="cart-item card">
                                            <img src={item.image} alt={item.name} className="cart-item-image" />

                                            <div className="cart-item-details">
                                                <h3>{item.name}</h3>
                                                <p className="item-price">${item.price.toFixed(2)} / {item.unit}</p>
                                            </div>

                                            <div className="cart-item-actions">
                                                <div className="quantity-controls">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="btn btn-sm btn-ghost"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="quantity">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="btn btn-sm btn-ghost"
                                                        disabled={item.quantity >= item.stock}
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <div className="item-total">
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </div>

                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="btn btn-sm btn-ghost remove-btn"
                                                    title="Remove item"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="cart-summary card">
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span className="summary-value">${getTotal().toFixed(2)}</span>
                    </div>
                    <div className="summary-row total-row">
                        <span>Total</span>
                        <span className="summary-value total-value">${getTotal().toFixed(2)}</span>
                    </div>

                    <div className="cart-actions">
                        <button onClick={clearCart} className="btn btn-outline">
                            Clear Cart
                        </button>
                        <button onClick={handleCheckout} className="btn btn-primary btn-lg">
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;

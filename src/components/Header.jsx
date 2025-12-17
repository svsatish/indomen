import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import CartSidebar from './CartSidebar';
import './Header.css';

const Header = () => {
    const { user, logout, isAdmin, isKiosk, isAdminOrKiosk } = useAuth();
    const { getItemCount, showCartAnimation, isCartSidebarOpen, openCartSidebar, closeCartSidebar } = useCart();
    const { theme, toggleTheme } = useTheme();
    const [debitBalance, setDebitBalance] = useState(0);
    const location = useLocation();

    // Fetch user's balance to show "Pay Balance" option
    useEffect(() => {
        const fetchBalance = async () => {
            if (user && !isKiosk()) {
                try {
                    const response = await fetch('/api/credits/balance', {
                        credentials: 'include'
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setDebitBalance(data.debitBalance || 0);
                    }
                } catch (error) {
                    console.error('Error fetching balance:', error);
                }
            } else {
                setDebitBalance(0);
            }
        };
        fetchBalance();

        // Also set up an interval to refresh every 30 seconds
        const interval = setInterval(fetchBalance, 30000);
        return () => clearInterval(interval);
    }, [user, isKiosk, location.pathname]); // Re-fetch when location changes

    const categories = [
        { name: 'Dairy', path: '/products?category=dairy' },
        { name: 'Eggs', path: '/products?category=eggs' },
        { name: 'Juices', path: '/products?category=juices' },
        { name: 'Bread', path: '/products?category=bread' },
        { name: 'Vegetables', path: '/products?category=vegetables' },
        { name: 'Fruits', path: '/products?category=fruits' }
    ];

    return (
        <header className="header">
            <div className="header-top">
                <div className="container">
                    <div className="header-content">
                        <Link to="/" className="logo">
                            <div className="logo-content">
                                <span className="logo-icon">🌾</span>
                                <div className="logo-text">
                                    <span className="logo-main">Indomen</span>
                                    <span className="logo-sub">Connection</span>
                                </div>
                            </div>
                        </Link>

                        {/* Show navigation only for authenticated users */}
                        {user && !isKiosk() && (
                            <nav className="nav-links">
                                <Link to="/products">All Products</Link>
                                <Link to="/products?category=dairy">Dairy</Link>
                                <Link to="/products?category=eggs">Eggs</Link>
                                <Link to="/products?category=vegetables">Vegetables</Link>
                                <Link to="/products?category=fruits">Fruits</Link>
                                <Link to="/products?category=misc">Misc</Link>
                            </nav>
                        )}

                        {/* Kiosk navigation */}
                        {user && isKiosk() && (
                            <nav className="nav-links">
                                <Link to="/kiosk">Pickup Orders</Link>
                            </nav>
                        )}

                        <div className="header-actions">
                            {/* Cart button - only for authenticated customers and admins */}
                            {user && !isKiosk() && (
                                <button
                                    onClick={openCartSidebar}
                                    className={`cart-button ${showCartAnimation ? 'cart-pulse' : ''}`}
                                >
                                    <span className="cart-icon">🛒</span>
                                    {getItemCount() > 0 && (
                                        <span className="cart-badge">{getItemCount()}</span>
                                    )}
                                </button>
                            )}

                            <button
                                onClick={toggleTheme}
                                className="theme-toggle btn-ghost"
                                aria-label="Toggle theme"
                                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                            >
                                {theme === 'light' ? '🌙' : '💡'}
                            </button>

                            {user ? (
                                <div className="user-menu">
                                    <span className="user-name">👋 {user.name}</span>
                                    {/* Show Pay Balance button if user owes money */}
                                    {debitBalance > 0 && !isKiosk() && (
                                        <Link to="/pay-balance" className="btn btn-sm btn-warning pay-balance-btn">
                                            ⚠️ Pay ${debitBalance.toFixed(2)}
                                        </Link>
                                    )}
                                    {isAdmin() && (
                                        <>
                                            <Link to="/admin" className="btn btn-sm btn-secondary">
                                                Admin
                                            </Link>
                                            <Link to="/kiosk" className="btn btn-sm btn-secondary">
                                                Kiosk
                                            </Link>
                                        </>
                                    )}
                                    {isKiosk() && !isAdmin() && (
                                        <Link to="/kiosk" className="btn btn-sm btn-secondary">
                                            Kiosk
                                        </Link>
                                    )}
                                    {!isKiosk() && (
                                        <Link to="/orders" className="btn btn-sm btn-ghost">
                                            Orders
                                        </Link>
                                    )}
                                    <button onClick={logout} className="btn btn-sm btn-ghost">
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <Link to="/login" className="btn btn-sm btn-primary">
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cart Sidebar */}
            <CartSidebar isOpen={isCartSidebarOpen} onClose={closeCartSidebar} />
        </header>
    );
};

export default Header;

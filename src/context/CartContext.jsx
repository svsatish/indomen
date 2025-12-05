import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { registerClearCartCallback } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });

    const [showCartAnimation, setShowCartAnimation] = useState(false);
    const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
    }, [items]);

    const clearCart = () => {
        setItems([]);
        localStorage.removeItem('cart');
    };

    // Use ref to store the latest clearCart function
    const clearCartRef = useRef(clearCart);
    clearCartRef.current = clearCart;

    // Register clearCart callback with AuthContext
    useEffect(() => {
        registerClearCartCallback(() => clearCartRef.current());
    }, []);

    const addItem = (product, quantity = 1) => {
        setItems(currentItems => {
            const existingItem = currentItems.find(item => item.id === product.id);

            if (existingItem) {
                return currentItems.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }

            return [...currentItems, { ...product, quantity }];
        });

        // Trigger cart animation and open sidebar
        setShowCartAnimation(true);
        setTimeout(() => setShowCartAnimation(false), 1000);

        // Open cart sidebar
        setIsCartSidebarOpen(true);
    };

    const removeItem = (productId) => {
        setItems(currentItems => currentItems.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }

        setItems(currentItems =>
            currentItems.map(item =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    };


    const getTotal = () => {
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getItemCount = () => {
        return items.reduce((count, item) => count + item.quantity, 0);
    };

    const openCartSidebar = () => setIsCartSidebarOpen(true);
    const closeCartSidebar = () => setIsCartSidebarOpen(false);
    const toggleCartSidebar = () => setIsCartSidebarOpen(prev => !prev);

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                getTotal,
                getItemCount,
                showCartAnimation,
                isCartSidebarOpen,
                openCartSidebar,
                closeCartSidebar,
                toggleCartSidebar
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

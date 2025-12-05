import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// We'll store a callback to clear cart here
let clearCartCallback = null;

export const registerClearCartCallback = (callback) => {
    clearCartCallback = callback;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const response = await fetch('/api/auth/session', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            }
        } catch (error) {
            console.error('Session check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await response.json();
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            // Clear cart on logout
            if (clearCartCallback) {
                clearCartCallback();
            }
        }
    };

    const isAdmin = () => user?.role === 'admin';
    const isKiosk = () => user?.role === 'kiosk';
    const isCustomer = () => user?.role === 'customer' || !user?.role; // Default to customer
    const isAdminOrKiosk = () => user?.role === 'admin' || user?.role === 'kiosk';

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isKiosk, isCustomer, isAdminOrKiosk }}>
            {children}
        </AuthContext.Provider>
    );
};

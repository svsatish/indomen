import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './NotificationBanner.css';

const NotificationBanner = () => {
    const [notifications, setNotifications] = useState([]);
    const [currentNotification, setCurrentNotification] = useState(null);
    const [isVisible, setIsVisible] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        try {
            const response = await fetch('/api/notifications/unread', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📬 Fetched notifications:', data.length);
                setNotifications(data);
                setIsVisible(true);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [user]);

    // Fetch immediately when user logs in
    useEffect(() => {
        if (user) {
            console.log('👤 User logged in, fetching notifications...');
            fetchNotifications();
            // Poll for new notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        } else {
            setNotifications([]);
            setCurrentNotification(null);
        }
    }, [user, fetchNotifications]);

    // Also refetch on page navigation
    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [location.pathname, user, fetchNotifications]);

    useEffect(() => {
        if (notifications.length > 0) {
            setCurrentNotification(notifications[0]);
            setIsVisible(true);
        } else {
            setCurrentNotification(null);
        }
    }, [notifications]);


    const markAsRead = async (notificationId) => {
        try {
            await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                credentials: 'include'
            });

            // Remove from list
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleClose = () => {
        if (currentNotification) {
            markAsRead(currentNotification.id);
        }
    };

    const handleViewCredits = () => {
        if (currentNotification) {
            markAsRead(currentNotification.id);
        }
        navigate('/orders');
    };

    if (!currentNotification) {
        return null;
    }

    const getIcon = (type) => {
        switch (type) {
            case 'credit':
                return '💰';
            case 'debit':
                return '⚠️';
            case 'success':
                return '✅';
            case 'warning':
                return '⚠️';
            default:
                return 'ℹ️';
        }
    };

    const getTitle = (type) => {
        switch (type) {
            case 'credit':
                return 'Store Credit Received!';
            case 'debit':
                return 'Balance Due';
            case 'success':
                return 'Success';
            case 'warning':
                return 'Notice';
            default:
                return 'Notification';
        }
    };

    return (
        <div className={`notification-banner ${currentNotification.type}`}>
            <div className="container">
                <div className="notification-banner-content">
                    <div className="notification-message">
                        <div className="notification-icon">
                            {getIcon(currentNotification.type)}
                        </div>
                        <div className="notification-text">
                            <div className="notification-title">
                                {getTitle(currentNotification.type)}
                            </div>
                            {currentNotification.amount && (
                                <div className="notification-amount">
                                    ${currentNotification.amount.toFixed(2)}
                                </div>
                            )}
                            <div className="notification-description">
                                {currentNotification.message}
                            </div>
                        </div>
                    </div>
                    <div className="notification-actions">
                        <button
                            onClick={handleViewCredits}
                            className="notification-view-credits"
                        >
                            View Balance
                        </button>
                        <button
                            onClick={handleClose}
                            className="notification-close"
                            aria-label="Close notification"
                        >
                            ×
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationBanner;


import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, adminOnly = false, kioskOrAdmin = false }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    if (kioskOrAdmin && !['admin', 'kiosk'].includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalOrders: 0,
        submittedOrders: 0,
        deliveredOrders: 0,
        totalProducts: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [ordersRes, productsRes] = await Promise.all([
                fetch('/api/orders', { credentials: 'include' }),
                fetch('/api/products')
            ]);

            const orders = await ordersRes.json();
            const products = await productsRes.json();

            setStats({
                totalOrders: orders.length,
                submittedOrders: orders.filter(o => o.status === 'submitted').length,
                deliveredOrders: orders.filter(o => o.status === 'delivered').length,
                totalProducts: products.length
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const quickActions = [
        { title: 'Manage Products', path: '/admin/products', icon: '📦', colorClass: 'action-card-blue' },
        { title: 'View Orders', path: '/admin/orders', icon: '📋', colorClass: 'action-card-green' },
        { title: 'Manage Users', path: '/admin/users', icon: '👥', colorClass: 'action-card-purple' },
        { title: 'Audit Trail', path: '/admin/audit-log', icon: '🔍', colorClass: 'action-card-orange' },
        { title: 'Site Settings', path: '/admin/settings', icon: '⚙️', colorClass: 'action-card-yellow' }
    ];

    return (
        <div className="admin-dashboard">
            <div className="container">
                <h1 className="page-title">Admin Dashboard</h1>

                <div className="stats-grid">
                    <div className="stat-card card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                            <h3>Total Orders</h3>
                            <p className="stat-value">{stats.totalOrders}</p>
                        </div>
                    </div>

                    <div className="stat-card card">
                        <div className="stat-icon">📋</div>
                        <div className="stat-info">
                            <h3>Submitted Orders</h3>
                            <p className="stat-value">{stats.submittedOrders}</p>
                        </div>
                    </div>

                    <div className="stat-card card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <h3>Delivered Orders</h3>
                            <p className="stat-value">{stats.deliveredOrders}</p>
                        </div>
                    </div>

                    <div className="stat-card card">
                        <div className="stat-icon">📦</div>
                        <div className="stat-info">
                            <h3>Total Products</h3>
                            <p className="stat-value">{stats.totalProducts}</p>
                        </div>
                    </div>
                </div>

                <h2 className="section-title">Quick Actions</h2>
                <div className="actions-grid">
                    {quickActions.map(action => (
                        <Link
                            key={action.title}
                            to={action.path}
                            className={`action-card ${action.colorClass}`}
                        >
                            <span className="action-icon">{action.icon}</span>
                            <h3>{action.title}</h3>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

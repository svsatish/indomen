import { useState, useEffect } from 'react';
import './Analytics.css';

const Analytics = () => {
    const [activeTab, setActiveTab] = useState('pickup'); // pickup, sales, daily
    const [pickupList, setPickupList] = useState(null);
    const [salesData, setSalesData] = useState(null);
    const [dailyData, setDailyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [pickupLocation, setPickupLocation] = useState('');

    function getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    function getNextSaturday() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
        const saturday = new Date(today);
        saturday.setDate(today.getDate() + daysUntilSaturday);
        return saturday.toISOString().split('T')[0];
    }

    useEffect(() => {
        if (activeTab === 'pickup') {
            fetchPickupList();
        } else if (activeTab === 'sales') {
            fetchSalesData();
        } else if (activeTab === 'daily') {
            fetchDailyData();
        }
    }, [activeTab, selectedDate, pickupLocation]);

    const fetchPickupList = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedDate) params.append('date', selectedDate);
            if (pickupLocation) params.append('pickupLocation', pickupLocation);

            const response = await fetch(`/api/analytics/pickup-list?${params}`, {
                credentials: 'include'
            });
            const data = await response.json();
            setPickupList(data);
        } catch (error) {
            console.error('Error fetching pickup list:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSalesData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedDate) {
                params.append('startDate', selectedDate);
                params.append('endDate', selectedDate);
            }

            const response = await fetch(`/api/analytics/sales?${params}`, {
                credentials: 'include'
            });
            const data = await response.json();
            setSalesData(data);
        } catch (error) {
            console.error('Error fetching sales data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/analytics/daily-summary?days=7', {
                credentials: 'include'
            });
            const data = await response.json();
            setDailyData(data);
        } catch (error) {
            console.error('Error fetching daily data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const setCategoryEmoji = (category) => {
        const emojis = {
            dairy: '🥛',
            eggs: '🥚',
            juices: '🧃',
            bread: '🍞',
            vegetables: '🥬',
            fruits: '🍎',
            misc: '📦'
        };
        return emojis[category] || '📦';
    };

    if (loading) {
        return <div className="loading">Loading analytics...</div>;
    }

    return (
        <div className="analytics-page">
            <div className="container">
                <div className="analytics-header">
                    <h1>📊 Sales Analytics Dashboard</h1>
                    <p className="text-secondary">Track orders, sales, and prepare pickup lists</p>
                </div>

                {/* Tabs */}
                <div className="analytics-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'pickup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pickup')}
                    >
                        📋 Pickup List
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sales')}
                    >
                        💰 Sales Analytics
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
                        onClick={() => setActiveTab('daily')}
                    >
                        📈 Daily Trends
                    </button>
                </div>

                {/* Filters */}
                <div className="analytics-filters card">
                    <div className="filter-group">
                        <label>Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="form-input"
                        />
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedDate(getNextSaturday())}
                        >
                            📅 Next Saturday
                        </button>
                    </div>

                    {activeTab === 'pickup' && (
                        <div className="filter-group">
                            <label>Pickup Location</label>
                            <select
                                value={pickupLocation}
                                onChange={(e) => setPickupLocation(e.target.value)}
                                className="form-select"
                            >
                                <option value="">All Locations</option>
                                <option value="Woodstock">Woodstock</option>
                                <option value="Canton">Canton</option>
                                <option value="Marietta">Marietta</option>
                            </select>
                        </div>
                    )}

                    <div className="filter-actions">
                        <button className="btn btn-primary" onClick={handlePrint}>
                            🖨️ Print
                        </button>
                    </div>
                </div>

                {/* Pickup List View */}
                {activeTab === 'pickup' && pickupList && (
                    <div className="pickup-list-view">
                        {/* Summary Stats */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">📦</div>
                                <div className="stat-content">
                                    <h3>{pickupList.totalOrders}</h3>
                                    <p>Total Orders</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">🛒</div>
                                <div className="stat-content">
                                    <h3>{pickupList.totalItems}</h3>
                                    <p>Total Items</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📍</div>
                                <div className="stat-content">
                                    <h3>{pickupList.pickupLocation}</h3>
                                    <p>Location</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📅</div>
                                <div className="stat-content">
                                    <h3>{new Date(pickupList.date).toLocaleDateString()}</h3>
                                    <p>Pickup Date</p>
                                </div>
                            </div>
                        </div>

                        {/* Items by Category */}
                        <div className="pickup-items">
                            <h2>Items to Pickup</h2>
                            {Object.entries(pickupList.itemsByCategory).map(([category, items]) => (
                                <div key={category} className="category-section card">
                                    <h3 className="category-header">
                                        {setCategoryEmoji(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </h3>
                                    <div className="items-list">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="pickup-item">
                                                <div className="item-info">
                                                    <span className="item-name">{item.name}</span>
                                                    <span className="item-unit">({item.unit})</span>
                                                </div>
                                                <div className="item-quantity">
                                                    <strong>{item.totalQuantity}</strong>
                                                    <span className="quantity-label">{item.unit}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Orders List */}
                        <div className="orders-summary card">
                            <h3>Orders for Pickup</h3>
                            <div className="orders-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>Location</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pickupList.orders.map(order => (
                                            <tr key={order.id}>
                                                <td>{order.id}</td>
                                                <td>{order.customerName}</td>
                                                <td>{order.pickupLocation}</td>
                                                <td>${order.total.toFixed(2)}</td>
                                                <td>
                                                    <span className={`badge badge-${order.status}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sales Analytics View */}
                {activeTab === 'sales' && salesData && (
                    <div className="sales-view">
                        {/* Summary */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">💰</div>
                                <div className="stat-content">
                                    <h3>${salesData.summary.totalRevenue.toFixed(2)}</h3>
                                    <p>Total Revenue</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📦</div>
                                <div className="stat-content">
                                    <h3>{salesData.summary.totalOrders}</h3>
                                    <p>Total Orders</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">🛒</div>
                                <div className="stat-content">
                                    <h3>{salesData.summary.uniqueItems}</h3>
                                    <p>Unique Items</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📊</div>
                                <div className="stat-content">
                                    <h3>${salesData.summary.avgOrderValue.toFixed(2)}</h3>
                                    <p>Avg Order Value</p>
                                </div>
                            </div>
                        </div>

                        {/* Top Items */}
                        <div className="top-items card">
                            <h3>Top Selling Items</h3>
                            <div className="items-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Category</th>
                                            <th>Quantity Sold</th>
                                            <th>Revenue</th>
                                            <th>Orders</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salesData.items.slice(0, 10).map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.name}</td>
                                                <td>
                                                    {setCategoryEmoji(item.category)} {item.category}
                                                </td>
                                                <td>{item.totalQuantity} {item.unit}</td>
                                                <td>${item.totalRevenue.toFixed(2)}</td>
                                                <td>{item.orders}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Daily Trends View */}
                {activeTab === 'daily' && dailyData && (
                    <div className="daily-view">
                        <div className="daily-chart card">
                            <h3>Last 7 Days Performance</h3>
                            <div className="chart-container">
                                {dailyData.summary.map((day, idx) => {
                                    const maxRevenue = Math.max(...dailyData.summary.map(d => d.revenue));
                                    const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 200 : 0;

                                    return (
                                        <div key={idx} className="chart-bar">
                                            <div className="bar-container">
                                                <div
                                                    className="bar"
                                                    style={{ height: `${height}px` }}
                                                    title={`$${day.revenue.toFixed(2)}`}
                                                >
                                                    <span className="bar-value">${day.revenue.toFixed(0)}</span>
                                                </div>
                                            </div>
                                            <div className="bar-label">
                                                <div>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                                <div className="text-secondary">{new Date(day.date).getMonth() + 1}/{new Date(day.date).getDate()}</div>
                                            </div>
                                            <div className="bar-stats">
                                                <small>{day.orders} orders</small>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;


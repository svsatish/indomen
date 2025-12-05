import { useState, useEffect } from 'react';
import './AuditLog.css';

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');
    const [limit, setLimit] = useState(100);

    useEffect(() => {
        fetchAuditLogs();
    }, [actionFilter, limit]);

    const fetchAuditLogs = async () => {
        try {
            const params = new URLSearchParams();
            if (actionFilter) params.append('action', actionFilter);
            params.append('limit', limit);

            const response = await fetch(`/api/audit-log?${params}`, {
                credentials: 'include'
            });
            const data = await response.json();
            setLogs(data);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (action) => {
        const badges = {
            ORDER_STATUS_UPDATED: 'badge-info',
            ORDERS_ARCHIVED: 'badge-warning',
            PRODUCT_CREATED: 'badge-success',
            PRODUCT_UPDATED: 'badge-info',
            PRODUCT_DELETED: 'badge-error',
            USER_CREATED: 'badge-success',
            USER_UPDATED: 'badge-info',
            SETTINGS_UPDATED: 'badge-warning'
        };
        return badges[action] || 'badge-info';
    };

    const formatAction = (action) => {
        return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const exportLogs = () => {
        const headers = ['Timestamp', 'User', 'Email', 'Action', 'Details', 'IP Address'];

        const rows = logs.map(log => [
            formatTimestamp(log.timestamp),
            log.userName,
            log.userEmail,
            log.action,
            JSON.stringify(log.details),
            log.ipAddress
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `audit_log_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return <div className="loading">Loading audit logs...</div>;
    }

    return (
        <div className="audit-log-page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">🔍 Audit Trail</h1>
                    <button onClick={exportLogs} className="btn btn-secondary">
                        📊 Export Logs
                    </button>
                </div>

                <div className="audit-info-banner">
                    <span>📝 Complete audit trail of all admin activities</span>
                    <span>Total Events: {logs.length}</span>
                </div>

                {/* Filters */}
                <div className="filters-row">
                    <div className="form-group">
                        <label className="form-label">Filter by Action</label>
                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="form-select"
                        >
                            <option value="">All Actions</option>
                            <option value="ORDER_STATUS_UPDATED">Order Status Updated</option>
                            <option value="ORDERS_ARCHIVED">Orders Archived</option>
                            <option value="PRODUCT_CREATED">Product Created</option>
                            <option value="PRODUCT_UPDATED">Product Updated</option>
                            <option value="PRODUCT_DELETED">Product Deleted</option>
                            <option value="USER_CREATED">User Created</option>
                            <option value="USER_UPDATED">User Updated</option>
                            <option value="SETTINGS_UPDATED">Settings Updated</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Show Last</label>
                        <select
                            value={limit}
                            onChange={(e) => setLimit(e.target.value)}
                            className="form-select"
                        >
                            <option value="50">50 events</option>
                            <option value="100">100 events</option>
                            <option value="250">250 events</option>
                            <option value="500">500 events</option>
                            <option value="1000">1000 events</option>
                        </select>
                    </div>

                    {actionFilter && (
                        <button
                            onClick={() => setActionFilter('')}
                            className="btn btn-outline btn-sm"
                            style={{ alignSelf: 'flex-end' }}
                        >
                            Clear Filter
                        </button>
                    )}
                </div>

                {/* Audit Log Table */}
                <div className="audit-log-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Details</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td className="timestamp-cell">
                                        {formatTimestamp(log.timestamp)}
                                    </td>
                                    <td>
                                        <div>
                                            <div className="user-name">{log.userName}</div>
                                            <div className="text-muted text-sm">{log.userEmail}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`action-badge ${getActionBadge(log.action)}`}>
                                            {formatAction(log.action)}
                                        </span>
                                    </td>
                                    <td>
                                        <details className="details-toggle">
                                            <summary className="btn btn-sm btn-ghost">View Details</summary>
                                            <div className="details-popup">
                                                <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                            </div>
                                        </details>
                                    </td>
                                    <td className="ip-cell">{log.ipAddress}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {logs.length === 0 && (
                    <div className="no-logs">
                        <p>No audit logs found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLog;

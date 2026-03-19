import { useState, useEffect } from 'react';
import './AccountBalances.css';

const AccountBalances = () => {
    const [balances, setBalances] = useState([]);
    const [totals, setTotals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedUser, setExpandedUser] = useState(null);
    const [filter, setFilter] = useState('all'); // all, credits, debits

    useEffect(() => {
        fetchBalances();
    }, []);

    const fetchBalances = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/credits/all-balances', {
                credentials: 'include'
            });
            const data = await response.json();
            setBalances(data.users || []);
            setTotals(data.totals || null);
        } catch (error) {
            console.error('Error fetching balances:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBalances = balances.filter(user => {
        if (filter === 'credits') return user.creditBalance > 0;
        if (filter === 'debits') return user.debitBalance > 0;
        if (filter === 'outstanding') return user.creditBalance > 0 || user.debitBalance > 0;
        return true;
    });

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return <div className="loading">Loading account balances...</div>;
    }

    return (
        <div className="account-balances-page">
            <div className="container">
                <div className="page-header">
                    <h1>💰 Account Balances</h1>
                    <p className="subtitle">View and manage all customer credits and balances</p>
                </div>

                {/* Summary Cards */}
                {totals && (
                    <div className="totals-grid">
                        <div className="total-card credits">
                            <div className="total-icon">💵</div>
                            <div className="total-info">
                                <span className="total-label">Total Credits Outstanding</span>
                                <span className="total-value">${totals.totalCreditsOutstanding.toFixed(2)}</span>
                                <span className="total-count">{totals.usersWithCredits} customer(s)</span>
                            </div>
                        </div>
                        <div className="total-card debits">
                            <div className="total-icon">⚠️</div>
                            <div className="total-info">
                                <span className="total-label">Total Debits Outstanding</span>
                                <span className="total-value">${totals.totalDebitsOutstanding.toFixed(2)}</span>
                                <span className="total-count">{totals.usersWithDebits} customer(s)</span>
                            </div>
                        </div>
                        <div className="total-card net">
                            <div className="total-icon">📊</div>
                            <div className="total-info">
                                <span className="total-label">Net Position</span>
                                <span className={`total-value ${totals.totalCreditsOutstanding - totals.totalDebitsOutstanding >= 0 ? 'positive' : 'negative'}`}>
                                    ${Math.abs(totals.totalCreditsOutstanding - totals.totalDebitsOutstanding).toFixed(2)}
                                    {totals.totalCreditsOutstanding - totals.totalDebitsOutstanding >= 0 ? ' (Owed to Customers)' : ' (Owed by Customers)'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All Users ({balances.length})
                    </button>
                    <button
                        className={`filter-tab ${filter === 'outstanding' ? 'active' : ''}`}
                        onClick={() => setFilter('outstanding')}
                    >
                        With Balance ({balances.filter(u => u.creditBalance > 0 || u.debitBalance > 0).length})
                    </button>
                    <button
                        className={`filter-tab ${filter === 'credits' ? 'active' : ''}`}
                        onClick={() => setFilter('credits')}
                    >
                        Credits ({balances.filter(u => u.creditBalance > 0).length})
                    </button>
                    <button
                        className={`filter-tab ${filter === 'debits' ? 'active' : ''}`}
                        onClick={() => setFilter('debits')}
                    >
                        Debits ({balances.filter(u => u.debitBalance > 0).length})
                    </button>
                </div>

                {/* User Balances Table */}
                <div className="balances-table-container">
                    <table className="balances-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Email</th>
                                <th className="text-right">Credits</th>
                                <th className="text-right">Debits</th>
                                <th className="text-right">Net Balance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBalances.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="no-data">
                                        No users match the current filter
                                    </td>
                                </tr>
                            ) : (
                                filteredBalances.map(user => (
                                    <>
                                        <tr key={user.userId} className={`user-row ${expandedUser === user.userId ? 'expanded' : ''}`}>
                                            <td className="user-name">
                                                <strong>{user.userName}</strong>
                                            </td>
                                            <td className="user-email">{user.userEmail}</td>
                                            <td className="text-right">
                                                {user.creditBalance > 0 ? (
                                                    <span className="balance-credit">${user.creditBalance.toFixed(2)}</span>
                                                ) : (
                                                    <span className="balance-zero">$0.00</span>
                                                )}
                                            </td>
                                            <td className="text-right">
                                                {user.debitBalance > 0 ? (
                                                    <span className="balance-debit">${user.debitBalance.toFixed(2)}</span>
                                                ) : (
                                                    <span className="balance-zero">$0.00</span>
                                                )}
                                            </td>
                                            <td className="text-right">
                                                <span className={`net-balance ${user.netBalance > 0 ? 'positive' : user.netBalance < 0 ? 'negative' : ''}`}>
                                                    {user.netBalance > 0 ? '+' : ''}{user.netBalance !== 0 ? `$${user.netBalance.toFixed(2)}` : '$0.00'}
                                                </span>
                                            </td>
                                            <td>
                                                {user.history.length > 0 && (
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        onClick={() => setExpandedUser(expandedUser === user.userId ? null : user.userId)}
                                                    >
                                                        {expandedUser === user.userId ? 'Hide' : 'History'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        {expandedUser === user.userId && user.history.length > 0 && (
                                            <tr className="history-row">
                                                <td colSpan="6">
                                                    <div className="history-container">
                                                        <h4>Transaction History</h4>
                                                        <table className="history-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Date</th>
                                                                    <th>Type</th>
                                                                    <th>Original</th>
                                                                    <th>Remaining</th>
                                                                    <th>Reason</th>
                                                                    <th>Status</th>
                                                                    <th>Order</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {user.history.map(entry => (
                                                                    <tr key={entry.id}>
                                                                        <td>{formatDate(entry.createdAt)}</td>
                                                                        <td>
                                                                            <span className={`type-badge ${entry.type}`}>
                                                                                {entry.type === 'credit' ? '💰 Credit' : '⚠️ Debit'}
                                                                            </span>
                                                                        </td>
                                                                        <td>${entry.originalAmount.toFixed(2)}</td>
                                                                        <td>${entry.remainingAmount.toFixed(2)}</td>
                                                                        <td>{entry.reason}</td>
                                                                        <td>
                                                                            <span className={`status-badge ${entry.status}`}>
                                                                                {entry.status}
                                                                            </span>
                                                                        </td>
                                                                        <td>{entry.relatedOrderId || '-'}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Refresh Button */}
                <div className="actions-footer">
                    <button className="btn btn-primary" onClick={fetchBalances}>
                        🔄 Refresh Balances
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccountBalances;


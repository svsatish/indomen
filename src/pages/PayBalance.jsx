import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import MultiPayment from '../components/MultiPayment';
import './PayBalance.css';

const PayBalance = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [balanceData, setBalanceData] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [paymentComplete, setPaymentComplete] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('full'); // 'full' or 'partial'
    const [showPayment, setShowPayment] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchBalance();
    }, [user, navigate]);

    const fetchBalance = async () => {
        try {
            const response = await fetch('/api/credits/balance', {
                credentials: 'include'
            });
            const data = await response.json();
            setBalanceData(data);
            setCustomAmount(data.debitBalance?.toString() || '0');
        } catch (error) {
            console.error('Error fetching balance:', error);
            showToastMessage('Failed to load balance', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToastMessage = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    };

    const handlePaymentSuccess = async (paymentId, paymentMethod) => {
        try {
            // Pay down the debit balance
            const payResponse = await fetch('/api/credits/pay-debit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    amount: getPaymentAmount(),
                    paymentId: paymentId,
                    paymentMethod: paymentMethod || 'stripe'
                }),
            });

            const payData = await payResponse.json();

            if (!payResponse.ok) {
                throw new Error(payData.error || 'Failed to update balance');
            }

            // Refresh balance FIRST and wait for it
            try {
                const response = await fetch('/api/credits/balance', {
                    credentials: 'include'
                });
                const data = await response.json();
                setBalanceData(data);
                setCustomAmount(data.debitBalance?.toString() || '0');
            } catch (error) {
                console.error('Error refreshing balance:', error);
            }

            // Now set payment complete after balance is updated
            setPaymentComplete(true);
            setShowPayment(false);
            showToastMessage('Payment successful! Your balance has been updated.', 'success');
        } catch (error) {
            showToastMessage(error.message, 'error');
        }
    };

    const handlePaymentError = (error) => {
        showToastMessage(error, 'error');
    };

    const getPaymentAmount = () => {
        if (paymentMode === 'full') {
            return balanceData?.debitBalance || 0;
        }
        return parseFloat(customAmount) || 0;
    };

    const isValidAmount = () => {
        const amount = getPaymentAmount();
        return amount > 0 && amount <= (balanceData?.debitBalance || 0);
    };

    if (loading) {
        return (
            <div className="pay-balance-page">
                <div className="container">
                    <div className="loading-spinner">Loading...</div>
                </div>
            </div>
        );
    }

    const debitBalance = balanceData?.debitBalance || 0;
    const creditBalance = balanceData?.creditBalance || 0;

    // No outstanding balance
    if (debitBalance <= 0) {
        return (
            <div className="pay-balance-page">
                <div className="container">
                    <div className="balance-card no-balance">
                        <div className="balance-icon">✅</div>
                        <h1>No Outstanding Balance</h1>
                        <p>You don't have any outstanding balance to pay.</p>

                        {creditBalance > 0 && (
                            <div className="credit-info">
                                <span className="credit-badge">💰 You have ${creditBalance.toFixed(2)} in store credit</span>
                            </div>
                        )}

                        <button
                            onClick={() => navigate('/products')}
                            className="btn btn-primary"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Payment complete
    if (paymentComplete) {
        const newDebit = balanceData?.debitBalance || 0;

        const handlePayRemaining = () => {
            // Reset all payment states for a fresh payment flow
            setPaymentComplete(false);
            setShowPayment(false);
            setPaymentMode('full');
            setCustomAmount(newDebit.toString());
        };

        return (
            <div className="pay-balance-page">
                <div className="container">
                    <div className="balance-card payment-success">
                        <div className="success-icon">🎉</div>
                        <h1>Payment Successful!</h1>
                        <p>Thank you for your payment.</p>

                        {newDebit > 0 ? (
                            <div className="remaining-balance">
                                <p>Remaining balance: <strong>${newDebit.toFixed(2)}</strong></p>
                                <button
                                    onClick={handlePayRemaining}
                                    className="btn btn-secondary"
                                >
                                    Pay Remaining Balance
                                </button>
                            </div>
                        ) : (
                            <div className="balance-cleared">
                                <p className="cleared-message">Your balance is now cleared!</p>
                            </div>
                        )}

                        <button
                            onClick={() => navigate('/products')}
                            className="btn btn-primary"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pay-balance-page">
            <div className="container">
                <div className="pay-balance-header">
                    <h1>Pay Outstanding Balance</h1>
                    <p>Settle your outstanding balance with us</p>
                </div>

                <div className="balance-grid">
                    {/* Balance Summary */}
                    <div className="balance-summary-card">
                        <h2>Account Summary</h2>

                        <div className="balance-details">
                            <div className="balance-row debit">
                                <span className="label">
                                    <span className="icon">⚠️</span>
                                    Balance Owed
                                </span>
                                <span className="amount negative">${debitBalance.toFixed(2)}</span>
                            </div>

                            {creditBalance > 0 && (
                                <div className="balance-row credit">
                                    <span className="label">
                                        <span className="icon">💰</span>
                                        Store Credit
                                    </span>
                                    <span className="amount positive">${creditBalance.toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        <div className="balance-history">
                            <h3>Recent Activity</h3>
                            {balanceData?.credits?.slice(0, 5).map((entry, index) => (
                                <div key={index} className={`history-item ${entry.type}`}>
                                    <div className="history-info">
                                        <span className="history-reason">{entry.reason}</span>
                                        <span className="history-date">
                                            {new Date(entry.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span className={`history-amount ${entry.type}`}>
                                        {entry.type === 'credit' ? '+' : '-'}${entry.originalAmount.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Section */}
                    <div className="payment-card">
                        <h2>Make a Payment</h2>

                        {!showPayment ? (
                            <>
                                <div className="payment-options">
                                    <label className={`payment-option ${paymentMode === 'full' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="paymentMode"
                                            value="full"
                                            checked={paymentMode === 'full'}
                                            onChange={() => setPaymentMode('full')}
                                        />
                                        <div className="option-content">
                                            <span className="option-title">Pay Full Balance</span>
                                            <span className="option-amount">${debitBalance.toFixed(2)}</span>
                                        </div>
                                    </label>

                                    <label className={`payment-option ${paymentMode === 'partial' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="paymentMode"
                                            value="partial"
                                            checked={paymentMode === 'partial'}
                                            onChange={() => setPaymentMode('partial')}
                                        />
                                        <div className="option-content">
                                            <span className="option-title">Pay Custom Amount</span>
                                            {paymentMode === 'partial' && (
                                                <div className="custom-amount-input">
                                                    <span className="currency">$</span>
                                                    <input
                                                        type="number"
                                                        value={customAmount}
                                                        onChange={(e) => setCustomAmount(e.target.value)}
                                                        min="0.01"
                                                        max={debitBalance}
                                                        step="0.01"
                                                        placeholder="Enter amount"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                </div>

                                {!isValidAmount() && paymentMode === 'partial' && (
                                    <div className="amount-warning">
                                        Please enter an amount between $0.01 and ${debitBalance.toFixed(2)}
                                    </div>
                                )}

                                <div className="payment-total">
                                    <span>Amount to Pay:</span>
                                    <span className="total-amount">${getPaymentAmount().toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={() => setShowPayment(true)}
                                    disabled={!isValidAmount()}
                                    className="btn btn-primary pay-button"
                                >
                                    🔒 Proceed to Secure Payment
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="payment-total">
                                    <span>Amount to Pay:</span>
                                    <span className="total-amount">${getPaymentAmount().toFixed(2)}</span>
                                </div>

                                <MultiPayment
                                    amount={getPaymentAmount()}
                                    onSuccess={handlePaymentSuccess}
                                    onError={handlePaymentError}
                                    buttonText={`Pay $${getPaymentAmount().toFixed(2)}`}
                                    showPaymentMethodSelector={true}
                                />

                                <button
                                    onClick={() => setShowPayment(false)}
                                    className="btn btn-ghost back-btn"
                                >
                                    ← Change Amount
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="back-link">
                    <button onClick={() => navigate(-1)} className="btn btn-ghost">
                        ← Back
                    </button>
                </div>
            </div>

            {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            )}
        </div>
    );
};

export default PayBalance;


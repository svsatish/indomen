import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import MultiPayment from '../components/MultiPayment';
import './Checkout.css';

const Checkout = () => {
    const { items, getTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [pickupLocation, setPickupLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [settings, setSettings] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [clientSecret, setClientSecret] = useState('');
    const [orderProcessing, setOrderProcessing] = useState(false);
    const [paymentIntentLoading, setPaymentIntentLoading] = useState(false);
    const [creditBalance, setCreditBalance] = useState(0);
    const [creditToApply, setCreditToApply] = useState(0);
    const [applyCreditChecked, setApplyCreditChecked] = useState(false);
    const [debitBalance, setDebitBalance] = useState(0); // Money customer owes
    const [netBalance, setNetBalance] = useState(0); // Net balance (positive = credit, negative = owes)

    // Track the total amount to detect when it changes (new order)
    const previousTotalRef = useRef(null);

    // Calculate total amount with useMemo to avoid unnecessary recalculations
    const totalAmount = useMemo(() => getTotal(), [items]);

    // Calculate final amount after credits and including any debits owed
    const finalAmount = useMemo(() => {
        const afterCredit = Math.max(0, totalAmount - creditToApply);
        const withDebit = afterCredit + debitBalance; // Add any money owed
        return withDebit;
    }, [totalAmount, creditToApply, debitBalance]);

    const pickupLocations = [
        'Ashburn',
        'Centerville',
        'Herndon',
        'Fairfax'
    ];

    // Reset component state on mount (but don't reset clientSecret here)
    useEffect(() => {
        console.log('Checkout component mounted');
        setError('');
        setOrderProcessing(false);

        return () => {
            console.log('Checkout component unmounting');
        };
    }, []);

    // Reset payment state when total amount changes (new order)
    useEffect(() => {
        if (previousTotalRef.current !== null && previousTotalRef.current !== totalAmount) {
            console.log('Total changed from', previousTotalRef.current, 'to', totalAmount, '- resetting payment state');
            setClientSecret('');
            setPaymentIntentLoading(false);
            setError('');
        }
        previousTotalRef.current = totalAmount;
    }, [totalAmount]);

    useEffect(() => {
        fetchSettings();
        fetchCreditBalance();
    }, []);

    const fetchCreditBalance = async () => {
        try {
            const response = await fetch('/api/credits/balance', {
                credentials: 'include'
            });
            const data = await response.json();
            setCreditBalance(data.creditBalance || 0);
            setDebitBalance(data.debitBalance || 0);
            setNetBalance(data.netBalance || 0);
        } catch (error) {
            console.error('Error fetching credit balance:', error);
        }
    };

    const handleApplyCreditChange = (checked) => {
        setApplyCreditChecked(checked);
        if (checked) {
            // Apply maximum available credit (up to order total)
            const maxCredit = Math.min(creditBalance, totalAmount);
            setCreditToApply(maxCredit);
        } else {
            setCreditToApply(0);
        }
    };

    useEffect(() => {
        // Create PaymentIntent when component mounts or items/total change
        // Only create payment intent if there's an amount to pay (after credits)
        if (items.length > 0 && finalAmount > 0 && !orderProcessing && !clientSecret && !paymentIntentLoading) {
            console.log('Creating payment intent for amount:', finalAmount);

            setPaymentIntentLoading(true);

            const createPaymentIntent = async () => {
                try {
                    const response = await fetch('/api/payment/create-payment-intent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount: finalAmount }),
                    });

                    const data = await response.json();

                    if (!response.ok || data.error) {
                        console.error('Stripe Error:', data.error);
                        setError(data.error || 'Payment system unavailable');
                        setPaymentIntentLoading(false);
                    } else if (data.clientSecret) {
                        console.log('Payment intent created successfully');
                        setClientSecret(data.clientSecret);
                        setPaymentIntentLoading(false);
                    } else {
                        setError('Payment system unavailable');
                        setPaymentIntentLoading(false);
                    }
                } catch (err) {
                    console.error('Error creating payment intent:', err);
                    setError('Payment system unavailable');
                    setPaymentIntentLoading(false);
                }
            };

            createPaymentIntent();
        }
    }, [items.length, finalAmount, orderProcessing, clientSecret, paymentIntentLoading]);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            setSettings(data);

            if (!data.acceptingOrders) {
                setError('We are not currently accepting new orders. Please check back later.');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const handleOrderSuccess = async (paymentId) => {
        setLoading(true);
        setOrderProcessing(true); // Set flag to prevent redirect
        setError('');

        try {
            // Step 1: Apply credits if any
            if (creditToApply > 0) {
                const creditResponse = await fetch('/api/credits/apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        amount: creditToApply,
                        orderId: 'pending' // Will update with actual order ID
                    })
                });

                if (!creditResponse.ok) {
                    const creditError = await creditResponse.json();
                    throw new Error(`Failed to apply credit: ${creditError.error}`);
                }
            }

            // Step 1.5: Pay off debit balance if any
            if (debitBalance > 0) {
                const debitResponse = await fetch('/api/credits/pay-debit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        amount: debitBalance,
                        paymentId: paymentId,
                        paymentMethod: 'stripe'
                    })
                });

                if (!debitResponse.ok) {
                    const debitError = await debitResponse.json();
                    throw new Error(`Failed to pay debit balance: ${debitError.error}`);
                }
            }

            // Step 2: Create the order
            const orderData = {
                items: items.map(item => ({
                    productId: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    unit: item.unit,
                    category: item.category
                })),
                total: totalAmount,
                creditApplied: creditToApply,
                debitApplied: debitBalance, // Balance owed from previous purchases
                finalAmount: finalAmount,
                pickupLocation,
                phone: user?.phone || '',
                notes,
                paymentId: paymentId || (finalAmount === 0 ? 'paid_with_credit' : 'demo_payment_id'),
                paymentMethod: finalAmount === 0 ? 'credit' : 'stripe'
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const errorData = await response.json();

                // Check if it's a price mismatch error (security issue)
                if (errorData.error &&
                    (errorData.error.includes('Price mismatch') ||
                     errorData.error.includes('total mismatch'))) {
                    // Price manipulation detected - clear cart and show alert
                    setError('⚠️ Security Alert: Product prices have changed. Your cart has been cleared. Please add items again with current prices.');
                    clearCart();
                    setOrderProcessing(false);
                    return;
                }

                throw new Error(errorData.error || 'Failed to create order');
            }

            const order = await response.json();

            // Navigate immediately with order data, then clear cart
            navigate('/order-confirmation', { state: { order }, replace: true });

            // Clear cart after navigation starts
            setTimeout(() => {
                clearCart();
            }, 100);

        } catch (err) {
            console.error('Order creation error:', err);
            setError(err.message || 'Failed to place order. Please contact support.');
            setOrderProcessing(false); // Reset flag on error
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0 && !orderProcessing) {
        navigate('/cart');
        return null;
    }

    return (
        <div className="checkout-page">
            {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            )}
            <div className="container container-narrow">
                <h1 className="page-title">Checkout</h1>

                {error && (
                    <div className="alert alert-error">{error}</div>
                )}

                <div className="checkout-top-section">
                    <div className="pickup-info-section">
                        <h2>Pickup Information</h2>

                        <div className="form-group">
                            <label htmlFor="location" className="form-label">Pickup Location *</label>
                            <select
                                id="location"
                                value={pickupLocation}
                                onChange={(e) => setPickupLocation(e.target.value)}
                                className="form-select"
                                required
                            >
                                <option value="">Select a location...</option>
                                {pickupLocations.map(location => (
                                    <option key={location} value={location}>{location}</option>
                                ))}
                            </select>
                            <p className="help-text">Select the location where you'll pick up your order</p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="notes" className="form-label">Order Notes (Optional)</label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="form-textarea"
                                placeholder="Any special instructions..."
                                rows="3"
                            />
                        </div>
                    </div>

                    <div className="payment-info-section card">
                        <h2>💳 Secure Payment</h2>
                        {!pickupLocation ? (
                            <div className="alert alert-warning">
                                Please select a pickup location to proceed with payment.
                            </div>
                        ) : finalAmount === 0 ? (
                            <div className="payment-placeholder">
                                <div className="demo-payment">
                                    <p className="text-success mb-md">
                                        ✅ Order fully covered by store credit!
                                    </p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleOrderSuccess('paid_with_credit')}
                                        disabled={loading}
                                    >
                                        {loading ? 'Processing...' : 'Place Order (No Payment Required)'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            clientSecret && !paymentIntentLoading ? (
                                <MultiPayment
                                    clientSecret={clientSecret}
                                    amount={finalAmount}
                                    onSuccess={handleOrderSuccess}
                                    onError={(error) => setError(error.message)}
                                />
                            ) : (
                                <div className="payment-placeholder">
                                    {error && error.includes('Payment system') ? (
                                        <div className="demo-payment">
                                            <p className="text-error mb-md">
                                                ⚠️ Stripe is not configured (Missing API Keys).
                                            </p>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => handleOrderSuccess('demo_payment_id')}
                                                disabled={loading}
                                            >
                                                Simulate Successful Payment (Demo)
                                            </button>
                                        </div>
                                    ) : paymentIntentLoading ? (
                                        <div className="loading-spinner">
                                            <div className="spinner"></div>
                                            <p>Loading payment options...</p>
                                        </div>
                                    ) : (
                                        <div className="loading-spinner">
                                            <div className="spinner"></div>
                                            <p>Initializing payment...</p>
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                    </div>
                </div>

                <div className="order-summary-section">
                    <div className="order-summary card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="summary-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid var(--color-border)' }}>
                            <h2 style={{ margin: 0 }}>Order Summary</h2>
                            <button onClick={() => navigate('/cart')} className="btn-link">Edit Cart</button>
                        </div>

                        <div className="summary-items" style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
                            {items.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border-light)', gap: '12px' }}>
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>×{item.quantity}</span>
                                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', minWidth: '70px', textAlign: 'right' }}>${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--color-border)' }}>
                            {/* Subtotal */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Subtotal</span>
                                <span style={{ fontSize: '18px', fontWeight: 600 }}>${totalAmount.toFixed(2)}</span>
                            </div>

                            {/* Store Credit Section */}
                            {creditBalance > 0 && (
                                <div style={{ background: 'rgba(76, 140, 74, 0.1)', borderRadius: '8px', padding: '12px', margin: '12px 0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                                            <input
                                                type="checkbox"
                                                checked={applyCreditChecked}
                                                onChange={(e) => handleApplyCreditChange(e.target.checked)}
                                                style={{ width: '18px', height: '18px' }}
                                            />
                                            <span>Apply Store Credit</span>
                                        </label>
                                        <span style={{ fontSize: '14px', color: 'var(--color-success)', fontWeight: 600 }}>Available: ${creditBalance.toFixed(2)}</span>
                                    </div>
                                    {applyCreditChecked && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(76, 140, 74, 0.15)', borderRadius: '4px' }}>
                                            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Credit Applied</span>
                                            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-success)' }}>-${creditToApply.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Debit Balance (Money Owed) */}
                            {debitBalance > 0 && (
                                <div style={{ background: 'rgba(237, 137, 54, 0.1)', borderRadius: '8px', padding: '12px', margin: '12px 0', borderLeft: '4px solid var(--color-warning)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--color-warning)' }}>⚠️ Previous Balance Owed</span>
                                        <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-warning)' }}>+${debitBalance.toFixed(2)}</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid var(--color-warning)', marginBottom: 0 }}>
                                        This amount from previous purchases will be added to your order total.
                                    </p>
                                </div>
                            )}

                            {/* Total */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', marginTop: '12px', borderTop: '2px dashed var(--color-border)' }}>
                                <span style={{ fontSize: '18px', fontWeight: 700 }}>Total to Pay</span>
                                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)' }}>${finalAmount.toFixed(2)}</span>
                            </div>

                            {finalAmount === 0 && creditToApply > 0 && debitBalance === 0 && (
                                <div className="alert alert-success" style={{ marginTop: '16px' }}>
                                    🎉 Order fully covered by store credit!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;

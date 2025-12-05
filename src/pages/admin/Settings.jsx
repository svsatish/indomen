import { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import './Settings.css';

const Settings = () => {
    const { settings: globalSettings, loading: contextLoading, updateSettings } = useSettings();

    const [localSettings, setLocalSettings] = useState({
        acceptingOrders: true,
        pickupAddress: '',
        pickupHours: '',
        bannerMessage: '',
        bannerType: 'info',
        bannerActive: false
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Sync local state with global settings when they load
    useEffect(() => {
        if (globalSettings) {
            setLocalSettings(globalSettings);
        }
    }, [globalSettings]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        const success = await updateSettings(localSettings);

        if (success) {
            setMessage('Settings saved successfully!');
        } else {
            setMessage('Error saving settings');
        }

        setSaving(false);
        setTimeout(() => setMessage(''), 3000);
    };

    if (contextLoading) {
        return <div className="loading">Loading settings...</div>;
    }

    return (
        <div className="settings-page">
            <div className="container">
                <h1 className="page-title">Site Settings</h1>

                {message && (
                    <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="settings-form card">
                    <div className="settings-section">
                        <h2>Order Management</h2>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={localSettings.acceptingOrders}
                                    onChange={(e) => setLocalSettings({ ...localSettings, acceptingOrders: e.target.checked })}
                                />
                                <span>Accept New Orders</span>
                            </label>
                            <p className="help-text">
                                When disabled, customers cannot place new orders. Use this to temporarily close ordering.
                            </p>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h2>Pickup Information</h2>

                        <div className="form-group">
                            <label className="form-label">Pickup Address</label>
                            <textarea
                                value={localSettings.pickupAddress}
                                onChange={(e) => setLocalSettings({ ...localSettings, pickupAddress: e.target.value })}
                                className="form-textarea"
                                rows="2"
                                placeholder="123 Farm Road, Countryside, PA 12345"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Pickup Hours</label>
                            <input
                                type="text"
                                value={localSettings.pickupHours}
                                onChange={(e) => setLocalSettings({ ...localSettings, pickupHours: e.target.value })}
                                className="form-input"
                                placeholder="Thursday 3:00 PM - 7:00 PM"
                            />
                        </div>
                    </div>

                    <div className="settings-section">
                        <h2>Site Banner</h2>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={localSettings.bannerActive}
                                    onChange={(e) => setLocalSettings({ ...localSettings, bannerActive: e.target.checked })}
                                />
                                <span>Show Banner</span>
                            </label>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Banner Message</label>
                            <textarea
                                value={localSettings.bannerMessage}
                                onChange={(e) => setLocalSettings({ ...localSettings, bannerMessage: e.target.value })}
                                className="form-textarea"
                                rows="2"
                                placeholder="Important announcement for customers..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Banner Type</label>
                            <select
                                value={localSettings.bannerType}
                                onChange={(e) => setLocalSettings({ ...localSettings, bannerType: e.target.value })}
                                className="form-select"
                            >
                                <option value="info">Info (Blue)</option>
                                <option value="success">Success (Green)</option>
                                <option value="warning">Warning (Yellow)</option>
                                <option value="error">Error (Red)</option>
                            </select>
                        </div>

                        {localSettings.bannerActive && localSettings.bannerMessage && (
                            <div className="banner-preview">
                                <p><strong>Preview:</strong></p>
                                <div className={`alert alert-${localSettings.bannerType}`}>
                                    {localSettings.bannerMessage}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="submit" disabled={saving} className="btn btn-primary btn-lg">
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;

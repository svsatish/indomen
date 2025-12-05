import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        acceptingOrders: true,
        pickupAddress: '',
        pickupHours: '',
        bannerMessage: '',
        bannerType: 'info',
        bannerActive: false
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            setSettings(data);
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (newSettings) => {
        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(newSettings)
            });

            if (response.ok) {
                setSettings(newSettings);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating settings:', error);
            return false;
        }
    };

    const refreshSettings = () => {
        fetchSettings();
    };

    return (
        <SettingsContext.Provider
            value={{
                settings,
                loading,
                updateSettings,
                refreshSettings
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};


import { useSettings } from '../context/SettingsContext';
import './SiteBanner.css';

const SiteBanner = () => {
    const { settings, loading } = useSettings();

    if (loading || !settings.bannerActive || !settings.bannerMessage) {
        return null;
    }

    return (
        <div className={`site-banner alert-${settings.bannerType || 'info'}`}>
            <div className="container">
                <p>{settings.bannerMessage}</p>
            </div>
        </div>
    );
};

export default SiteBanner;

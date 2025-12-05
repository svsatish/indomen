import { useState, useEffect } from 'react';
import './Toast.css';

let toastId = 0;

const Toast = () => {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handleToast = (event) => {
            const { message, type = 'success' } = event.detail;
            const id = ++toastId;

            setToasts(prev => [...prev, { id, message, type }]);

            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 3000);
        };

        window.addEventListener('showToast', handleToast);
        return () => window.removeEventListener('showToast', handleToast);
    }, []);

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <div key={toast.id} className={`toast toast-${toast.type} toast-enter`}>
                    <div className="toast-icon">
                        {toast.type === 'success' && '✅'}
                        {toast.type === 'error' && '❌'}
                        {toast.type === 'info' && 'ℹ️'}
                    </div>
                    <div className="toast-message">{toast.message}</div>
                </div>
            ))}
        </div>
    );
};

export const showToast = (message, type = 'success') => {
    window.dispatchEvent(new CustomEvent('showToast', { detail: { message, type } }));
};

export default Toast;

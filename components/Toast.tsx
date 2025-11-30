import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    description?: string;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, message, description, onClose }) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-400" />,
        error: <XCircle className="w-5 h-5 text-red-400" />,
        warning: <AlertCircle className="w-5 h-5 text-yellow-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />
    };

    const colors = {
        success: 'bg-green-500/10 border-green-500/30',
        error: 'bg-red-500/10 border-red-500/30',
        warning: 'bg-yellow-500/10 border-yellow-500/30',
        info: 'bg-blue-500/10 border-blue-500/30'
    };

    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, 4000);

        return () => clearTimeout(timer);
    }, [id, onClose]);

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-lg border ${colors[type]} backdrop-blur-sm animate-in slide-in-from-right-5 duration-300`}
            style={{ minWidth: '320px', maxWidth: '480px' }}
        >
            <div className="shrink-0 mt-0.5">
                {icons[type]}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-theme-primary">{message}</p>
                {description && (
                    <p className="text-xs text-theme-tertiary mt-1">{description}</p>
                )}
            </div>
            <button
                onClick={() => onClose(id)}
                className="shrink-0 text-theme-tertiary hover:text-theme-primary transition-colors"
            >
                <XCircle className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Toast;

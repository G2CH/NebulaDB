import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    variant = 'danger'
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative glass-strong rounded-xl border border-white/10 p-6 shadow-xl max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-md transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Icon */}
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className={`p-2 rounded-lg ${variant === 'danger' ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}
                    >
                        <AlertTriangle
                            className={`w-6 h-6 ${variant === 'danger' ? 'text-red-500' : 'text-yellow-500'}`}
                        />
                    </div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {title}
                    </h3>
                </div>

                {/* Message */}
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                    {message}
                </p>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                    >
                        {cancelText || t('common.cancel')}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'
                            } text-white`}
                    >
                        {confirmText || t('common.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;

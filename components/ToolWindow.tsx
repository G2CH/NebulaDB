import React, { useState, ReactNode } from 'react';
import { X, Minimize2, Pin, PinOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ToolWindowProps {
    title: string;
    children: ReactNode;
    isOpen: boolean;
    isPinned?: boolean;
    onClose?: () => void;
    onTogglePin?: () => void;
    onMinimize?: () => void;
    side?: 'left' | 'right' | 'bottom';
    width?: number | string;
    height?: number | string;
    hideHeader?: boolean;
    className?: string;
}

const ToolWindow: React.FC<ToolWindowProps> = ({
    title,
    children,
    isOpen,
    isPinned = true,
    onClose,
    onTogglePin,
    onMinimize,
    side = 'left',
    width,
    height,
    hideHeader = false,
    className = ''
}) => {
    const { t } = useTranslation();
    const [isMinimized, setIsMinimized] = useState(false);

    if (!isOpen) return null;

    const sideStyles = {
        left: 'border-r',
        right: 'border-l',
        bottom: 'border-t'
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    return (
        <div
            className={`flex flex-col glass-strong border-white/5 ${sideStyles[side]} ${className || ''}`}
            style={style}
        >
            {/* Tool Window Header */}
            {!hideHeader && (
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 glass-subtle shrink-0">
                    <span className="text-[11px] font-semibold text-theme-tertiary uppercase tracking-wider">
                        {title}
                    </span>

                    <div className="flex items-center gap-0.5">
                        {onTogglePin && (
                            <button
                                onClick={onTogglePin}
                                className="button-base p-0.5 rounded"
                                title={isPinned ? 'Unpin' : 'Pin'}
                            >
                                {isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
                            </button>
                        )}

                        {onMinimize && (
                            <button
                                onClick={onMinimize}
                                className="button-base p-0.5 rounded"
                                title={t('common.minimize')}
                            >
                                <Minimize2 className="w-3 h-3" />
                            </button>
                        )}

                        {onClose && (
                            <button
                                onClick={onClose}
                                className="button-base p-0.5 rounded"
                                title={t('common.close')}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Tool Window Content */}
            <div className="flex-1 overflow-hidden">
                {children}
            </div>
        </div>
    );
};

export default ToolWindow;

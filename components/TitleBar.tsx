import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';

interface TitleBarProps {
    onSettings: () => void;
}

import { getCurrentWindow } from '@tauri-apps/api/window';

const TitleBar: React.FC<TitleBarProps> = ({
    onSettings
}) => {
    const { t } = useTranslation();
    const [isWindows, setIsWindows] = React.useState(false);

    React.useEffect(() => {
        setIsWindows(navigator.userAgent.includes('Windows'));
    }, []);

    const handleMouseDown = async (e: React.MouseEvent) => {
        // Only drag on left click
        if (e.button === 0) {
            await getCurrentWindow().startDragging();
        }
    };

    const handleMinimize = () => getCurrentWindow().minimize();
    const handleMaximize = () => getCurrentWindow().toggleMaximize();
    const handleClose = () => getCurrentWindow().close();

    return (
        <div
            onMouseDown={handleMouseDown}
            onDoubleClick={handleMaximize}
            className="h-[38px] border-b border-white/5 glass-strong shrink-0 select-none flex items-center justify-between px-3 z-50 cursor-default text-theme-primary"
        >
            {/* Left Section - Traffic Lights Placeholder & Logo */}
            <div className="flex items-center h-full">
                {/* macOS Traffic Lights Placeholder - approx 70px */}
                {!isWindows && <div className="w-[70px] h-full" />}

                {/* Logo & App Name */}
                <div className="flex items-center gap-2 font-medium text-theme-secondary">
                    <div className="w-5 h-5 bg-violet-600 rounded-md flex items-center justify-center text-white font-bold text-xs">
                        N
                    </div>
                    <span>NebulaDB</span>
                </div>
            </div>

            {/* Right Section - Settings & Windows Controls */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onSettings}
                    onMouseDown={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                    style={{
                        color: 'var(--text-tertiary)',
                        backgroundColor: 'transparent'
                    }}
                    className="p-1.5 hover:bg-opacity-20 rounded-md transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title={t('topBar.settings')}
                >
                    <Settings className="w-4 h-4" />
                </button>

                {/* Windows Controls */}
                {isWindows && (
                    <div className="flex items-center ml-2 pl-2" style={{ borderLeftColor: 'var(--glass-border)', borderLeftWidth: '1px' }}>
                        <button
                            onClick={handleMinimize}
                            onMouseDown={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-sm transition-colors"
                            style={{ color: 'var(--text-tertiary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M1 5h8v1H1z" /></svg>
                        </button>
                        <button
                            onClick={handleMaximize}
                            onMouseDown={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-sm transition-colors"
                            style={{ color: 'var(--text-tertiary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor"><rect x="1.5" y="1.5" width="7" height="7" /></svg>
                        </button>
                        <button
                            onClick={handleClose}
                            onMouseDown={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-sm transition-colors"
                            style={{ color: 'var(--text-tertiary)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                        >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M1.5 1.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.5" /></svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TitleBar;

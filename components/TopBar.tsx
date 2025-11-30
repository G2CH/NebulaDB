import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Database,
    ChevronDown,
    Plus,
    Play,
    Square,
    Wand2,
    Settings,
    Globe,
    Search
} from 'lucide-react';

interface TopBarProps {
    connections: any[];
    activeConnectionId: string | null;
    isExecuting: boolean;
    onNewQuery: () => void;
    onExecuteQuery: () => void;
    onStopQuery: () => void;
    onSettings: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
    connections,
    activeConnectionId,
    isExecuting,
    onNewQuery,
    onExecuteQuery,
    onStopQuery,
    onSettings
}) => {
    const { t, i18n } = useTranslation();
    const activeConnection = connections.find(c => c.id === activeConnectionId);

    return (
        <div className="h-12 glass-subtle border-b border-white/5 flex items-center justify-between px-4 shrink-0">
            {/* Left Section - Logo & Connection */}
            <div className="flex items-center gap-4">
                {/* Minimal Logo */}
                <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 bg-white/5 rounded-md border border-white/5 flex items-center justify-center">
                        <Database className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <span className="text-sm font-semibold text-white">NextDB</span>
                </div>

                <div className="w-px h-5 bg-white/5"></div>

                {/* Connection Selector */}
                <div className="relative">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-md transition-colors min-w-[200px] text-xs">
                        <Database className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-zinc-300 truncate flex-1 text-left">
                            {activeConnection ? activeConnection.name : t('topBar.noConnection')}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                </div>

                {/* Search */}
                <button className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-md transition-colors text-zinc-500 hover:text-zinc-300">
                    <Search className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Center Section - Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onNewQuery}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-md transition-colors text-xs text-zinc-300 hover:text-white"
                    title={t('topBar.newQuery')}
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{t('topBar.newQuery')}</span>
                </button>

                <div className="w-px h-5 bg-white/5"></div>

                {isExecuting ? (
                    <button
                        onClick={onStopQuery}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-400 rounded-md transition-colors text-xs font-medium"
                        title={t('topBar.stop')}
                    >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>{t('topBar.stop')}</span>
                    </button>
                ) : (
                    <button
                        onClick={onExecuteQuery}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-600/30 text-violet-400 rounded-md transition-colors text-xs font-medium"
                        title={t('topBar.execute')}
                    >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{t('topBar.execute')}</span>
                    </button>
                )}

                <button
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-md transition-colors text-xs text-zinc-500 hover:text-zinc-300"
                    title={t('topBar.format')}
                >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{t('topBar.format')}</span>
                </button>
            </div>

            {/* Right Section - Settings & Language */}
            <div className="flex items-center gap-2">
                {/* Language Switcher */}
                <button
                    onClick={() => i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')}
                    className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-md transition-colors text-zinc-500 hover:text-zinc-300"
                    title={t('topBar.language')}
                >
                    <Globe className="w-3.5 h-3.5" />
                </button>

                {/* Settings */}
                <button
                    onClick={onSettings}
                    className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-md transition-colors text-zinc-500 hover:text-zinc-300"
                    title={t('topBar.settings')}
                >
                    <Settings className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

export default TopBar;

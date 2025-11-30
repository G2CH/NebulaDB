import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Database,
    ChevronDown,
    Settings,
    MoreHorizontal
} from 'lucide-react';

interface EditorToolbarProps {
    connections: any[];
    activeConnectionId: string | null;
    onSettings: () => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
    connections,
    activeConnectionId,
    onSettings
}) => {
    const { t } = useTranslation();
    const activeConnection = connections.find(c => c.id === activeConnectionId);

    return (
        <div className="h-8 glass-subtle border-b border-white/5 flex items-center justify-between px-2 shrink-0">
            {/* Left Section - Connection */}
            <div className="flex items-center gap-1">
                {/* Connection Selector */}
                <button className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-xs transition-colors h-6">
                    <Database className="w-3 h-3 text-violet-400" />
                    <span className="text-theme-secondary max-w-[120px] truncate">
                        {activeConnection ? activeConnection.name : t('topBar.noConnection')}
                    </span>
                    <ChevronDown className="w-3 h-3 text-theme-tertiary" />
                </button>
            </div>

            {/* Right Section - Settings */}
            <div className="flex items-center gap-1">
                <button
                    onClick={onSettings}
                    className="p-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded transition-colors h-6"
                    title={t('topBar.settings')}
                >
                    <Settings className="w-3 h-3" />
                </button>

                <button className="p-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded transition-colors h-6">
                    <MoreHorizontal className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};

export default EditorToolbar;

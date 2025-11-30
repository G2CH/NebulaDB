import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Globe, Palette, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SettingsTab = 'general' | 'appearance' | 'ai';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');

    const handleSaveApiKey = () => {
        localStorage.setItem('gemini_api_key', apiKey);
        toast.success(t('settings.apiKeySaved', 'API Key saved successfully'));
    };

    if (!isOpen) return null;

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-[100]">
            <div className="rounded-xl w-[600px] max-h-[80vh] flex flex-col shadow-2xl glass-strong border border-white/10">
                {/* Header */}
                <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
                    <h2 className="text-sm font-medium text-theme-primary">{t('settings.title')}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded transition-colors"
                        style={{ color: 'var(--text-tertiary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 min-h-0">
                    {/* Sidebar */}
                    <div className="w-40 border-r border-white/5 p-2 shrink-0">
                        {[
                            { id: 'general' as SettingsTab, label: t('settings.general'), icon: Globe },
                            { id: 'appearance' as SettingsTab, label: t('settings.appearance'), icon: Palette },
                            { id: 'ai' as SettingsTab, label: t('settings.ai', 'AI'), icon: Sparkles },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors"
                                style={{
                                    backgroundColor: activeTab === tab.id ? 'var(--bg-tertiary)' : 'transparent',
                                    color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)'
                                }}
                                onMouseEnter={(e) => { if (activeTab !== tab.id) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                                onMouseLeave={(e) => { if (activeTab !== tab.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Settings Panel */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-medium text-theme-tertiary mb-2">
                                        {t('settings.language')}
                                    </label>
                                    <select
                                        value={i18n.language}
                                        onChange={(e) => handleLanguageChange(e.target.value)}
                                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="en">English</option>
                                        <option value="zh">中文</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-medium text-theme-tertiary mb-2">
                                        {t('settings.theme')}
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'dark', label: t('settings.themes.dark'), description: t('settings.themes.darkDesc') },
                                            { id: 'light', label: t('settings.themes.light'), description: t('settings.themes.lightDesc') }
                                        ].map(themeOption => (
                                            <button
                                                key={themeOption.id}
                                                onClick={() => setTheme(themeOption.id as 'dark' | 'light')}
                                                className="px-4 py-3 rounded-md border transition-all"
                                                style={{
                                                    backgroundColor: theme === themeOption.id ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-secondary)',
                                                    borderColor: theme === themeOption.id ? 'rgba(139, 92, 246, 0.5)' : 'var(--border-secondary)',
                                                    color: theme === themeOption.id ? '#a78bfa' : 'var(--text-secondary)'
                                                }}
                                            >
                                                <div className="text-sm font-medium capitalize">{themeOption.label}</div>
                                                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                                    {themeOption.description}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-medium text-theme-tertiary mb-2">
                                        {t('settings.geminiApiKey', 'Gemini API Key')}
                                    </label>
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-violet-500 font-mono"
                                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
                                        placeholder="AIza..."
                                    />
                                    <p className="text-xs text-theme-muted mt-1">
                                        {t('settings.apiKeyHint', 'Get your API key from Google AI Studio')}
                                    </p>
                                    <button
                                        onClick={handleSaveApiKey}
                                        className="mt-3 px-4 py-2 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-600/30 text-violet-400 text-sm font-medium rounded-md transition-colors"
                                    >
                                        {t('settings.saveApiKey', 'Save API Key')}
                                    </button>
                                </div>
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                                    <p className="text-xs text-blue-400">
                                        💡 {t('settings.aiHint', 'The AI assistant now uses your actual database schema to generate accurate SQL queries!')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="h-14 border-t flex items-center justify-end px-4 gap-2 shrink-0" style={{ borderTopColor: 'var(--glass-border)' }}>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border text-sm font-medium rounded-md transition-colors"
                        style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.3)', color: '#a78bfa' }}
                    >
                        {t('settings.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;

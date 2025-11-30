
import React from 'react';
import { useTranslation } from 'react-i18next';

interface OptionsTabProps {
    connectionType?: string;
    charset?: string;
    collation?: string;
    engine?: string;
    autoIncrement?: number;
    onCharsetChange: (value: string) => void;
    onCollationChange: (value: string) => void;
    onEngineChange: (value: string) => void;
    onAutoIncrementChange: (value: number) => void;
}

const MYSQL_CHARSETS = [
    'utf8mb4',
    'utf8',
    'latin1',
    'ascii',
    'utf8mb3',
    'gbk',
    'utf16',
    'utf32'
];

const MYSQL_COLLATIONS = [
    'utf8mb4_general_ci',
    'utf8mb4_unicode_ci',
    'utf8mb4_0900_ai_ci',
    'utf8_general_ci',
    'utf8_unicode_ci',
    'latin1_swedish_ci',
    'latin1_general_ci'
];

const MYSQL_ENGINES = [
    'InnoDB',
    'MyISAM',
    'MEMORY',
    'CSV',
    'ARCHIVE',
    'BLACKHOLE',
    'FEDERATED'
];

const OptionsTab: React.FC<OptionsTabProps> = ({
    connectionType,
    charset = 'utf8mb4',
    collation = 'utf8mb4_0900_ai_ci',
    engine = 'InnoDB',
    autoIncrement = 1,
    onCharsetChange,
    onCollationChange,
    onEngineChange,
    onAutoIncrementChange
}) => {
    const { t } = useTranslation();
    const isMysql = connectionType === 'mysql';

    return (
        <div className="p-8 h-full overflow-y-auto glass-subtle">
            <div className="max-w-2xl space-y-6">
                {/* MySQL-specific options */}
                {isMysql && (
                    <>
                        {/* Charset */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-theme-primary">
                                {t('tableDesigner.options.charset')}
                            </label>
                            <select
                                value={charset}
                                onChange={(e) => onCharsetChange(e.target.value)}
                                className="w-full bg-theme-secondary border border-theme-secondary rounded-lg px-4 py-2.5 text-sm text-theme-primary focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            >
                                {MYSQL_CHARSETS.map(cs => (
                                    <option key={cs} value={cs}>{cs}</option>
                                ))}
                            </select>
                            <p className="text-xs text-theme-tertiary">
                                {t('tableDesigner.options.charsetHint')}
                            </p>
                        </div>

                        {/* Collation */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-theme-primary">
                                {t('tableDesigner.options.collation')}
                            </label>
                            <select
                                value={collation}
                                onChange={(e) => onCollationChange(e.target.value)}
                                className="w-full bg-theme-secondary border border-theme-secondary rounded-lg px-4 py-2.5 text-sm text-theme-primary focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            >
                                {MYSQL_COLLATIONS.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                            <p className="text-xs text-theme-tertiary">
                                {t('tableDesigner.options.collationHint')}
                            </p>
                        </div>

                        {/* Engine */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-theme-primary">
                                {t('tableDesigner.options.engine')}
                            </label>
                            <select
                                value={engine}
                                onChange={(e) => onEngineChange(e.target.value)}
                                className="w-full bg-theme-secondary border border-theme-secondary rounded-lg px-4 py-2.5 text-sm text-theme-primary focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            >
                                {MYSQL_ENGINES.map(eng => (
                                    <option key={eng} value={eng}>{eng}</option>
                                ))}
                            </select>
                            <p className="text-xs text-theme-tertiary">
                                {t('tableDesigner.options.engineHint')}
                            </p>
                        </div>

                        {/* Auto Increment */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-theme-primary">
                                {t('tableDesigner.options.autoIncrement')}
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={autoIncrement}
                                onChange={(e) => onAutoIncrementChange(parseInt(e.target.value) || 1)}
                                className="w-full bg-theme-secondary border border-theme-secondary rounded-lg px-4 py-2.5 text-sm text-theme-primary focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                            <p className="text-xs text-theme-tertiary">
                                {t('tableDesigner.options.autoIncrementHint')}
                            </p>
                        </div>
                    </>
                )}

                {/* PostgreSQL/SQLite message */}
                {!isMysql && (
                    <div className="bg-theme-secondary border border-theme-secondary rounded-lg p-6 text-center">
                        <p className="text-sm text-theme-tertiary">
                            {t('tableDesigner.options.notAvailable', 'Table options are primarily for MySQL databases.')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OptionsTab;

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface ConsoleLog {
    id: string;
    timestamp: number;
    level: LogLevel;
    message: string;
    details?: string;
}

interface ConsoleContextType {
    logs: ConsoleLog[];
    addLog: (level: LogLevel, message: string, details?: string) => void;
    clearLogs: () => void;
}

const ConsoleContext = createContext<ConsoleContextType | undefined>(undefined);

export const useConsole = () => {
    const context = useContext(ConsoleContext);
    if (!context) {
        throw new Error('useConsole must be used within ConsoleProvider');
    }
    return context;
};

interface ConsoleProviderProps {
    children: ReactNode;
}

const MAX_LOGS = 200;

export const ConsoleProvider: React.FC<ConsoleProviderProps> = ({ children }) => {
    const [logs, setLogs] = useState<ConsoleLog[]>([]);

    const addLog = useCallback((level: LogLevel, message: string, details?: string) => {
        const newLog: ConsoleLog = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            level,
            message,
            details,
        };

        setLogs(prev => [newLog, ...prev].slice(0, MAX_LOGS));
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    return (
        <ConsoleContext.Provider value={{ logs, addLog, clearLogs }}>
            {children}
        </ConsoleContext.Provider>
    );
};

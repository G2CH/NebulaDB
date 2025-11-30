import { useState, useEffect, useCallback } from 'react';

export interface HistoryItem {
    id: string;
    query: string;
    timestamp: number;
    status: 'success' | 'error';
    executionTimeMs?: number;
    connectionName?: string;
    rowCount?: number;
}

const STORAGE_KEY = 'nextdb_query_history';
const MAX_HISTORY_ITEMS = 100;

export const useQueryHistory = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setHistory(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load query history:', error);
        }
    }, []);

    // Save to localStorage whenever history changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (error) {
            console.error('Failed to save query history:', error);
        }
    }, [history]);

    const addHistoryItem = useCallback((item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
        setHistory(prev => {
            const newItem: HistoryItem = {
                ...item,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
            };
            const newHistory = [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
            return newHistory;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    return {
        history,
        addHistoryItem,
        clearHistory
    };
};

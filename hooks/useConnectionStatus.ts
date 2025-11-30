import { useState, useEffect, useCallback } from 'react';

export interface ConnectionStatus {
    isConnected: boolean;
    lastChecked: number | null;
    error: string | null;
}

/**
 * Hook for managing connection health status
 */
export const useConnectionStatus = (connectionId: string | null) => {
    const [status, setStatus] = useState<ConnectionStatus>({
        isConnected: false,
        lastChecked: null,
        error: null
    });

    const checkConnection = useCallback(async () => {
        if (!connectionId) {
            setStatus({
                isConnected: false,
                lastChecked: Date.now(),
                error: 'No active connection'
            });
            return false;
        }

        try {
            // Simple ping query to check connection
            const { executeQuery } = await import('../services/dbService');
            await executeQuery(connectionId, 'SELECT 1');

            setStatus({
                isConnected: true,
                lastChecked: Date.now(),
                error: null
            });
            return true;
        } catch (error) {
            setStatus({
                isConnected: false,
                lastChecked: Date.now(),
                error: String(error)
            });
            return false;
        }
    }, [connectionId]);

    // Auto-check on mount and when connectionId changes
    useEffect(() => {
        checkConnection();
    }, [checkConnection]);

    return {
        ...status,
        checkConnection
    };
};

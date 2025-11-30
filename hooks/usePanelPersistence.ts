import { useEffect, useState } from 'react';

interface PanelSizes {
    sidebar?: number;
    rightPanel?: number;
    bottomPanel?: number;
}

const STORAGE_KEY = 'nextdb_panel_sizes_v2';

export function usePanelPersistence() {
    const [panelSizes, setPanelSizes] = useState<PanelSizes>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    const savePanelSize = (panel: keyof PanelSizes, size: number) => {
        setPanelSizes(prev => {
            const updated = { ...prev, [panel]: size };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const getPanelSize = (panel: keyof PanelSizes, defaultSize: number): number => {
        const size = panelSizes[panel];
        if (typeof size === 'number' && size > 0 && size < 100) {
            return size;
        }
        return defaultSize;
    };

    return { savePanelSize, getPanelSize };
}

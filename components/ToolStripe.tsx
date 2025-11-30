import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StripeItem {
    id: string;
    icon: LucideIcon;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

interface ToolStripeProps {
    side: 'left' | 'right';
    items: StripeItem[];
    bottomItems?: StripeItem[];
}

const ToolStripe: React.FC<ToolStripeProps> = ({ side, items, bottomItems }) => {
    return (
        <div className={`w-[40px] glass-strong flex flex-col items-center py-2 gap-2 shrink-0 border-${side === 'left' ? 'r' : 'l'} border-white/5`}>
            <div className="flex flex-col gap-2 w-full items-center">
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={item.onClick}
                        className={`
                            w-8 h-8 flex items-center justify-center rounded-md transition-all relative group
                            ${item.isActive
                                ? 'bg-theme-tertiary text-violet-400'
                                : 'text-theme-tertiary hover-text-secondary hover-bg-tertiary'}
                        `}
                        title={item.label}
                    >
                        <item.icon className="w-5 h-5" strokeWidth={1.5} />

                        {/* Active Indicator Line */}
                        {item.isActive && (
                            <div className={`
                                absolute w-[2px] h-full bg-violet-500 top-0
                                ${side === 'left' ? '-left-[4px]' : '-right-[4px]'}
                            `} />
                        )}
                    </button>
                ))}
            </div>

            {bottomItems && bottomItems.length > 0 && (
                <div className="mt-auto flex flex-col gap-2 w-full items-center">
                    {bottomItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={item.onClick}
                            className={`
                                w-8 h-8 flex items-center justify-center rounded-md transition-all relative group
                                ${item.isActive
                                    ? 'bg-theme-tertiary text-violet-400'
                                    : 'text-theme-tertiary hover-text-secondary hover-bg-tertiary'}
                            `}
                            title={item.label}
                        >
                            <item.icon className="w-5 h-5" strokeWidth={1.5} />

                            {/* Active Indicator Line */}
                            {item.isActive && (
                                <div className={`
                                    absolute w-[2px] h-full bg-violet-500 top-0
                                    ${side === 'left' ? '-left-[4px]' : '-right-[4px]'}
                                `} />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ToolStripe;

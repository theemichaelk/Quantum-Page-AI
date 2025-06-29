import React from 'react';
import {
  CheckCircledIcon,
  CrossCircledIcon,
  ExclamationTriangleIcon,
  ExternalLinkIcon,
  LightningBoltIcon,
  MixerHorizontalIcon,
  PlusIcon
} from '@radix-ui/react-icons';

// Define the insight type
export type InsightType = 'success' | 'warning' | 'error' | 'info';

// Define the insight interface
export interface Insight {
  /**
   * Unique identifier for the insight
   */
  id: string;
  
  /**
   * Type of insight (affects styling and icon)
   */
  type: InsightType;
  
  /**
   * Title/heading of the insight
   */
  title: string;
  
  /**
   * Detailed description of the insight
   */
  description: string;
  
  /**
   * Action text (e.g., "View details", "Fix now")
   */
  action: string;
  
  /**
   * Optional URL or callback function for the action
   */
  actionTarget?: string | (() => void);
  
  /**
   * Optional timestamp for when the insight was generated
   */
  timestamp?: Date;
  
  /**
   * Optional priority level (higher number = higher priority)
   */
  priority?: number;
  
  /**
   * Optional metadata for additional context
   */
  metadata?: Record<string, any>;
}

interface AIInsightsProps {
  /**
   * Array of insights to display
   */
  insights: Insight[];
  
  /**
   * Title of the insights panel
   * @default "AI Insights"
   */
  title?: string;
  
  /**
   * Maximum number of insights to display
   * @default Infinity (show all)
   */
  maxItems?: number;
  
  /**
   * Whether to show the count badge
   * @default true
   */
  showCount?: boolean;
  
  /**
   * Whether to allow filtering by type
   * @default false
   */
  allowFiltering?: boolean;
  
  /**
   * Callback when an insight is clicked
   */
  onInsightClick?: (insight: Insight) => void;
  
  /**
   * CSS class name for additional styling
   */
  className?: string;
  
  /**
   * Whether to animate insights on mount
   * @default true
   */
  animate?: boolean;
}

/**
 * Renders the appropriate icon based on insight type
 */
const InsightIcon: React.FC<{ type: InsightType }> = ({ type }) => {
  switch (type) {
    case 'success':
      return <CheckCircledIcon className="text-lime-pulse" />;
    case 'error':
      return <CrossCircledIcon className="text-critical-red" />;
    case 'warning':
      return <ExclamationTriangleIcon className="text-signal-amber" />;
    case 'info':
      return <LightningBoltIcon className="text-neon-azure" />;
    default:
      return <LightningBoltIcon className="text-neon-azure" />;
  }
};

/**
 * Get background color class based on insight type
 */
const getIconBackgroundClass = (type: InsightType): string => {
  switch (type) {
    case 'success':
      return 'bg-lime-pulse bg-opacity-20';
    case 'error':
      return 'bg-critical-red bg-opacity-20';
    case 'warning':
      return 'bg-signal-amber bg-opacity-20';
    case 'info':
      return 'bg-neon-azure bg-opacity-20';
    default:
      return 'bg-neon-azure bg-opacity-20';
  }
};

/**
 * Single insight item component
 */
const InsightItem: React.FC<{
  insight: Insight;
  onClick?: (insight: Insight) => void;
  animationDelay?: number;
}> = ({ insight, onClick, animationDelay = 0 }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(insight);
    } else if (typeof insight.actionTarget === 'function') {
      insight.actionTarget();
    }
  };
  
  const animationStyle = animationDelay > 0 ? {
    animationDelay: `${animationDelay}ms`,
  } : {};
  
  return (
    <div 
      className="bg-[#1D2029] rounded-lg p-3 hover:bg-opacity-80 transition-all cursor-pointer animate-fade-in"
      onClick={handleClick}
      style={animationStyle}
      role="button"
      aria-label={`${insight.title}: ${insight.description}`}
    >
      <div className="flex items-start">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${getIconBackgroundClass(insight.type)}`}>
          <InsightIcon type={insight.type} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-ice-white">{insight.title}</div>
          <div className="text-xs text-text-secondary mt-1">{insight.description}</div>
          <div className="text-xs text-neon-azure mt-2 flex items-center">
            {insight.action} <ExternalLinkIcon className="ml-1 w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Empty state component when no insights are available
 */
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="w-12 h-12 rounded-full bg-onyx flex items-center justify-center mb-3">
      <LightningBoltIcon className="w-6 h-6 text-text-secondary" />
    </div>
    <p className="text-sm text-text-secondary">No insights available yet</p>
    <p className="text-xs text-text-secondary mt-1">
      The AI is analyzing your site performance
    </p>
  </div>
);

/**
 * AIInsights component displays AI-generated suggestions and alerts
 * for website optimization
 */
const AIInsights: React.FC<AIInsightsProps> = ({
  insights,
  title = "AI Insights",
  maxItems = Infinity,
  showCount = true,
  allowFiltering = false,
  onInsightClick,
  className = '',
  animate = true,
}) => {
  const [filter, setFilter] = React.useState<InsightType | 'all'>('all');
  
  // Filter insights based on selected type
  const filteredInsights = React.useMemo(() => {
    if (filter === 'all') {
      return insights;
    }
    return insights.filter(insight => insight.type === filter);
  }, [insights, filter]);
  
  // Limit the number of insights to display
  const displayedInsights = filteredInsights.slice(0, maxItems);
  
  // Count insights by type
  const insightCounts = React.useMemo(() => {
    return insights.reduce((counts, insight) => {
      counts[insight.type] = (counts[insight.type] || 0) + 1;
      return counts;
    }, {} as Record<InsightType, number>);
  }, [insights]);
  
  return (
    <div className={`bg-onyx rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-sora font-semibold text-ice-white">{title}</h3>
        
        {showCount && insights.length > 0 && (
          <div className="w-6 h-6 bg-quantum-violet rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-ice-white">{insights.length}</span>
          </div>
        )}
        
        {allowFiltering && (
          <div className="ml-auto mr-2">
            <button 
              className="p-1.5 rounded-full hover:bg-[#1D2029] transition-colors"
              aria-label="Filter insights"
              title="Filter insights"
            >
              <MixerHorizontalIcon className="text-text-secondary w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Filter tabs - shown only when filtering is allowed */}
      {allowFiltering && (
        <div className="flex space-x-2 mb-3">
          <button
            className={`text-xs px-2 py-1 rounded-full ${filter === 'all' ? 'bg-quantum-violet text-ice-white' : 'text-text-secondary hover:bg-[#1D2029]'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {Object.entries(insightCounts).map(([type, count]) => (
            <button
              key={type}
              className={`text-xs px-2 py-1 rounded-full flex items-center ${filter === type ? 'bg-quantum-violet text-ice-white' : 'text-text-secondary hover:bg-[#1D2029]'}`}
              onClick={() => setFilter(type as InsightType)}
            >
              <InsightIcon type={type as InsightType} />
              <span className="ml-1">{count}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Insights list */}
      <div className="space-y-3">
        {displayedInsights.length > 0 ? (
          displayedInsights.map((insight, index) => (
            <InsightItem 
              key={insight.id} 
              insight={insight} 
              onClick={onInsightClick}
              animationDelay={animate ? index * 150 : 0}
            />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
      
      {/* Show "View more" button if there are more insights than maxItems */}
      {filteredInsights.length > maxItems && (
        <button
          className="w-full mt-3 py-2 flex items-center justify-center text-xs text-neon-azure hover:bg-[#1D2029] rounded-md transition-colors"
        >
          <PlusIcon className="mr-1" /> View {filteredInsights.length - maxItems} more insights
        </button>
      )}
    </div>
  );
};

export default AIInsights;

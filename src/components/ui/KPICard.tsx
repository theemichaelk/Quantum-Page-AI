import React from 'react';

interface KPICardProps {
  /**
   * The title or label for the KPI
   */
  title: string;
  
  /**
   * The main value to display (can be formatted as string)
   */
  value: string;
  
  /**
   * The change value (e.g., "+18.2%")
   */
  change?: string;
  
  /**
   * Whether the trend is up (positive) or down (negative)
   */
  trend?: 'up' | 'down' | 'neutral';
  
  /**
   * Array of numeric values to render as sparkline
   */
  sparklineData?: number[];
  
  /**
   * Optional CSS class name for additional styling
   */
  className?: string;
  
  /**
   * Optional click handler
   */
  onClick?: () => void;
  
  /**
   * Optional icon to display next to the title
   */
  icon?: React.ReactNode;
  
  /**
   * Whether to animate the sparkline on mount
   */
  animateSparkline?: boolean;
}

/**
 * KPICard component displays a key performance indicator with value, change, and sparkline
 */
const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  sparklineData = [],
  className = '',
  onClick,
  icon,
  animateSparkline = true,
}) => {
  // Determine color based on trend
  const trendColor = 
    trend === 'up' ? 'text-lime-pulse' : 
    trend === 'down' ? 'text-critical-red' : 
    'text-signal-amber';
  
  // Determine sparkline color based on trend
  const sparklineColor = 
    trend === 'up' ? '#28C8FF' : 
    trend === 'down' ? '#FF5470' : 
    '#FFB547';
  
  // Generate sparkline path if data is provided
  const sparklinePath = sparklineData.length > 0 
    ? sparklineData.map((d, i) => {
        const x = (i / (sparklineData.length - 1)) * 100;
        const y = 30 - ((d - Math.min(...sparklineData)) / 
          (Math.max(...sparklineData) - Math.min(...sparklineData) || 1)) * 30;
        return (i === 0 ? 'M' : 'L') + x + ',' + y;
      }).join(' ')
    : '';

  return (
    <div 
      className={`bg-onyx rounded-lg p-4 hover:shadow-glow-primary transition-all duration-300 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : 'region'}
      aria-label={`KPI: ${title} - ${value} ${change ? `(${change})` : ''}`}
    >
      <div className="flex items-center text-sm text-text-secondary mb-2">
        {icon && <span className="mr-2">{icon}</span>}
        <span>{title}</span>
      </div>
      
      <div className="flex items-baseline">
        <div className="text-2xl font-sora font-semibold text-ice-white">{value}</div>
        {change && (
          <div className={`ml-2 text-sm font-medium ${trendColor} flex items-center`}>
            {trend === 'up' && <span className="mr-0.5">↑</span>}
            {trend === 'down' && <span className="mr-0.5">↓</span>}
            {change}
          </div>
        )}
      </div>
      
      {/* Sparkline visualization */}
      {sparklineData.length > 0 && (
        <div className="h-10 mt-4">
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 100 30" 
            preserveAspectRatio="none"
            className={animateSparkline ? 'animate-draw-sparkline' : ''}
          >
            {/* Optional area under the sparkline */}
            <defs>
              <linearGradient id={`gradient-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sparklineColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={sparklineColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Area fill under the line */}
            <path
              d={`${sparklinePath} L100,30 L0,30 Z`}
              fill={`url(#gradient-${title.replace(/\s+/g, '-')})`}
              strokeWidth="0"
            />
            
            {/* The sparkline itself */}
            <path
              d={sparklinePath}
              fill="none"
              stroke={sparklineColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={animateSparkline ? 'animate-draw-sparkline' : ''}
              style={
                animateSparkline 
                  ? { 
                      strokeDasharray: 1000, 
                      strokeDashoffset: 1000, 
                      animation: 'draw-sparkline 1.5s ease-in-out forwards' 
                    } 
                  : {}
              }
            />
            
            {/* Optional dot at the end of the sparkline */}
            {sparklineData.length > 0 && (
              <circle
                cx="100"
                cy={30 - ((sparklineData[sparklineData.length - 1] - Math.min(...sparklineData)) / 
                  (Math.max(...sparklineData) - Math.min(...sparklineData) || 1)) * 30}
                r="2"
                fill={sparklineColor}
              />
            )}
          </svg>
        </div>
      )}
    </div>
  );
};

export default KPICard;

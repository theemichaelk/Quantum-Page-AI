import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  TooltipProps
} from 'recharts';

// Define the data structure for traffic data points
export interface TrafficDataPoint {
  name: string;
  total: number;
  organic: number;
  [key: string]: string | number; // Allow for additional metrics
}

interface TrafficChartProps {
  /**
   * Array of traffic data points to visualize
   */
  data: TrafficDataPoint[];
  
  /**
   * Height of the chart in pixels
   * @default 300
   */
  height?: number;
  
  /**
   * Whether to show the legend
   * @default true
   */
  showLegend?: boolean;
  
  /**
   * Whether to show the grid lines
   * @default true
   */
  showGrid?: boolean;
  
  /**
   * Primary color for total traffic
   * @default '#28C8FF' (neon-azure)
   */
  totalColor?: string;
  
  /**
   * Primary color for organic traffic
   * @default '#7B6CFF' (quantum-violet)
   */
  organicColor?: string;
  
  /**
   * Additional metrics to display beyond total and organic
   * Format: [{ key: 'metricName', color: '#hexcolor', label: 'Display Label' }]
   */
  additionalMetrics?: Array<{
    key: string;
    color: string;
    label: string;
  }>;
  
  /**
   * Title to display above the chart
   * @default 'Traffic Overview'
   */
  title?: string;
  
  /**
   * CSS class name for additional styling
   */
  className?: string;
  
  /**
   * Whether to animate the chart on mount
   * @default true
   */
  animate?: boolean;
}

/**
 * Custom tooltip component for the traffic chart
 */
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1D2029] border border-[#3D4354] rounded-lg p-3 shadow-lg">
        <p className="text-ice-white font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between text-sm mb-1">
            <div className="flex items-center">
              <div 
                className="w-2 h-2 rounded-full mr-2" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-text-secondary">{entry.name}:</span>
            </div>
            <span className="text-ice-white font-medium ml-4">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * TrafficChart component for visualizing website traffic data
 */
const TrafficChart: React.FC<TrafficChartProps> = ({
  data,
  height = 300,
  showLegend = true,
  showGrid = true,
  totalColor = '#28C8FF',
  organicColor = '#7B6CFF',
  additionalMetrics = [],
  title = 'Traffic Overview',
  className = '',
  animate = true,
}) => {
  // Generate unique IDs for gradient definitions
  const totalGradientId = `totalGradient-${Math.random().toString(36).substr(2, 9)}`;
  const organicGradientId = `organicGradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`bg-onyx rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-sora font-semibold text-ice-white">{title}</h3>
        
        {showLegend && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: totalColor }}></div>
              <span className="text-xs text-text-secondary">Total Traffic</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: organicColor }}></div>
              <span className="text-xs text-text-secondary">Organic Traffic</span>
            </div>
            
            {/* Render additional metrics in legend if provided */}
            {additionalMetrics.map((metric, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: metric.color }}
                ></div>
                <span className="text-xs text-text-secondary">{metric.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={data} 
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={totalGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={totalColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={totalColor} stopOpacity={0} />
              </linearGradient>
              <linearGradient id={organicGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={organicColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={organicColor} stopOpacity={0} />
              </linearGradient>
              
              {/* Create gradients for additional metrics */}
              {additionalMetrics.map((metric, index) => (
                <linearGradient 
                  key={index} 
                  id={`gradient-${metric.key}`} 
                  x1="0" y1="0" x2="0" y2="1"
                >
                  <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#A0A8B8', fontSize: 12 }} 
              axisLine={{ stroke: '#3D4354' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#A0A8B8', fontSize: 12 }} 
              axisLine={{ stroke: '#3D4354' }}
              tickLine={false}
              width={40}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
            />
            
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#3D4354" 
                vertical={false} 
              />
            )}
            
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: '#A0A8B8', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            
            {/* Render areas in reverse order so the total is on top */}
            {additionalMetrics.map((metric, index) => (
              <Area 
                key={index}
                type="monotone" 
                dataKey={metric.key}
                name={metric.label}
                stroke={metric.color} 
                fillOpacity={1}
                fill={`url(#gradient-${metric.key})`}
                strokeWidth={2}
                activeDot={{ r: 6, stroke: '#0F1115', strokeWidth: 2 }}
                isAnimationActive={animate}
              />
            ))}
            
            <Area 
              type="monotone" 
              dataKey="organic"
              name="Organic Traffic"
              stroke={organicColor} 
              fillOpacity={1}
              fill={`url(#${organicGradientId})`}
              strokeWidth={2}
              activeDot={{ r: 6, stroke: '#0F1115', strokeWidth: 2 }}
              isAnimationActive={animate}
            />
            
            <Area 
              type="monotone" 
              dataKey="total"
              name="Total Traffic"
              stroke={totalColor} 
              fillOpacity={1}
              fill={`url(#${totalGradientId})`}
              strokeWidth={2}
              activeDot={{ r: 6, stroke: '#0F1115', strokeWidth: 2 }}
              isAnimationActive={animate}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrafficChart;

import React from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/DashboardLayout';
import KPICard from '@/components/ui/KPICard';
import TrafficChart from '@/components/ui/TrafficChart';
import AIInsights, { Insight } from '@/components/ui/AIInsights';
import {
  BarChartIcon,
  PersonIcon,
  CubeIcon,
  MixerHorizontalIcon,
  TargetIcon,
  CheckCircledIcon,
  ExclamationTriangleIcon,
  CrossCircledIcon,
  LightningBoltIcon
} from '@radix-ui/react-icons';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// Mock data for KPI cards
const kpiData = [
  { 
    title: 'Total Visitors', 
    value: '24,892', 
    change: '+18.2%', 
    trend: 'up',
    sparklineData: [120, 140, 135, 155, 160, 175, 190],
    icon: <PersonIcon />
  },
  { 
    title: 'Conversion Rate', 
    value: '3.7%', 
    change: '+0.5%', 
    trend: 'up',
    sparklineData: [2.8, 3.0, 3.1, 3.2, 3.5, 3.7, 3.7],
    icon: <TargetIcon />
  },
  { 
    title: 'Revenue', 
    value: '$12,487', 
    change: '+22.4%', 
    trend: 'up',
    sparklineData: [8200, 8700, 9300, 10100, 11200, 12000, 12487],
    icon: <BarChartIcon />
  },
  { 
    title: 'Avg. Position', 
    value: '4.2', 
    change: '-0.3', 
    trend: 'down',
    sparklineData: [4.8, 4.7, 4.5, 4.4, 4.3, 4.2, 4.2],
    icon: <MixerHorizontalIcon />
  }
];

// Mock data for traffic chart
const trafficData = [
  { name: 'May 28', total: 1200, organic: 800, social: 250, direct: 150 },
  { name: 'Jun 4', total: 1350, organic: 950, social: 280, direct: 120 },
  { name: 'Jun 11', total: 1100, organic: 700, social: 300, direct: 100 },
  { name: 'Jun 18', total: 1500, organic: 1000, social: 350, direct: 150 },
  { name: 'Jun 25', total: 1700, organic: 1200, social: 380, direct: 120 },
  { name: 'Jun 27', total: 1600, organic: 1100, social: 400, direct: 100 },
];

// Mock data for AI insights
const insightsData: Insight[] = [
  {
    id: '1',
    type: 'success',
    title: 'Traffic Surge Detected',
    description: '18% increase from social media channels in the last 24 hours',
    action: 'View details',
    timestamp: new Date(),
    priority: 2
  },
  {
    id: '2',
    type: 'error',
    title: 'Core Web Vitals Alert',
    description: 'LCP issue on product pages affecting mobile users',
    action: 'Fix now',
    timestamp: new Date(),
    priority: 3
  },
  {
    id: '3',
    type: 'warning',
    title: 'SEO Opportunity',
    description: 'Add schema markup to 3 key pages to improve rich snippets',
    action: 'Apply changes',
    timestamp: new Date(),
    priority: 1
  },
  {
    id: '4',
    type: 'info',
    title: 'New Keyword Ranking',
    description: 'Now ranking #5 for "quantum AI website builder"',
    action: 'Optimize further',
    timestamp: new Date(),
    priority: 1
  }
];

// Mock data for funnel
const funnelData = [
  { name: 'Visitors', value: 24892 },
  { name: 'Product View', value: 8745 },
  { name: 'Add to Cart', value: 2341 },
  { name: 'Checkout', value: 921 },
];

// Mock data for web vitals
const webVitalsData = [
  { name: 'LCP', value: 85, color: '#C6FF4F', metric: '1.8s' }, // Good
  { name: 'CLS', value: 75, color: '#FFB547', metric: '0.09' }, // Needs improvement
  { name: 'FID', value: 92, color: '#C6FF4F', metric: '18ms' }, // Good
];

// Mock data for growth playbook
const playbookTasks = [
  { id: '1', title: 'Optimize product image sizes', completed: false },
  { id: '2', title: 'Add FAQ schema to 3 pages', completed: false },
  { id: '3', title: 'Schedule social posts for launch', completed: false },
  { id: '4', title: 'Fix mobile navigation menu', completed: true },
];

// Conversion Funnel Component
const ConversionFunnel = () => {
  const colors = ['#28C8FF', '#28C8FFbb', '#28C8FF88', '#28C8FF55'];
  
  return (
    <div className="bg-onyx rounded-lg p-4">
      <h3 className="text-lg font-sora font-semibold text-ice-white mb-4">Conversion Funnel</h3>
      
      <div className="flex items-end space-x-2 h-32">
        {funnelData.map((item, index) => {
          // Calculate width based on position
          const width = 100 - (index * 15);
          // Calculate height based on value relative to max
          const height = (item.value / funnelData[0].value) * 100;
          
          return (
            <div key={index} className="flex flex-col items-center" style={{ width: `${width}px` }}>
              <div 
                className="w-full rounded-t-md transition-all duration-300 hover:opacity-90"
                style={{ 
                  height: `${height}%`, 
                  backgroundColor: colors[index],
                }}
              ></div>
              <div className="text-xs text-text-secondary mt-1 truncate text-center w-full">
                {item.name}
              </div>
              <div className="text-xs font-medium text-ice-white mt-0.5 text-center">
                {item.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Core Web Vitals Component
const CoreWebVitals = () => {
  return (
    <div className="bg-onyx rounded-lg p-4">
      <h3 className="text-lg font-sora font-semibold text-ice-white mb-4">Core Web Vitals</h3>
      
      <div className="flex justify-around">
        {webVitalsData.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-16 h-16 transform -rotate-90">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3D4354"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="3"
                  strokeDasharray={`${item.value}, 100`}
                />
              </svg>
              <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                <div className="text-xs text-text-secondary">{item.name}</div>
                <div className="text-sm font-medium text-ice-white">{item.metric}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Growth Playbook Component
const GrowthPlaybook = () => {
  return (
    <div className="bg-onyx rounded-lg p-4">
      <h3 className="text-lg font-sora font-semibold text-ice-white mb-4">Growth Playbook</h3>
      
      <div className="space-y-2">
        {playbookTasks.map((task) => (
          <div key={task.id} className="bg-[#1D2029] rounded-md p-2 flex items-center">
            <div className={`w-5 h-5 ${task.completed ? 'bg-lime-pulse bg-opacity-20' : 'border border-neon-azure'} rounded-full mr-2 flex items-center justify-center`}>
              {task.completed && <CheckCircledIcon className="text-lime-pulse w-4 h-4" />}
            </div>
            <div className="text-sm text-ice-white">{task.title}</div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 py-2 bg-[#1D2029] hover:bg-[#252A37] rounded-md text-neon-azure text-sm transition-colors">
        View All Tasks
      </button>
    </div>
  );
};

// Additional metrics component
const AdditionalMetrics = () => {
  // Mock data for additional metrics
  const pageViewsData = [
    { name: 'Mon', views: 1200 },
    { name: 'Tue', views: 1400 },
    { name: 'Wed', views: 1100 },
    { name: 'Thu', views: 1300 },
    { name: 'Fri', views: 1500 },
    { name: 'Sat', views: 900 },
    { name: 'Sun', views: 800 },
  ];

  return (
    <div className="bg-onyx rounded-lg p-4">
      <h3 className="text-lg font-sora font-semibold text-ice-white mb-4">Page Views (Last 7 Days)</h3>
      
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pageViewsData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3D4354" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#A0A8B8', fontSize: 10 }}
              axisLine={{ stroke: '#3D4354' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#A0A8B8', fontSize: 10 }}
              axisLine={{ stroke: '#3D4354' }}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1D2029', 
                borderColor: '#3D4354',
                borderRadius: '8px',
                color: '#E9F1FF'
              }}
            />
            <Bar dataKey="views" fill="#7B6CFF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Main Dashboard Page
const Dashboard = () => {
  return (
    <>
      <Head>
        <title>Dashboard | Quantum-Page AI</title>
        <meta name="description" content="Quantum-Page AI Dashboard - Monitor your website performance and AI-driven insights" />
      </Head>
      
      <DashboardLayout title="Dashboard" currentPath="/dashboard">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpiData.map((kpi, index) => (
            <KPICard 
              key={index}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              trend={kpi.trend as 'up' | 'down' | 'neutral'}
              sparklineData={kpi.sparklineData}
              icon={kpi.icon}
            />
          ))}
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Traffic Chart - Takes 3/4 width */}
          <div className="lg:col-span-3">
            <TrafficChart 
              data={trafficData}
              height={300}
              additionalMetrics={[
                { key: 'social', color: '#FFB547', label: 'Social Traffic' },
                { key: 'direct', color: '#C6FF4F', label: 'Direct Traffic' }
              ]}
            />
          </div>
          
          {/* AI Insights - Takes 1/4 width */}
          <div className="lg:col-span-1">
            <AIInsights 
              insights={insightsData}
              maxItems={3}
              allowFiltering={true}
              onInsightClick={(insight) => console.log('Clicked insight:', insight)}
            />
          </div>
          
          {/* Bottom Row */}
          <div className="lg:col-span-2">
            <ConversionFunnel />
          </div>
          
          <div className="lg:col-span-1">
            <CoreWebVitals />
          </div>
          
          <div className="lg:col-span-1">
            <GrowthPlaybook />
          </div>
          
          {/* Additional Metrics */}
          <div className="lg:col-span-2">
            <AdditionalMetrics />
          </div>
          
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-onyx rounded-lg p-4">
              <h3 className="text-lg font-sora font-semibold text-ice-white mb-4">Quick Actions</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-[#1D2029] hover:bg-[#252A37] p-3 rounded-lg flex items-center transition-colors">
                  <div className="w-8 h-8 bg-neon-azure bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                    <LightningBoltIcon className="text-neon-azure w-4 h-4" />
                  </div>
                  <span className="text-sm text-ice-white">Generate New Content</span>
                </button>
                
                <button className="bg-[#1D2029] hover:bg-[#252A37] p-3 rounded-lg flex items-center transition-colors">
                  <div className="w-8 h-8 bg-quantum-violet bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                    <CubeIcon className="text-quantum-violet w-4 h-4" />
                  </div>
                  <span className="text-sm text-ice-white">Create New Site</span>
                </button>
                
                <button className="bg-[#1D2029] hover:bg-[#252A37] p-3 rounded-lg flex items-center transition-colors">
                  <div className="w-8 h-8 bg-lime-pulse bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                    <TargetIcon className="text-lime-pulse w-4 h-4" />
                  </div>
                  <span className="text-sm text-ice-white">Run SEO Audit</span>
                </button>
                
                <button className="bg-[#1D2029] hover:bg-[#252A37] p-3 rounded-lg flex items-center transition-colors">
                  <div className="w-8 h-8 bg-signal-amber bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                    <BarChartIcon className="text-signal-amber w-4 h-4" />
                  </div>
                  <span className="text-sm text-ice-white">Export Reports</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Dashboard;

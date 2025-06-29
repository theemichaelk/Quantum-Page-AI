import React, { ReactNode } from 'react';
import { 
  DashboardIcon, 
  MagnifyingGlassIcon, 
  FileTextIcon, 
  ShoppingCartIcon, 
  BarChartIcon, 
  RocketIcon, 
  GearIcon, 
  BellIcon, 
  PersonIcon
} from '@radix-ui/react-icons';
import Link from 'next/link';
import Image from 'next/image';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  currentPath?: string;
}

// Navigation Item Component
const NavItem = ({ 
  icon, 
  active = false, 
  onClick 
}: { 
  icon: React.ReactNode; 
  active?: boolean; 
  onClick?: () => void;
}) => {
  return (
    <div 
      className={`p-3 rounded-full cursor-pointer transition-all ${
        active ? 'bg-neon-azure bg-opacity-20' : 'hover:bg-onyx hover:bg-opacity-50'
      }`}
      onClick={onClick}
    >
      <div className={`w-6 h-6 ${active ? 'text-neon-azure' : 'text-text-secondary'}`}>
        {icon}
      </div>
    </div>
  );
};

// Sidebar Navigation Component
const Sidebar = ({ currentPath = '/dashboard' }: { currentPath?: string }) => {
  const navItems = [
    { path: '/dashboard', icon: <DashboardIcon /> },
    { path: '/search', icon: <MagnifyingGlassIcon /> },
    { path: '/content', icon: <FileTextIcon /> },
    { path: '/ecommerce', icon: <ShoppingCartIcon /> },
    { path: '/analytics', icon: <BarChartIcon /> },
    { path: '/ai-lab', icon: <RocketIcon /> },
    // NEW: Site-Builder nav item (appears after AI-Lab)
    { path: '/site-builder', icon: <RocketIcon /> },
    { path: '/settings', icon: <GearIcon /> },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-20 bg-onyx flex flex-col items-center pt-16 pb-4 z-10">
      <div className="flex flex-col space-y-6">
        {navItems.map((item, index) => (
          <Link href={item.path} key={index} aria-label={`Go to ${item.path}`}>
            {/* grouping for hover styles if needed */}
            <NavItem 
              icon={item.icon} 
              active={currentPath === item.path} 
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

// Top Navigation Bar Component
const TopBar = ({ title = 'Dashboard' }: { title?: string }) => {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-onyx z-20 flex items-center justify-between px-6 border-b border-[#3D4354] border-opacity-30">
      <div className="flex items-center">
        <div className="flex items-center group mr-8">
          <Image
            src="/logo.svg"
            alt="Quantum-Page AI Logo"
            width={32}
            height={32}
            priority
          />
          {/* Visible on hover or ≥sm breakpoint */}
          <span className="ml-2 text-2xl font-sora font-semibold text-ice-white hidden sm:inline group-hover:inline">
            Quantum-Page AI
          </span>
        </div>
        <div className="bg-[#1D2029] rounded-full px-4 py-1.5 flex items-center space-x-2 cursor-pointer">
          <span className="text-sm text-ice-white">myecomstore.com</span>
          <span className="text-neon-azure text-xs">▼</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="bg-[#1D2029] rounded-full px-4 py-1.5 flex items-center space-x-2 cursor-pointer">
          <MagnifyingGlassIcon className="text-text-secondary" />
          <span className="text-sm text-text-secondary">Search... (Cmd+K)</span>
        </div>
        
        <div className="relative">
          <div className="w-8 h-8 bg-[#1D2029] rounded-full flex items-center justify-center cursor-pointer">
            <BellIcon className="text-text-secondary" />
          </div>
          <div className="absolute top-0 right-0 w-2 h-2 bg-critical-red rounded-full"></div>
        </div>
        
        <div className="w-8 h-8 bg-quantum-violet rounded-full flex items-center justify-center cursor-pointer">
          <span className="text-xs font-medium text-ice-white">MK</span>
        </div>
      </div>
    </div>
  );
};

// Breadcrumb Component
const Breadcrumb = ({ title }: { title: string }) => {
  return (
    <div className="mb-6">
      <div className="text-sm text-text-secondary mb-1">Overview › {title}</div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-sora font-semibold text-ice-white">{title}</h2>
        <div className="text-sm text-quantum-violet">Last 30 Days</div>
      </div>
    </div>
  );
};

// Main Dashboard Layout Component
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  title = 'Dashboard',
  currentPath = '/dashboard'
}) => {
  return (
    <div className="min-h-screen bg-carbon">
      <TopBar title={title} />
      <Sidebar currentPath={currentPath} />
      
      <main className="pt-24 pb-8 pl-28 pr-8">
        <Breadcrumb title={title} />
        
        {/* Main Content */}
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

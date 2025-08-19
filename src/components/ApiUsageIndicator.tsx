import { Activity, AlertTriangle } from 'lucide-react';

interface ApiUsageIndicatorProps {
  usageStats: {
    dailyCount: number;
    sessionCount: number;
    dailyLimit: number;
    warningThreshold: number;
    confirmationThreshold: number;
  };
  usageLevel: 'normal' | 'warning' | 'high' | 'critical';
  currentTheme: any;
  onClick?: () => void;
}

const ApiUsageIndicator: React.FC<ApiUsageIndicatorProps> = ({
  usageStats,
  usageLevel,
  currentTheme,
  onClick
}) => {
  const getIndicatorColor = () => {
    switch (usageLevel) {
      case 'critical':
        return '#ef4444'; // red
      case 'high':
        return '#f59e0b'; // amber
      case 'warning':
        return '#eab308'; // yellow
      default:
        return currentTheme.secondary; // theme color
    }
  };

  const getIndicatorIcon = () => {
    if (usageLevel === 'critical' || usageLevel === 'high') {
      return <AlertTriangle size={14} />;
    }
    return <Activity size={14} />;
  };

  const getUsageText = () => {
    const sessionPercentage = Math.round((usageStats.sessionCount / 100) * 100);
    const dailyPercentage = Math.round((usageStats.dailyCount / usageStats.dailyLimit) * 100);
    
    return `${usageStats.sessionCount} calls (${sessionPercentage}%)`;
  };

  const shouldShow = usageStats.sessionCount > 0;

  if (!shouldShow) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1 rounded-full text-xs transition-all hover:bg-white hover:bg-opacity-10 border border-white border-opacity-20"
      style={{ 
        backgroundColor: getIndicatorColor() + '20',
        borderColor: getIndicatorColor() + '40'
      }}
      title="Click to view API usage details"
    >
      <div style={{ color: getIndicatorColor() }}>
        {getIndicatorIcon()}
      </div>
      <span 
        className="text-white"
        style={{ color: getIndicatorColor() }}
      >
        {getUsageText()}
      </span>
      
      {usageLevel === 'critical' && (
        <div className="w-2 h-2 rounded-full animate-pulse bg-red-400" />
      )}
    </button>
  );
};

export default ApiUsageIndicator;
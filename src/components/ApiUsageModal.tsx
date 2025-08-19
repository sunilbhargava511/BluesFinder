import { useState } from 'react';
import { AlertTriangle, Activity, RefreshCw, X } from 'lucide-react';

interface ApiUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  type: 'confirmation' | 'warning' | 'error';
  title: string;
  message: string;
  usageStats: {
    dailyCount: number;
    sessionCount: number;
    dailyLimit: number;
    warningThreshold: number;
    confirmationThreshold: number;
  };
  currentTheme: any;
}

const ApiUsageModal: React.FC<ApiUsageModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  type,
  title,
  message,
  usageStats,
  currentTheme
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'confirmation':
        return <Activity size={24} style={{ color: currentTheme.secondary }} />;
      case 'warning':
        return <AlertTriangle size={24} className="text-yellow-400" />;
      case 'error':
        return <AlertTriangle size={24} className="text-red-400" />;
    }
  };

  const getProgressColor = (count: number, threshold: number) => {
    const percentage = (count / threshold) * 100;
    if (percentage >= 90) return '#ef4444'; // red
    if (percentage >= 70) return '#f59e0b'; // amber
    if (percentage >= 50) return currentTheme.secondary; // theme color
    return '#10b981'; // green
  };

  const sessionPercentage = Math.min((usageStats.sessionCount / 100) * 100, 100);
  const dailyPercentage = (usageStats.dailyCount / usageStats.dailyLimit) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-black bg-opacity-90 rounded-xl p-6 max-w-md w-full border border-white border-opacity-20 backdrop-blur"
        style={{ borderColor: currentTheme.secondary + '30' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white opacity-60 hover:opacity-100 transition-opacity"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message */}
        <p className="text-white text-sm mb-4 leading-relaxed">
          {message}
        </p>

        {/* Usage Stats Summary */}
        <div className="mb-4 space-y-3">
          <div>
            <div className="flex justify-between text-sm text-white mb-1">
              <span>Session Usage</span>
              <span>{usageStats.sessionCount}/100 calls</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${sessionPercentage}%`,
                  backgroundColor: getProgressColor(usageStats.sessionCount, 100)
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm text-white mb-1">
              <span>Daily Usage</span>
              <span>{usageStats.dailyCount}/{usageStats.dailyLimit} calls</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(dailyPercentage, 100)}%`,
                  backgroundColor: getProgressColor(usageStats.dailyCount, usageStats.dailyLimit)
                }}
              />
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs opacity-75 hover:opacity-100 transition-opacity mb-4 flex items-center gap-1"
          style={{ color: currentTheme.secondary }}
        >
          {showDetails ? 'Hide' : 'Show'} details
          <RefreshCw size={12} className={showDetails ? 'rotate-180' : ''} />
        </button>

        {showDetails && (
          <div className="mb-4 p-3 bg-white bg-opacity-5 rounded text-xs space-y-2">
            <div className="flex justify-between">
              <span className="opacity-75">Warning Threshold:</span>
              <span>{usageStats.warningThreshold} calls</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-75">Confirmation Required:</span>
              <span>{usageStats.confirmationThreshold} calls</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-75">Session Soft Limit:</span>
              <span>75 calls</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-75">Session Hard Limit:</span>
              <span>100 calls</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white border-opacity-10">
              <p className="opacity-75">
                These limits help preserve your daily API quota and prevent accidental overuse.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {type === 'confirmation' && (
            <>
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 rounded border border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2 rounded font-semibold transition-all hover:scale-105"
                style={{ backgroundColor: currentTheme.secondary, color: currentTheme.accent }}
              >
                Continue
              </button>
            </>
          )}
          
          {(type === 'warning' || type === 'error') && (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 rounded font-semibold transition-all hover:scale-105"
              style={{ backgroundColor: currentTheme.secondary, color: currentTheme.accent }}
            >
              OK
            </button>
          )}
        </div>

        {/* Tips */}
        {type === 'confirmation' && (
          <div className="mt-4 p-3 bg-blue-500 bg-opacity-20 rounded text-xs">
            <p className="text-blue-200">
              💡 <strong>Tip:</strong> Use broader date ranges or larger search radius to find more events with fewer API calls.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiUsageModal;
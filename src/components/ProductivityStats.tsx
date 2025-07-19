import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

// Types
interface TaskData {
  completed: number;
  total: number;
  timeSpent: string;
  streak: number;
}

interface WeeklyActivityData {
  day: string;
  percentage: number;
  isToday?: boolean;
}

interface ProductivityStatsProps {
  taskData?: TaskData;
  weeklyActivity?: WeeklyActivityData[];
  taskStatistics?: number;
  consistencyStreak?: number[];
}

// Steve Jobs Character Component
const SteveCharacter: React.FC = () => {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative">
        {/* Steve Jobs Character */}
        <div className="w-16 h-16 bg-gray-100 rounded-full border-2 border-black flex items-center justify-center">
          {/* Head */}
          <div className="w-12 h-12 bg-gray-200 rounded-full relative">
            {/* Face outline */}
            <div className="absolute inset-1 bg-white rounded-full border border-gray-400">
              {/* Eyes */}
              <div className="absolute top-3 left-2 w-1 h-1 bg-black rounded-full"></div>
              <div className="absolute top-3 right-2 w-1 h-1 bg-black rounded-full"></div>
              {/* Glasses */}
              <div className="absolute top-2.5 left-1 w-2 h-2 border border-black rounded-full"></div>
              <div className="absolute top-2.5 right-1 w-2 h-2 border border-black rounded-full"></div>
              <div className="absolute top-3 left-3 right-3 h-0.5 border-t border-black"></div>
              {/* Mouth */}
              <div className="absolute bottom-2 left-3 right-3 h-0.5 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>
        
        {/* Thumbs up */}
        <div className="absolute -right-2 -bottom-1 w-6 h-6 bg-gray-200 rounded-lg border border-gray-400 flex items-center justify-center">
          <div className="text-xs">👍</div>
        </div>
      </div>
      
      <div>
        <h1 className="text-xl font-bold text-gray-900 leading-tight">
          Tu esfuerzo es<br />
          tu mejor inversión
        </h1>
      </div>
    </div>
  );
};

// Animated Progress Bar Component
const AnimatedProgressBar: React.FC<{ completed: number; total: number }> = ({ completed, total }) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(percentage);
    }, 300);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold text-gray-900">{completed}-{total}</span>
        <span className="text-gray-600">Tasks Completads</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gray-900 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${animatedWidth}%` }}
        />
      </div>
    </div>
  );
};

// Weekly Activity Curve Component
const WeeklyActivityCurve: React.FC<{ data: WeeklyActivityData[] }> = ({ data }) => {
  const [animatedPath, setAnimatedPath] = useState('');
  const [showDot, setShowDot] = useState(false);
  
  const days = ['Mon', 'Feb', 'Apr', 'May', 'June', 'Jul', 'Sep', 'Sun'];
  const percentages = [10, 15, 30, 45, 42, 35, 48, 55];
  
  useEffect(() => {
    // Generate SVG path for the curve
    const width = 280;
    const height = 80;
    const points = percentages.map((percentage, index) => {
      const x = (index / (percentages.length - 1)) * width;
      const y = height - (percentage / 60) * height;
      return { x, y };
    });
    
    // Create smooth curve path
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      const cpx1 = prevPoint.x + (currentPoint.x - prevPoint.x) / 3;
      const cpy1 = prevPoint.y;
      const cpx2 = currentPoint.x - (currentPoint.x - prevPoint.x) / 3;
      const cpy2 = currentPoint.y;
      path += ` C ${cpx1} ${cpy1} ${cpx2} ${cpy2} ${currentPoint.x} ${currentPoint.y}`;
    }
    
    // Animate path drawing
    setTimeout(() => {
      setAnimatedPath(path);
      setTimeout(() => setShowDot(true), 800);
    }, 200);
  }, []);

  return (
    <Card className="p-4 bg-white border border-gray-200 mb-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity</h3>
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-20 flex flex-col justify-between text-xs text-gray-500">
          <span>60%</span>
          <span>40%</span>
          <span>20%</span>
          <span>10%</span>
        </div>
        
        {/* Chart area */}
        <div className="ml-8">
          <svg width="280" height="80" className="overflow-visible">
            {/* Grid lines */}
            {[20, 40, 60].map((percentage) => (
              <line
                key={percentage}
                x1="0"
                y1={80 - (percentage / 60) * 80}
                x2="280"
                y2={80 - (percentage / 60) * 80}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}
            
            {/* Animated curve */}
            <path
              d={animatedPath}
              fill="none"
              stroke="#374151"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-draw-path"
              style={{
                strokeDasharray: animatedPath ? '500' : '0',
                strokeDashoffset: animatedPath ? '0' : '500',
                transition: 'stroke-dashoffset 1.5s ease-out'
              }}
            />
            
            {/* Today's dot with pulse animation */}
            {showDot && (
              <g>
                <circle
                  cx={280 * (4 / 7)} // June position
                  cy={80 - (42 / 60) * 80}
                  r="4"
                  fill="#374151"
                  className="animate-pulse"
                />
                <circle
                  cx={280 * (4 / 7)}
                  cy={80 - (42 / 60) * 80}
                  r="8"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="1"
                  opacity="0.3"
                  className="animate-ping"
                />
              </g>
            )}
          </svg>
          
          {/* X-axis labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {days.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Circular Progress Component
const CircularProgress: React.FC<{ percentage: number; title: string }> = ({ percentage, title }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 500);
    return () => clearTimeout(timer);
  }, [percentage]);
  
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;
  
  return (
    <Card className="p-4 bg-white border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="flex items-center justify-center">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#374151"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">
              {Math.round(animatedPercentage)}%
            </span>
          </div>
        </div>
      </div>
      {/* Progress bar at bottom */}
      <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gray-400 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${animatedPercentage}%` }}
        />
      </div>
    </Card>
  );
};

// Consistency Streak Component
const ConsistencyStreak: React.FC<{ data: number[] }> = ({ data }) => {
  const [animatedHeights, setAnimatedHeights] = useState<number[]>([]);
  const days = ['Mon', 'Tue', 'We', 'Th', 'Fri', 'Sat', 'Sun'];
  const maxHeight = Math.max(...data);
  
  useEffect(() => {
    // Animate bars one by one
    data.forEach((_, index) => {
      setTimeout(() => {
        setAnimatedHeights(prev => {
          const newHeights = [...prev];
          newHeights[index] = data[index];
          return newHeights;
        });
      }, index * 100);
    });
  }, [data]);
  
  return (
    <Card className="p-4 bg-white border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Consistency Streak</h3>
      <div className="flex items-end justify-between h-20 gap-1">
        {data.map((value, index) => {
          const heightPercentage = maxHeight > 0 ? ((animatedHeights[index] || 0) / maxHeight) * 100 : 0;
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-gray-900 rounded-t transition-all duration-500 ease-out min-h-1"
                style={{ 
                  height: `${heightPercentage}%`,
                  transitionDelay: `${index * 100}ms`
                }}
              />
              <span className="text-xs text-gray-500 mt-1">{days[index]}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// Main Stats Component
const ProductivityStats: React.FC<ProductivityStatsProps> = ({
  taskData = { completed: 12, total: 20, timeSpent: '4h 30m', streak: 3 },
  weeklyActivity = [],
  taskStatistics = 59,
  consistencyStreak = [20, 40, 30, 50, 60, 80, 90]
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={`max-w-sm mx-auto p-4 bg-gray-50 min-h-screen transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header with Steve character */}
      <SteveCharacter />
      
      {/* Main stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Tasks completed */}
        <Card className="p-3 bg-white border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{taskData.completed}-{taskData.total}</div>
          <div className="text-xs text-gray-600">Tasks Completads</div>
          <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gray-900 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${(taskData.completed / taskData.total) * 100}%` }}
            />
          </div>
        </Card>
        
        {/* Streak */}
        <Card className="p-3 bg-white border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{taskData.streak}-Day</div>
          <div className="text-xs text-gray-600">Streak ⭐</div>
        </Card>
        
        {/* Time spent */}
        <Card className="p-3 bg-white border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{taskData.timeSpent}</div>
          <div className="text-xs text-gray-600">Time Spent</div>
        </Card>
      </div>
      
      {/* Weekly Activity Chart */}
      <WeeklyActivityCurve data={weeklyActivity} />
      
      {/* Bottom row with two charts */}
      <div className="grid grid-cols-2 gap-3">
        <CircularProgress percentage={taskStatistics} title="Task Statistics" />
        <ConsistencyStreak data={consistencyStreak} />
      </div>
    </div>
  );
};

export default ProductivityStats;
import React from 'react';
import ProductivityStats from './ProductivityStats';

const ProductivityStatsDemo: React.FC = () => {
  // Sample data matching the mockup
  const sampleTaskData = {
    completed: 12,
    total: 20,
    timeSpent: '4h 30m',
    streak: 3
  };

  const sampleWeeklyActivity = [
    { day: 'Mon', percentage: 10 },
    { day: 'Feb', percentage: 15 },
    { day: 'Apr', percentage: 30 },
    { day: 'May', percentage: 45 },
    { day: 'June', percentage: 42, isToday: true },
    { day: 'Jul', percentage: 35 },
    { day: 'Sep', percentage: 48 },
    { day: 'Sun', percentage: 55 }
  ];

  const sampleConsistencyStreak = [20, 40, 30, 50, 60, 80, 90];

  return (
    <div className="bg-gray-50 min-h-screen">
      <ProductivityStats
        taskData={sampleTaskData}
        weeklyActivity={sampleWeeklyActivity}
        taskStatistics={59}
        consistencyStreak={sampleConsistencyStreak}
      />
    </div>
  );
};

export default ProductivityStatsDemo;
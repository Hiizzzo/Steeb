import React from 'react';
import './ProductivityStats.css';

// Stebe Character Component
const StebeCharacter = () => (
  <svg className="stebe-character" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="none" stroke="#000" strokeWidth="3"/>
    <circle cx="85" cy="70" r="8" fill="none" stroke="#000" strokeWidth="2"/>
    <circle cx="115" cy="70" r="8" fill="none" stroke="#000" strokeWidth="2"/>
    <circle cx="85" cy="70" r="3" fill="#000"/>
    <circle cx="115" cy="70" r="3" fill="#000"/>
    <path d="M85 90 Q100 100 115 90" fill="none" stroke="#000" strokeWidth="2"/>
    <rect x="70" y="50" width="60" height="15" fill="none" stroke="#000" strokeWidth="2" rx="7"/>
    <ellipse cx="100" cy="130" rx="25" ry="40" fill="none" stroke="#000" strokeWidth="3"/>
    <rect x="75" cy="170" width="50" height="15" fill="none" stroke="#000" strokeWidth="3" rx="7"/>
    <path d="M125 120 Q140 130 135 145" fill="none" stroke="#000" strokeWidth="3"/>
    <circle cx="135" cy="145" r="5" fill="#000"/>
  </svg>
);

// KPI Card Component
const KPICard = ({ title, value, hasProgress = false, hasIcon = false, delay }) => (
  <div className="kpi-card" style={{ animationDelay: `${delay}s` }}>
    <div className="kpi-title">{title}</div>
    <div className="kpi-value">
      {value}
      {hasIcon && (
        <svg className="streak-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      )}
    </div>
    {hasProgress && (
      <div className="progress-bar">
        <div className="progress-fill"></div>
      </div>
    )}
  </div>
);

// Weekly Activity Chart Component
const WeeklyActivityChart = () => (
  <div className="chart-container">
    <div className="chart-title">Weekly Activity</div>
    <svg className="chart-svg" viewBox="0 0 350 150">
      {/* Grid lines */}
      <line className="chart-grid" x1="30" y1="30" x2="30" y2="120"/>
      <line className="chart-grid" x1="30" y1="120" x2="320" y2="120"/>
      <line className="chart-grid" x1="30" y1="90" x2="320" y2="90"/>
      <line className="chart-grid" x1="30" y1="60" x2="320" y2="60"/>
      
      {/* Chart line */}
      <path className="chart-line" d="M 50 110 Q 90 100 130 85 Q 170 70 210 75 Q 250 80 290 60"/>
      
      {/* Data points */}
      {[
        { x: 50, y: 110, active: false },
        { x: 90, y: 100, active: false },
        { x: 130, y: 85, active: false },
        { x: 170, y: 70, active: false },
        { x: 210, y: 75, active: true },
        { x: 250, y: 80, active: false },
        { x: 290, y: 60, active: false }
      ].map((point, index) => (
        <circle
          key={index}
          className={`chart-point ${point.active ? 'active' : ''}`}
          cx={point.x}
          cy={point.y}
          r={point.active ? 6 : 4}
        />
      ))}
      
      {/* Labels */}
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
        <text key={day} className="chart-label" x={50 + index * 40} y="140">{day}</text>
      ))}
      
      {/* Y-axis labels */}
      <text className="chart-label" x="20" y="125">10%</text>
      <text className="chart-label" x="20" y="95">20%</text>
      <text className="chart-label" x="20" y="65">40%</text>
      <text className="chart-label" x="20" y="35">60%</text>
    </svg>
  </div>
);

// Donut Chart Component
const DonutChart = ({ percentage }) => (
  <div className="donut-container">
    <svg className="donut-svg" viewBox="0 0 120 120">
      <circle className="donut-circle donut-background" cx="60" cy="60" r="40"/>
      <circle className="donut-circle donut-progress" cx="60" cy="60" r="40"/>
    </svg>
    <div className="donut-text">{percentage}%</div>
  </div>
);

// Task Statistics Component
const TaskStatistics = () => (
  <div className="stats-card">
    <div className="stats-title">Task Statistics</div>
    <DonutChart percentage={59} />
    <div className="stats-progress">
      <div className="stats-progress-fill"></div>
    </div>
  </div>
);

// Consistency Streak Component
const ConsistencyStreak = () => {
  const heights = [20, 30, 40, 50, 60, 70, 80];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <div className="stats-card">
      <div className="stats-title">Consistency Streak</div>
      <div className="streak-bars">
        {heights.map((height, index) => (
          <div
            key={index}
            className="streak-bar"
            style={{
              height: `${height}px`,
              animationDelay: `${3 + index * 0.1}s`
            }}
          />
        ))}
      </div>
      <div className="streak-labels">
        {days.map(day => (
          <span key={day}>{day}</span>
        ))}
      </div>
    </div>
  );
};

// Main Component
const ProductivityStats = () => {
  return (
    <div className="productivity-stats">
      {/* Header */}
      <header className="header">
        <StebeCharacter />
        <div className="motivation-text">Trabajo</div>
        <img src="/lovable-uploads/trabajo-icon.svg" alt="Trabajo" className="title-icon" />
      </header>

      {/* KPI Cards */}
      <div className="kpi-container">
        <KPICard 
          title="Tasks Completadas" 
          value="12-20" 
          hasProgress={true} 
          delay={0.6}
        />
        <KPICard 
          title="Streak" 
          value="3-Day" 
          hasIcon={true} 
          delay={0.8}
        />
        <KPICard 
          title="Time Spent" 
          value="4h 30m" 
          delay={1.0}
        />
      </div>

      {/* Weekly Activity Chart */}
      <WeeklyActivityChart />

      {/* Bottom Grid */}
      <div className="bottom-grid">
        <TaskStatistics />
        <ConsistencyStreak />
      </div>
    </div>
  );
};

export default ProductivityStats;
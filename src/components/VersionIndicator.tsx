import React from 'react';

interface VersionIndicatorProps {
  version?: string;
  className?: string;
}

const VersionIndicator: React.FC<VersionIndicatorProps> = ({ 
  version = "8.5", 
  className = "" 
}) => {
  return (
    <div 
      className={`fixed top-4 right-4 z-50 bg-black/80 text-white px-3 py-1.5 rounded-full text-xs font-mono font-medium backdrop-blur-sm border border-white/20 shadow-lg ${className}`}
      title={`Versión ${version}`}
    >
      v{version}
    </div>
  );
};

export default VersionIndicator;

import React from 'react';

export const Logo = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F93FF" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle cx="50" cy="50" r="48" fill="url(#logoGradient)" />
        
        {/* Letter C */}
        <path
          d="M 65 25 
             A 22 22 0 0 1 65 75
             M 62 32
             A 15 15 0 0 0 62 68"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Medical cross accent */}
        <circle cx="72" cy="30" r="4" fill="white" opacity="0.9" />
      </svg>
    </div>
  );
};

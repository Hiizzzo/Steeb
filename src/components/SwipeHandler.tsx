import React from 'react';

interface SwipeHandlerProps {
  children: React.ReactNode;
  [key: string]: any;
}

const SwipeHandler: React.FC<SwipeHandlerProps> = ({ children }) => {
  return <>{children}</>;
};

export default SwipeHandler;

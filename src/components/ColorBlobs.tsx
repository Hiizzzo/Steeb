
import React from 'react';

const ColorBlobs: React.FC = () => {
  return (
    <>
      <div className="absolute top-0 right-0 w-1/2 h-60 bg-gradient-to-br from-purple-200 via-blue-200 to-pink-200 blur-3xl rounded-full -mr-20 -mt-10 opacity-70"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-60 bg-gradient-to-tr from-blue-200 via-purple-200 to-pink-200 blur-3xl rounded-full -ml-20 -mb-10 opacity-70"></div>
      <div className="absolute bottom-1/3 right-0 w-1/3 h-40 bg-gradient-to-tl from-pink-200 via-purple-200 to-blue-200 blur-3xl rounded-full -mr-10 opacity-60"></div>
    </>
  );
};

export default ColorBlobs;

import React from 'react';
import ProductivityStats from './ProductivityStats';
import './App.css';

function App() {
  return (
    <div className="App">
      <img src="/icon.png" alt="icon" className="top-left-icon" />
      <ProductivityStats />
    </div>
  );
}

export default App;
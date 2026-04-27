import React from 'react';
import './index.css';
import heroImg from './hero.png';

function App() {
  return (
    <div className="app-container">
      <div className="glow" style={{ top: '10%', left: '10%' }}></div>
      <div className="glow" style={{ bottom: '10%', right: '10%', background: '#00f2ff' }}></div>
      
      <section className="hero-section">
        <h1 className="title">ANTIGRAVITY</h1>
        <p className="subtitle">
          Experience the future of seamless interaction. Our multi-agent orchestrator 
          defies the standard conventions of automation, bringing you a premium, 
          intelligent, and ultra-responsive digital environment.
        </p>
        
        <div className="image-container">
          <img src={heroImg} alt="Antigravity Concept" className="hero-image" />
        </div>
        
        <button className="cta-button">Engage System</button>
      </section>
    </div>
  );
}

export default App;

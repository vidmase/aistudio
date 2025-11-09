import React, { useState } from 'react';
import LandingPage from './LandingPage';
import './landing-page.css';

// This would be your existing main app component
const MainApp: React.FC = () => {
  return (
    <div className="main-app">
      {/* Your existing Imagina app content goes here */}
      <h1>Welcome to Imagina - Main App</h1>
      <p>This is where your existing application content would be displayed.</p>
    </div>
  );
};

// Enhanced app component with landing page
const AppWithLanding: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  // Check if user has visited before (you can use localStorage)
  React.useEffect(() => {
    const hasVisited = localStorage.getItem('imagina_visited');
    if (hasVisited) {
      setShowLanding(false);
      setIsFirstVisit(false);
    }
  }, []);

  const handleGetStarted = () => {
    // Mark as visited
    localStorage.setItem('imagina_visited', 'true');
    setShowLanding(false);
    setIsFirstVisit(false);
    
    // Optional: Track conversion event
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Landing_CTA_Clicked', {
        timestamp: new Date().toISOString(),
        source: 'landing_page'
      });
    }
  };

  const showLandingPage = () => {
    setShowLanding(true);
  };

  return (
    <div className="app-container">
      {showLanding ? (
        <LandingPage onGetStarted={handleGetStarted} />
      ) : (
        <div>
          {/* Optional: Add a "Show Landing" button for returning users */}
          {!isFirstVisit && (
            <button 
              onClick={showLandingPage}
              style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 1000,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              🚀 Landing
            </button>
          )}
          <MainApp />
        </div>
      )}
    </div>
  );
};

export default AppWithLanding;
import React, { useState, useEffect } from 'react';

// Modern icons for the landing page
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

const MusicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 8-6 4 6 4V8Z" />
    <rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    
    // Rotate featured capabilities
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % 3);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <ImageIcon />,
      title: "AI Image Generation",
      description: "Create stunning visuals with Gemini, Flux & Midjourney",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: <MusicIcon />,
      title: "Music Creation",
      description: "Generate original music and separate stems with Suno",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      icon: <VideoIcon />,
      title: "Video Generation",
      description: "Transform ideas into videos with VEO technology",
      gradient: "from-pink-500 to-red-600"
    }
  ];

  const benefits = [
    "Professional-grade AI tools in one platform",
    "Seamless workflow from concept to creation",
    "Support for all major AI models",
    "Intuitive interface designed for creators",
    "Real-time collaboration and sharing",
    "Export in any format you need"
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        
        <div className={`hero-content ${isVisible ? 'animate-in' : ''}`}>
          <div className="hero-badge">
            <SparklesIcon />
            <span>Powered by Advanced AI</span>
          </div>
          
          <h1 className="hero-title">
            Create Without
            <span className="gradient-text"> Limits</span>
          </h1>
          
          <p className="hero-subtitle">
            The ultimate AI-powered creative studio. Generate images, compose music, 
            and create videos with cutting-edge AI technology—all in one seamless platform.
          </p>
          
          <div className="hero-cta">
            <button className="cta-primary" onClick={onGetStarted}>
              Start Creating Now
              <ArrowRightIcon />
            </button>
            <button className="cta-secondary">
              Watch Demo
            </button>
          </div>
          
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Creators</span>
            </div>
            <div className="stat">
              <span className="stat-number">1M+</span>
              <span className="stat-label">Creations</span>
            </div>
            <div className="stat">
              <span className="stat-number">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="features-section">
        <div className="features-content">
          <div className="section-header">
            <h2>Everything You Need to Create</h2>
            <p>Powerful AI tools that adapt to your creative vision</p>
          </div>
          
          <div className="features-showcase">
            <div className="feature-tabs">
              {features.map((feature, index) => (
                <button
                  key={index}
                  className={`feature-tab ${currentFeature === index ? 'active' : ''}`}
                  onClick={() => setCurrentFeature(index)}
                >
                  {feature.icon}
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="feature-preview">
              <div className={`feature-visual bg-gradient-to-br ${features[currentFeature].gradient}`}>
                <div className="feature-visual-content">
                  {features[currentFeature].icon}
                  <h3>{features[currentFeature].title}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-content">
          <div className="benefits-text">
            <h2>Why Choose Imagina?</h2>
            <p>
              Join thousands of creators who've transformed their workflow with our 
              comprehensive AI creative suite.
            </p>
            
            <div className="benefits-list">
              {benefits.map((benefit, index) => (
                <div key={index} className="benefit-item">
                  <CheckIcon />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
            
            <button className="cta-primary" onClick={onGetStarted}>
              Get Started Free
              <ArrowRightIcon />
            </button>
          </div>
          
          <div className="benefits-visual">
            <div className="floating-card card-1">
              <ImageIcon />
              <span>AI Images</span>
            </div>
            <div className="floating-card card-2">
              <MusicIcon />
              <span>Music Gen</span>
            </div>
            <div className="floating-card card-3">
              <VideoIcon />
              <span>Video AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta-section">
        <div className="final-cta-content">
          <h2>Ready to Transform Your Creative Process?</h2>
          <p>Join the AI creative revolution. Start building amazing content today.</p>
          
          <div className="final-cta-buttons">
            <button className="cta-primary large" onClick={onGetStarted}>
              Start Creating Now
              <ArrowRightIcon />
            </button>
          </div>
          
          <div className="trust-indicators">
            <span>Trusted by creators worldwide</span>
            <div className="trust-badges">
              <div className="trust-badge">🔒 Secure</div>
              <div className="trust-badge">⚡ Fast</div>
              <div className="trust-badge">🎨 Creative</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
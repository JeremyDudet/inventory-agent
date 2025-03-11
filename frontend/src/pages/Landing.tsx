// frontend/src/pages/Landing.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      const shouldShowScrollTop = window.scrollY > 500;
      
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
      
      if (shouldShowScrollTop !== showScrollTop) {
        setShowScrollTop(shouldShowScrollTop);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled, showScrollTop]);
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary via-primary-focus to-base-100 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-accent/20 rounded-full filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '0s', animationDuration: '12s' }}></div>
        <div className="absolute top-1/4 -right-24 w-80 h-80 bg-secondary/30 rounded-full filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s', animationDuration: '15s' }}></div>
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-primary/30 rounded-full filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1s', animationDuration: '10s' }}></div>
        <div className="absolute top-2/3 right-1/4 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl opacity-10 animate-float" style={{ animationDelay: '3s', animationDuration: '14s' }}></div>
      </div>
      
      {/* Header with navigation */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'py-2 bg-primary/95 shadow-lg backdrop-blur-sm' : 'py-4 bg-transparent'}`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-primary-content flex items-center gap-2 group">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                </span>
              </div>
              <span className="relative">
                Inventory Agent
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-content transition-all duration-300 group-hover:w-full"></span>
              </span>
            </Link>
            <div className="flex items-center gap-2 md:gap-4">
              <Link to="/login" className="btn btn-ghost text-primary-content hover:bg-base-100/20 transition-colors duration-300">Login</Link>
              <Link to="/register" className="btn btn-primary relative overflow-hidden group">
                <span className="relative z-10">Sign Up</span>
                <span className="absolute inset-0 bg-white/20 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-300"></span>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4">
        {/* Hero section */}
        <main className="flex flex-col-reverse md:flex-row items-center justify-between py-16 md:py-24">
          <div className="md:w-1/2 text-center md:text-left">
            <div className="inline-block px-4 py-1 rounded-full bg-primary-focus mb-6 backdrop-blur-sm">
              <span className="text-primary-content text-sm font-medium">Voice-First Technology</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary-content leading-tight">
              <span className="block">Voice-Powered</span>
              Inventory Management <span className="relative inline-block">
                <span className="text-accent">for Restaurants</span>
                <span className="absolute bottom-1 left-0 w-full h-1 bg-accent/30 rounded-full"></span>
              </span>
            </h1>
            <p className="text-xl mb-8 text-primary-content opacity-90 max-w-lg">
              Manage your restaurant inventory with simple voice commands. Update stock levels, track ingredients, and make data-driven decisions in real-time — all while keeping your hands free.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Link to="/register" className="btn btn-primary btn-lg group relative overflow-hidden">
                <span className="relative z-10">Get Started Free</span>
                <span className="absolute inset-0 bg-white/20 transform translate-y-12 group-hover:translate-y-0 transition-transform duration-300"></span>
              </Link>
              <a href="#features" className="btn btn-outline btn-primary-content btn-lg group relative overflow-hidden">
                <span className="relative z-10">Learn More</span>
                <span className="absolute inset-0 bg-primary/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </a>
            </div>
            <div className="mt-8 space-y-3">
              <div className="p-4 bg-base-100/20 backdrop-blur-sm rounded-lg inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-primary-content">No credit card required</span>
              </div>
              <div className="p-4 bg-base-100/20 backdrop-blur-sm rounded-lg inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-primary-content">Works on any tablet or mobile device</span>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 mb-12 md:mb-0">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent to-secondary rounded-lg blur opacity-30"></div>
              <div className="relative bg-base-100 p-8 rounded-lg shadow-2xl">
                <div className="h-80 bg-base-300 rounded-md flex items-center justify-center overflow-hidden relative">
                  {/* Voice interaction visualization */}
                  <div className="w-full h-full bg-base-200 p-4 flex flex-col">
                    <div className="flex justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center animate-pulse">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </div>
                        <div className="ml-2 text-sm font-medium">Recording...</div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-6 h-6 bg-success rounded-full"></div>
                        <div className="w-6 h-6 bg-accent rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Chat interface preview */}
                    <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                      <div className="flex items-start animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          </div>
                          <div className="bg-primary/10 rounded-lg p-2 max-w-[80%]">
                            <p className="text-sm">How can I help with inventory today?</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start justify-end animate-fadeIn" style={{ animationDelay: '1s' }}>
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/20 rounded-lg p-2 max-w-[80%]">
                            <p className="text-sm">Add 5 kilos of flour to inventory</p>
                          </div>
                          <div className="w-6 h-6 rounded-full bg-accent/40 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start animate-fadeIn" style={{ animationDelay: '1.7s' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          </div>
                          <div className="bg-primary/10 rounded-lg p-2 max-w-[80%]">
                            <p className="text-sm">
                              <span className="inline-block animate-typing overflow-hidden whitespace-nowrap">Added 5 kg of flour to your inventory. </span>
                              <span className="font-medium">Current total: 12 kg.</span> Anything else?
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Audio wave visualization */}
                    <div className="h-12 mt-4 w-full flex items-center justify-center space-x-1 animate-sound-wave">
                      {[...Array(20)].map((_, i) => (
                        <div 
                          key={i} 
                          className="h-full w-1 bg-primary rounded-full" 
                          style={{ 
                            opacity: 0.3 + Math.sin(i * 0.5) * 0.7,
                            '--index': i
                          } as React.CSSProperties}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <div className="flex items-center gap-2">
                    <div className="badge badge-success">Live Demo</div>
                    <span className="text-sm">Voice Interface</span>
                  </div>
                  <div className="text-sm text-primary">Sub-1s Response Time</div>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        {/* Stats section */}
        <section className="py-8 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="stat bg-base-100/30 backdrop-blur-sm rounded-lg p-4">
              <div className="stat-title text-primary-content/70">Response Time</div>
              <div className="stat-value text-primary-content">1s</div>
              <div className="stat-desc text-primary-content/60">Fast voice recognition</div>
            </div>
            <div className="stat bg-base-100/30 backdrop-blur-sm rounded-lg p-4">
              <div className="stat-title text-primary-content/70">Time Saved</div>
              <div className="stat-value text-primary-content">40%</div>
              <div className="stat-desc text-primary-content/60">Compared to manual entry</div>
            </div>
            <div className="stat bg-base-100/30 backdrop-blur-sm rounded-lg p-4">
              <div className="stat-title text-primary-content/70">Error Reduction</div>
              <div className="stat-value text-primary-content">75%</div>
              <div className="stat-desc text-primary-content/60">Fewer inventory mistakes</div>
            </div>
            <div className="stat bg-base-100/30 backdrop-blur-sm rounded-lg p-4">
              <div className="stat-title text-primary-content/70">Hands-Free</div>
              <div className="stat-value text-primary-content">100%</div>
              <div className="stat-desc text-primary-content/60">No typing needed</div>
            </div>
          </div>
        </section>
        
        {/* How It Works section */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base-300/20 to-transparent opacity-50"></div>
          <div className="container relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-primary-content">How It Works</h2>
            <p className="text-center text-primary-content/80 mb-12 max-w-2xl mx-auto">
              Voice-driven inventory management made easy in three simple steps
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-float" style={{ animationDelay: '0s' }}>
                    <span className="text-3xl font-bold text-primary">1</span>
                  </div>
                  <svg className="absolute -bottom-8 right-0 h-16 w-16 text-primary/30 transform rotate-45 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-primary-content">Speak Your Command</h3>
                <p className="text-center text-base-content/80">Simply tap the mic button and speak naturally. For example, "Add five kilos of chicken to inventory" or "How much flour do we have left?"</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center animate-float" style={{ animationDelay: '0.2s' }}>
                    <span className="text-3xl font-bold text-secondary">2</span>
                  </div>
                  <svg className="absolute -bottom-8 right-0 h-16 w-16 text-primary/30 transform rotate-45 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-primary-content">AI Understands Intent</h3>
                <p className="text-center text-base-content/80">Our AI processes your request in real-time, understanding context and intent, even in noisy kitchen environments.</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="mb-6">
                  <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center animate-float" style={{ animationDelay: '0.4s' }}>
                    <span className="text-3xl font-bold text-accent">3</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-primary-content">Instant Results</h3>
                <p className="text-center text-base-content/80">Within a second, your inventory is updated and you receive verbal confirmation. All changes are logged for management review.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features section */}
        <section id="features" className="py-16 scroll-mt-24">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-primary-content">Voice-First Inventory Management</h2>
          <p className="text-center text-primary-content/80 mb-12 max-w-2xl mx-auto">Our voice-driven AI agent enables restaurant staff to update and query inventory through natural conversation, eliminating manual data entry while maintaining pinpoint accuracy.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="card-body">
                <div className="mb-4 bg-primary/10 p-3 rounded-lg inline-block">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="card-title text-xl">Voice-Driven Updates</h3>
                <p className="text-base-content/80">Simply speak commands in natural language to update inventory in real-time, even in busy kitchen environments.</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Sub-1 second responses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Natural conversation flow</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Works in noisy environments</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="card-body">
                <div className="mb-4 bg-secondary/10 p-3 rounded-lg inline-block">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="card-title text-xl">AI-Powered Conversations</h3>
                <p className="text-base-content/80">Advanced AI understands your voice commands, maintains context, and learns from your restaurant's specific inventory patterns.</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Context-aware memory</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Smart confirmation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Built on GPT-4/Claude</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="card-body">
                <div className="mb-4 bg-accent/10 p-3 rounded-lg inline-block">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <h3 className="card-title text-xl">Robust Fallback UI</h3>
                <p className="text-base-content/80">When voice isn't ideal, switch to our intuitive text interface. Perfect for extremely loud environments or detailed inventory tasks.</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Instant mode switching</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Role-based access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Error correction tools</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Early Access Section */}
        <section className="py-16 bg-base-200/30 backdrop-blur-sm relative">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/10 rounded-full filter blur-3xl animate-float" style={{ animationDuration: '15s' }}></div>
            <div className="absolute -bottom-32 -left-12 w-64 h-64 bg-primary/10 rounded-full filter blur-3xl animate-float" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/20 mb-8">
                <div className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse"></div>
                <span className="text-accent font-medium text-sm">Coming Soon</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary-content">Be Among the First to Experience Inventory Agent</h2>
              <p className="text-xl mb-8 text-primary-content/90 max-w-2xl mx-auto">
                We're launching soon and looking for restaurant partners to join our exclusive early access program.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/register" className="btn btn-accent btn-lg group relative overflow-hidden">
                  <span className="relative z-10">Join Early Access</span>
                  <span className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                </Link>
                <a href="#benefits" className="btn btn-outline border-accent/50 text-accent hover:bg-accent/10 hover:border-accent btn-lg">
                  View Benefits
                </a>
              </div>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-base-100/40 backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Early Access</span>
                </div>
                <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-base-100/40 backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Priority Support</span>
                </div>
                <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-base-100/40 backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Free for Beta Users</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section id="benefits" className="py-16 scroll-mt-24">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-primary-content">Why Restaurants Love Inventory Agent</h2>
          <p className="text-center text-primary-content/80 mb-12 max-w-2xl mx-auto">
            Designed to address the most common inventory management pain points
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 relative">
              <div className="card-body">
                <div className="flex items-start mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Save Staff Time</h3>
                    <p className="text-base-content/80">Our voice system is designed to save up to 75% of the time spent on inventory tasks, letting your team focus on what matters most.</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>No more clipboard counting</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Hands-free operation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Instant updates</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 relative">
              <div className="card-body">
                <div className="flex items-start mb-6">
                  <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Reduce Food Waste</h3>
                    <p className="text-base-content/80">Accurate inventory tracking means less overstocking, less spoilage, and ultimately reduced costs and environmental impact.</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Reduce overordering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Track expiration dates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Minimize spoilage</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 relative">
              <div className="card-body">
                <div className="flex items-start mb-6">
                  <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Improve Accuracy</h3>
                    <p className="text-base-content/80">Say goodbye to inventory discrepancies. Our system provides precise tracking and reduces human error in counting and data entry.</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Smart validation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Error confirmation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Audit trail for changes</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section id="faq" className="py-16 bg-base-200/30 backdrop-blur-sm scroll-mt-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-primary-content">Frequently Asked Questions</h2>
            <p className="text-center text-primary-content/80 mb-12 max-w-2xl mx-auto">
              Everything you need to know about our voice-driven inventory system
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="collapse collapse-arrow bg-base-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <input type="checkbox" className="peer" id="faq-1" /> 
                <label htmlFor="faq-1" className="collapse-title text-xl font-medium cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m0 0l-2.828 2.828m0 0a9 9 0 010-12.728m0 0l2.828 2.828" />
                      </svg>
                    </div>
                    <span>Does it work in noisy kitchen environments?</span>
                  </div>
                </label>
                <div className="collapse-content peer-checked:pt-1"> 
                  <p className="pl-11">Yes! Our system is specifically trained to function in busy restaurant environments. The advanced noise filtering technology and adaptive AI can distinguish your voice from background noise. For extremely loud situations, we also provide a fallback touch interface.</p>
                </div>
              </div>
              
              <div className="collapse collapse-arrow bg-base-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <input type="checkbox" className="peer" id="faq-2" /> 
                <label htmlFor="faq-2" className="collapse-title text-xl font-medium cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span>What hardware do I need?</span>
                  </div>
                </label>
                <div className="collapse-content peer-checked:pt-1"> 
                  <p className="pl-11">Inventory Agent works on any modern tablet or smartphone — no special hardware required. Most restaurants use a dedicated tablet mounted in the kitchen or inventory area, but staff can also use their personal devices with the proper permissions.</p>
                </div>
              </div>
              
              <div className="collapse collapse-arrow bg-base-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <input type="checkbox" className="peer" id="faq-3" /> 
                <label htmlFor="faq-3" className="collapse-title text-xl font-medium cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <span>How secure is my inventory data?</span>
                  </div>
                </label>
                <div className="collapse-content peer-checked:pt-1"> 
                  <p className="pl-11">Very secure. We use industry-standard encryption for all data (TLS), role-based access control for different staff levels, and our voice recordings are processed in real-time and not stored. Your inventory data is protected in our secure Supabase database with strict access controls.</p>
                </div>
              </div>
              
              <div className="collapse collapse-arrow bg-base-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <input type="checkbox" className="peer" id="faq-4" /> 
                <label htmlFor="faq-4" className="collapse-title text-xl font-medium cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span>Can I control who makes inventory changes?</span>
                  </div>
                </label>
                <div className="collapse-content peer-checked:pt-1"> 
                  <p className="pl-11">Absolutely. Our role-based permissions system allows you to set different access levels for owners, managers, chefs, and staff. You can configure which roles can add inventory, remove items, view reports, or just check quantities.</p>
                </div>
              </div>
              
              <div className="collapse collapse-arrow bg-base-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <input type="checkbox" className="peer" id="faq-5" /> 
                <label htmlFor="faq-5" className="collapse-title text-xl font-medium cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                    </div>
                    <span>What languages are supported?</span>
                  </div>
                </label>
                <div className="collapse-content peer-checked:pt-1"> 
                  <p className="pl-11">Currently, we support English, Spanish, and French. We're actively working on adding more languages to our voice recognition system in future updates.</p>
                </div>
              </div>
              
              <div className="collapse collapse-arrow bg-base-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <input type="checkbox" className="peer" id="faq-6" /> 
                <label htmlFor="faq-6" className="collapse-title text-xl font-medium cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span>How difficult is the setup process?</span>
                  </div>
                </label>
                <div className="collapse-content peer-checked:pt-1"> 
                  <p className="pl-11">Setup is quick and straightforward. Most restaurants are fully operational within a day. Our team helps you import your existing inventory data, set up user accounts with proper permissions, and provides training for your staff. We offer full support throughout the onboarding process.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA section */}
        <section className="py-16">
          <div className="bg-gradient-to-r from-primary to-secondary p-8 md:p-12 rounded-xl text-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
            
            {/* Animated voice waves decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 flex justify-center items-center pointer-events-none">
              <div className="h-40 w-60 flex items-center justify-around">
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                    className="h-full w-1.5 bg-white rounded-full"
                    style={{ 
                      animation: `soundWave 1.5s ease-in-out infinite`,
                      animationDelay: `${i * 0.2}s`,
                      height: `${20 + (i % 3) * 20}%`
                    }}
                  ></div>
                ))}
              </div>
            </div>
            
            <div className="relative z-10">
              <span className="px-4 py-1 rounded-full bg-accent/30 text-white font-medium text-sm mb-6 inline-block">Coming Soon</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-content">Join Our Restaurant Beta Program</h2>
              <p className="text-xl mb-8 text-primary-content/90 max-w-2xl mx-auto">Be the first to experience voice-driven inventory management and help shape the future of restaurant operations.</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/register" className="btn btn-accent btn-lg group relative overflow-hidden">
                  <span className="relative z-10">Reserve Your Spot</span>
                  <span className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                </Link>
                <a href="#faq" className="btn btn-outline btn-primary-content btn-lg group relative overflow-hidden">
                  <span className="relative z-10">Learn More</span>
                  <span className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                </a>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <div className="badge badge-lg badge-outline badge-primary">Limited Spots</div>
                <div className="badge badge-lg badge-outline badge-primary">Priority Support</div>
                <div className="badge badge-lg badge-outline badge-primary">Free for Beta Users</div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="py-12 border-t border-primary-content/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-primary-content mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-primary-content/70 hover:text-primary-content">Features</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Restaurant Solutions</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Voice Technology</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Updates</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-primary-content mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Voice Command Guide</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Restaurant Case Studies</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">ROI Calculator</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Kitchen Setup Guide</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-primary-content mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Documentation</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Help Center</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Video Tutorials</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Contact Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-primary-content mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">About Us</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Restaurant Partners</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Privacy Policy</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-primary-content/10">
            <div className="flex items-center gap-2 mb-4 md:mb-0 relative group">
              <div className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-all duration-300 rounded-full"></div>
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary-content group-hover:text-accent transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
              </div>
              <span className="text-primary-content font-bold relative z-10 px-2">Inventory Agent</span>
            </div>
            <div className="text-primary-content/70 bg-base-100/10 backdrop-blur-sm py-1 px-3 rounded-full">
              © {new Date().getFullYear()} Inventory Agent. All rights reserved.
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="text-primary-content hover:text-accent transition-colors duration-200 transform hover:scale-110">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-primary-content hover:text-accent transition-colors duration-200 transform hover:scale-110">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-primary-content hover:text-accent transition-colors duration-200 transform hover:scale-110">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-primary-content hover:text-accent transition-colors duration-200 transform hover:scale-110">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Scroll to top button */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 rounded-full bg-primary text-primary-content shadow-lg hover:bg-primary-focus transition-all duration-300 z-50 animate-fade-in"
          aria-label="Scroll to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Landing;
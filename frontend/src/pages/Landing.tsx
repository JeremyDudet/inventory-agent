// frontend/src/pages/Landing.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

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
    <div className="min-h-screen bg-gradient-to-b from-primary via-primary-focus to-base-100">
      {/* Header with navigation */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'py-2 bg-primary/95 shadow-lg backdrop-blur-sm' : 'py-4 bg-transparent'}`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-primary-content flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Inventory Agent</span>
            </Link>
            <div className="flex items-center gap-2 md:gap-4">
              <ThemeToggle />
              <Link to="/login" className="btn btn-ghost text-primary-content">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4">
        {/* Hero section */}
        <main className="flex flex-col-reverse md:flex-row items-center justify-between py-16 md:py-24">
          <div className="md:w-1/2 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary-content leading-tight">
              Smart Inventory Management <span className="text-accent">Simplified</span>
            </h1>
            <p className="text-xl mb-8 text-primary-content opacity-90 max-w-lg">
              Streamline your inventory tracking, reduce waste, and make data-driven decisions with our AI-powered inventory system.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
              <a href="#features" className="btn btn-outline btn-primary-content btn-lg">Learn More</a>
            </div>
            <div className="mt-8 p-4 bg-base-100/20 backdrop-blur-sm rounded-lg inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-primary-content">No credit card required</span>
            </div>
          </div>
          <div className="md:w-1/2 mb-12 md:mb-0">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent to-secondary rounded-lg blur opacity-30"></div>
              <div className="relative bg-base-100 p-8 rounded-lg shadow-2xl">
                <div className="h-64 bg-base-300 rounded-md flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-base-200 p-4 flex flex-col">
                    <div className="flex justify-between mb-4">
                      <div className="w-32 h-6 bg-base-100 rounded"></div>
                      <div className="flex gap-2">
                        <div className="w-6 h-6 bg-primary rounded-full"></div>
                        <div className="w-6 h-6 bg-accent rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-base-100 rounded p-2 flex flex-col justify-between">
                          <div className="w-full h-2 bg-primary/20 rounded-full"></div>
                          <div className="w-3/4 h-2 bg-primary/40 rounded-full"></div>
                        </div>
                      ))}
                    </div>
                    <div className="h-8 mt-4 bg-base-100 rounded w-full"></div>
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <div className="flex items-center gap-2">
                    <div className="badge badge-primary">Live</div>
                    <span className="text-sm">Dashboard Demo</span>
                  </div>
                  <div className="text-sm text-primary">Responsive & Dynamic</div>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        {/* Stats section */}
        <section className="py-8 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="stat bg-base-100/30 backdrop-blur-sm rounded-lg p-4">
              <div className="stat-title text-primary-content/70">Active Users</div>
              <div className="stat-value text-primary-content">2,500+</div>
            </div>
            <div className="stat bg-base-100/30 backdrop-blur-sm rounded-lg p-4">
              <div className="stat-title text-primary-content/70">Businesses</div>
              <div className="stat-value text-primary-content">500+</div>
            </div>
            <div className="stat bg-base-100/30 backdrop-blur-sm rounded-lg p-4">
              <div className="stat-title text-primary-content/70">Items Tracked</div>
              <div className="stat-value text-primary-content">1.2M+</div>
            </div>
            <div className="stat bg-base-100/30 backdrop-blur-sm rounded-lg p-4">
              <div className="stat-title text-primary-content/70">Time Saved</div>
              <div className="stat-value text-primary-content">30%</div>
            </div>
          </div>
        </section>
        
        {/* Features section */}
        <section id="features" className="py-16 scroll-mt-24">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-primary-content">Powerful Features</h2>
          <p className="text-center text-primary-content/80 mb-12 max-w-2xl mx-auto">Our intelligent inventory system helps businesses of all sizes track, manage, and optimize their inventory with powerful tools designed for efficiency.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="card-body">
                <div className="mb-4 bg-primary/10 p-3 rounded-lg inline-block">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="card-title text-xl">Real-Time Tracking</h3>
                <p className="text-base-content/80">Monitor your inventory levels in real-time across multiple locations with live updates and alerts.</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Live stock levels</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Low stock alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Multi-location support</span>
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
                <h3 className="card-title text-xl">AI-Powered Forecasting</h3>
                <p className="text-base-content/80">Predict future stock needs based on historical data, seasonal trends, and market conditions.</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Demand prediction</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Seasonal adjustment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Smart reordering</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="card-body">
                <div className="mb-4 bg-accent/10 p-3 rounded-lg inline-block">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                </div>
                <h3 className="card-title text-xl">Seamless Integration</h3>
                <p className="text-base-content/80">Connect with your existing tools and platforms for a unified workflow that simplifies your operations.</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>API connections</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>E-commerce plugins</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Accounting software sync</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials section */}
        <section className="py-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-primary-content">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <div className="avatar">
                    <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center">
                      <span className="text-primary font-bold text-lg">JD</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold">Jane Doe</h3>
                    <p className="text-sm text-base-content/70">Retail Store Owner</p>
                  </div>
                </div>
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-base-content/90">"Inventory Agent has transformed how we manage our stock. We've reduced overstock by 30% and never run out of popular items anymore."</p>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <div className="avatar">
                    <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center">
                      <span className="text-secondary font-bold text-lg">JS</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold">John Smith</h3>
                    <p className="text-sm text-base-content/70">Warehouse Manager</p>
                  </div>
                </div>
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-base-content/90">"The voice control feature is game-changing for our warehouse staff. Hands-free inventory management has boosted our efficiency by 40%."</p>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl md:col-span-2 lg:col-span-1">
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <div className="avatar">
                    <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center">
                      <span className="text-accent font-bold text-lg">SC</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold">Sarah Chen</h3>
                    <p className="text-sm text-base-content/70">E-commerce Founder</p>
                  </div>
                </div>
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-base-content/90">"The AI forecasting saved our business during peak seasons. We've cut costs while improving customer satisfaction with faster shipping times."</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA section */}
        <section className="py-16">
          <div className="bg-gradient-to-r from-primary to-secondary p-8 md:p-12 rounded-xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-content">Ready to Transform Your Inventory Management?</h2>
            <p className="text-xl mb-8 text-primary-content/90 max-w-2xl mx-auto">Join thousands of businesses using Inventory Agent to streamline operations and boost profitability.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register" className="btn btn-accent btn-lg">Get Started For Free</Link>
              <Link to="/login" className="btn btn-outline btn-primary-content btn-lg">Sign In</Link>
            </div>
            <p className="mt-6 text-primary-content/80">No credit card required · Free 14-day trial · Cancel anytime</p>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="py-12 border-t border-primary-content/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-primary-content mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-primary-content/70 hover:text-primary-content">Features</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Pricing</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Integrations</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Updates</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-primary-content mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">About</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Blog</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Careers</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-primary-content mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Documentation</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Help Center</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Tutorials</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-primary-content mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Privacy</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Terms</a></li>
                <li><a href="#" className="text-primary-content/70 hover:text-primary-content">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-primary-content/10">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-primary-content font-bold">Inventory Agent</span>
            </div>
            <div className="text-primary-content/70">
              © {new Date().getFullYear()} Inventory Agent. All rights reserved.
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="text-primary-content hover:text-accent">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-primary-content hover:text-accent">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-primary-content hover:text-accent">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-primary-content hover:text-accent">
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
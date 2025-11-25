
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Github, Database, Cpu, Code, ShieldCheck, Activity, FileText, Users, Globe, BookOpen, Dog, Layers, Box } from 'lucide-react';

interface AboutProps {
  onBack: () => void;
}

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

const Reveal: React.FC<RevealProps> = ({ children, className = "", delay = 0, direction = 'up' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Toggle visibility based on intersection status
        // This creates the "pop in / fade in" effect whenever the element enters the viewport
        // and resets it when it leaves, allowing it to replay when scrolling back.
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.15, // Slightly higher threshold to ensure it's actually entering
        rootMargin: "0px 0px -50px 0px" 
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  const getHiddenState = () => {
    switch(direction) {
      case 'up': return 'translate-y-12';
      case 'down': return '-translate-y-12';
      case 'left': return 'translate-x-12';
      case 'right': return '-translate-x-12';
      default: return 'translate-y-12';
    }
  };

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transform transition-all duration-700 ease-out ${
        isVisible 
          ? "opacity-100 translate-y-0 translate-x-0 scale-100 blur-none" 
          : `opacity-0 scale-95 blur-[2px] ${getHiddenState()}`
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const About: React.FC<AboutProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 p-6 z-50">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-sm font-bold transition-all group border border-white/10"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-24">
        
        {/* Hero */}
        <Reveal>
          <div className="text-center mb-20 space-y-6">
            <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-3xl mb-6 shadow-2xl border border-white/10">
               <Dog className="w-12 h-12 text-blue-400" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
              PetInfo<span className="text-blue-500">Sys</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Reimagining Barangay Animal Registry and Public Health Management with modern web technologies.
            </p>
          </div>
        </Reveal>

        {/* Mission Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-24">
          <Reveal delay={100} direction="left" className="h-full">
            <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 hover:bg-slate-800 transition-all hover:border-blue-500/30 group h-full">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 group-hover:text-blue-300"><ShieldCheck className="w-6 h-6" /></div>
                Objective
              </h2>
              <p className="text-slate-400 leading-relaxed">
                To digitalize and centralize animal records at the barangay level, ensuring accurate population tracking, efficient vaccination monitoring, and rapid response to bite incidents.
              </p>
            </div>
          </Reveal>
          <Reveal delay={200} direction="right" className="h-full">
            <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 hover:bg-slate-800 transition-all hover:border-emerald-500/30 group h-full">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 group-hover:text-emerald-300"><Globe className="w-6 h-6" /></div>
                Purpose
              </h2>
              <p className="text-slate-400 leading-relaxed">
                To support the implementation of <strong className="text-emerald-400">RA 9482 (Anti-Rabies Act)</strong> by providing LGUs with modern tools to manage pet data, improve public safety, and promote responsible pet ownership.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Features */}
        <div className="mb-24">
          <Reveal>
            <h3 className="text-3xl font-bold text-white mb-10 text-center">Core Capabilities</h3>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Database, title: "Digital Registry", desc: "Secure cloud database for pet profiles and owner mapping." },
              { icon: Activity, title: "Vaccination Tracking", desc: "Automated immunity monitoring and expiration alerts." },
              { icon: ShieldCheck, title: "Incident Management", desc: "Bite case reporting and observation period tracking." },
              { icon: Cpu, title: "AI Analytics", desc: "Gemini-powered executive summaries for data-driven decisions." },
              { icon: Users, title: "Public Portal", desc: "Transparency tools for residents to verify records." },
              { icon: FileText, title: "Instant Certificates", desc: "Generate official registration documents on demand." },
            ].map((feature, idx) => (
              <Reveal key={idx} delay={idx * 100} className="h-full">
                <div className="p-6 bg-slate-800/30 rounded-2xl border border-slate-700 hover:border-slate-600 transition-colors h-full">
                  <feature.icon className="w-8 h-8 text-blue-400 mb-4" />
                  <h4 className="font-bold text-lg text-slate-200 mb-2">{feature.title}</h4>
                  <p className="text-sm text-slate-500">{feature.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* User Guides */}
        <div className="mb-24">
          <Reveal>
            <div className="flex items-center justify-center gap-2 mb-10">
              <BookOpen className="w-6 h-6 text-slate-400" />
              <h3 className="text-3xl font-bold text-white text-center">Quick Guides</h3>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            <Reveal delay={0} className="h-full">
              <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 flex flex-col gap-4 h-full">
                 <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold shrink-0 text-lg">1</div>
                 <div>
                    <h4 className="text-lg font-bold text-white mb-2">Registering a Pet</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Navigate to the "Register Pet" tab. Fill in the owner's details including name and contact info, then provide the pet's specifics. Upload a photo for easier identification.
                    </p>
                 </div>
              </div>
            </Reveal>
            
            <Reveal delay={150} className="h-full">
              <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 flex flex-col gap-4 h-full">
                 <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold shrink-0 text-lg">2</div>
                 <div>
                    <h4 className="text-lg font-bold text-white mb-2">Logging Vaccines</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                       Go to "Vaccination", search for the pet, and log the vaccine details. The system automatically calculates the next due date based on the vaccine type (Core/Non-Core).
                    </p>
                 </div>
              </div>
            </Reveal>

            <Reveal delay={300} className="h-full">
              <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 flex flex-col gap-4 h-full">
                 <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 font-bold shrink-0 text-lg">3</div>
                 <div>
                    <h4 className="text-lg font-bold text-white mb-2">Incident Reporting</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                       Log bite incidents to track the required observation period. The dashboard highlights active cases requiring monitoring until they are cleared or resolved.
                    </p>
                 </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Tech Stack & CDNs */}
        <div className="mb-24">
          <Reveal>
            <div className="flex items-center justify-center gap-2 mb-10">
              <Layers className="w-6 h-6 text-slate-400" />
              <h3 className="text-3xl font-bold text-white text-center">Tech Stack & Libraries</h3>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-8">
            <Reveal delay={0} direction="left" className="h-full">
              <div className="bg-slate-800/30 p-8 rounded-3xl border border-slate-700/50 h-full">
                  <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Code className="w-5 h-5 text-blue-400" /> Core Technologies
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700">
                        <span className="font-medium text-slate-200">React 19</span>
                        <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded">Framework</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700">
                        <span className="font-medium text-slate-200">TypeScript</span>
                        <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded">Language</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700">
                        <span className="font-medium text-slate-200">Tailwind CSS</span>
                        <span className="text-xs font-bold text-sky-400 bg-sky-400/10 px-2 py-1 rounded">Styling</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700">
                        <span className="font-medium text-slate-200">Supabase</span>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Backend</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700">
                        <span className="font-medium text-slate-200">Google Gemini</span>
                        <span className="text-xs font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded">AI Model</span>
                    </div>
                  </div>
              </div>
            </Reveal>

            <Reveal delay={150} direction="right" className="h-full">
              <div className="bg-slate-800/30 p-8 rounded-3xl border border-slate-700/50 h-full">
                  <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Box className="w-5 h-5 text-indigo-400" /> CDNs & APIs
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white text-sm">PSGC API</span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">psgc.gitlab.io</span>
                        </div>
                        <p className="text-xs text-slate-400">Real-time Philippine regions, provinces, and barangays data.</p>
                    </div>

                    <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white text-sm">React Hot Toast</span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">CDN</span>
                        </div>
                        <p className="text-xs text-slate-400">Lightweight, accessible notifications and alerts.</p>
                    </div>

                    <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white text-sm">React QR Code</span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">CDN</span>
                        </div>
                        <p className="text-xs text-slate-400">Certification verification codes generation.</p>
                    </div>

                    <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white text-sm">Recharts</span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">CDN</span>
                        </div>
                        <p className="text-xs text-slate-400">Data visualization library for analytics dashboards.</p>
                    </div>
                    
                    <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white text-sm">jsPDF</span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">CDN</span>
                        </div>
                        <p className="text-xs text-slate-400">Client-side generation of printable documents.</p>
                    </div>
                  </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Team */}
        <Reveal delay={100}>
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-8 md:p-12 text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
            
            <h2 className="text-2xl font-bold text-white mb-10">Built By</h2>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-12">
               {/* Lead */}
               <div className="group">
                  <div className="w-28 h-28 bg-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-blue-900/50 ring-4 ring-slate-800 group-hover:scale-105 transition-transform">
                    MT
                  </div>
                  <h3 className="text-xl font-bold text-white">Mon Torneado</h3>
                  <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-2">Lead Developer</p>
                  <div className="flex justify-center gap-3 mt-4">
                    <a href="https://github.com/mohndng" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-700/50 rounded-full text-slate-400 hover:text-white transition-colors">
                      <Github className="w-5 h-5" />
                    </a>
                  </div>
               </div>

               <div className="hidden md:block w-px h-24 bg-slate-700"></div>

               {/* Tech Stack Credits */}
               <div className="flex flex-col gap-6 text-left">
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                     <div className="p-3 bg-slate-700 rounded-xl">
                        <Code className="w-6 h-6 text-indigo-400" />
                     </div>
                     <div>
                        <p className="text-white font-bold">Google AI Studio</p>
                        <p className="text-slate-500 text-xs">AI-Assisted Development</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                     <div className="p-3 bg-slate-700 rounded-xl">
                        <Database className="w-6 h-6 text-emerald-400" />
                     </div>
                     <div>
                        <p className="text-white font-bold">Supabase</p>
                        <p className="text-slate-500 text-xs">PostgreSQL Infrastructure</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </Reveal>

      </div>
    </div>
  );
};

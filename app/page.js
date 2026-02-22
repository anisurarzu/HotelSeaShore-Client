"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Image } from "antd";
import { Building2, UtensilsCrossed } from "lucide-react";

const PortalSelection = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Image
          src="/images/Animation.gif"
          alt="Loading..."
          preview={false}
          style={{ width: "130%", height: "auto" }}
        />
        <p className="text-lg font-semibold text-gray-700 animate-bounce mt-4">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-96 opacity-15">
          <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="url(#wave-gradient)" fillOpacity="0.3" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,122.7C1248,107,1344,85,1392,74.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
              <animate attributeName="d" dur="8s" repeatCount="indefinite" values="
                M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,122.7C1248,107,1344,85,1392,74.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                M0,160L48,154.7C96,149,192,139,288,154.7C384,171,480,213,576,213.3C672,213,768,171,864,138.7C960,107,1056,85,1152,90.7C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,122.7C1248,107,1344,85,1392,74.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
            </path>
            <defs>
              <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e40af" />
                <stop offset="50%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-4 mb-4">
              <img 
                src="https://i.ibb.co/7Jt48WLZ/Whats-App-Image-2025-12-29-at-04-33-36.jpg" 
                alt="Hotel Sea Shore Logo" 
                className="h-20 w-auto object-contain mx-auto"
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Sea Shore Portal
            </h1>
            <p className="text-gray-600 text-lg">
              Select your portal to continue
            </p>
            <div className="mt-3 text-sm text-gray-500 font-medium">
              {currentTime.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })} • {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit'
              })}
            </div>
          </div>

          {/* Portal Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Hotel Portal */}
            <div 
              onClick={() => {
                localStorage.setItem('isRestaurant', 'false');
                router.push('/login');
              }}
              className="group bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-blue-200 hover:border-blue-500 overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-all duration-300"
            >
              <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-700 p-8 text-white">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                    <Building2 className="w-12 h-12" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-2">
                  Hotel Sea Shore
                </h2>
                <p className="text-center text-blue-50 text-sm">
                  Hotel Management Portal
                </p>
              </div>
              <div className="p-6">
                <p className="text-gray-600 text-sm text-center">
                  Access hotel booking, room management, and administrative features
                </p>
                <div className="mt-4 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                    Enter Portal →
                  </span>
                </div>
              </div>
            </div>

            {/* Restaurant Portal */}
            <div 
              onClick={() => {
                localStorage.setItem('isRestaurant', 'true');
                router.push('/restaurant-login');
              }}
              className="group bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-emerald-200 hover:border-emerald-500 overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-all duration-300"
            >
              <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 p-8 text-white">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                    <UtensilsCrossed className="w-12 h-12" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-2">
                  Sea Shore Restaurant
                </h2>
                <p className="text-center text-emerald-50 text-sm">
                  Restaurant Management Portal
                </p>
              </div>
              <div className="p-6">
                <p className="text-gray-600 text-sm text-center">
                  Access restaurant orders, menu management, and dining services
                </p>
                <div className="mt-4 flex items-center justify-center">
                  <span className="text-emerald-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                    Enter Portal →
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-white/50">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700">System Online</span>
            </div>
          </div>

          <div className="mt-6 bg-gray-50/80 backdrop-blur-sm rounded-2xl px-6 py-4 border border-gray-200">
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-500">
                Developed by <span className="font-semibold text-gray-700">Cox Web Solutions</span>
              </p>
              <p className="text-xs text-gray-600">
                Contact support: <span className="font-semibold text-blue-600">
+8801840452081</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalSelection;

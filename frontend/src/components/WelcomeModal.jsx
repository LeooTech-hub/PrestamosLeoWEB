import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

export function WelcomeModal({ isOpen, user, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Interval to smoothly increment progress bar over 1.8 seconds (1800ms)
    const intervalMs = 30;
    const totalDuration = 1800; // 1.8 seconds
    const increment = 100 / (totalDuration / intervalMs);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + increment;
      });
    }, intervalMs);

    // After 1800ms, start exit fade-out animation
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 1800);

    // After exit animation completes (2200ms total), call onComplete
    const completeTimer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 2200);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  // Header display name ("¡Bienvenido, Leo!" or fallback)
  const displayName = user?.name || user?.nombre || 'Leo';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C221E]/40 backdrop-blur-sm transition-all duration-400 ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100 animate-fadeIn'
      }`}
    >
      <div
        className={`bg-white dark:bg-[#1E1E1E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-3xl p-6 sm:p-10 max-w-md w-full text-center shadow-2xl warm-shadow-lg relative overflow-hidden transition-all duration-400 ${
          isExiting ? 'scale-95 opacity-0' : 'animate-welcomeScale'
        }`}
      >
        {/* Top Decorative Line with System Green */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2D7A5D] via-[#D96B27] to-[#2D7A5D]" />

        {/* Logo Image with Scale & Soft Glow */}
        <div className="relative inline-block my-2">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white dark:border-[#24211E] shadow-xl overflow-hidden ring-4 ring-[#2D7A5D]/25 mx-auto animate-welcomeGlow bg-[#FAF8F5] dark:bg-[#24211E] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Logo_PrestamosLeo.jpg"
              alt="PrestamosLeo Logo"
              loading="eager"
              onError={(e) => {
                e.currentTarget.src = '/Logo_PrestamosLeo.png';
              }}
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="absolute bottom-0 right-0 bg-[#2D7A5D] text-white p-1.5 rounded-full ring-4 ring-white dark:ring-[#1E1E1E] shadow-md">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Primary Header */}
        <div className="mt-4 mb-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2C221E] dark:text-[#F3F4F6] tracking-tight">
            ¡Bienvenido, {displayName}!
          </h2>
        </div>

        {/* Secondary Message */}
        <p className="text-xs sm:text-sm font-semibold text-[#6E615A] dark:text-[#E5E7EB] mb-6 leading-relaxed">
          Accediendo al Panel de Administración de PrestamosLeo...
        </p>

        {/* System Green Spinner & Smooth Progress Bar */}
        <div className="space-y-3 pt-1 max-w-xs mx-auto">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-[#2D7A5D]/30 border-t-[#2D7A5D] rounded-full animate-spin shrink-0" />
            <span className="text-xs font-bold text-[#2D7A5D] tracking-wide">
              {Math.min(100, Math.round(progress))}% Cargando
            </span>
          </div>

          <div className="w-full bg-[#FAF8F5] border border-[#E6DCD2] h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="bg-gradient-to-r from-[#2D7A5D] to-[#389773] h-full rounded-full transition-all duration-150 ease-out"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

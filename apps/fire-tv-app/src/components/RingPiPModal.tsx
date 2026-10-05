import React, { useEffect, useState, useRef } from 'react';
import {
  Bell,
  X,
  Play,
  ShieldCheck,
  Radio
} from 'lucide-react';

interface RingPiPProps {
  coachName?: string;
  workoutType?: string;
  message?: string;
  onAccept: () => void;
  onDismiss: () => void;
}

export const RingPiPModal: React.FC<RingPiPProps> = ({
  coachName = 'Ghost Coach Jordan',
  workoutType = 'Squat Power Routine',
  message = 'Ghost Coach is at your front door with workout equipment!',
  onAccept,
  onDismiss,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [pipFocus, setPipFocus] = useState<'accept' | 'dismiss'>('accept');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // D-Pad / Remote control navigation for Ring PiP Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setPipFocus((prev) => (prev === 'accept' ? 'dismiss' : 'accept'));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (pipFocus === 'accept') {
          onAccept();
        } else {
          onDismiss();
        }
      } else if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'BrowserBack') {
        e.preventDefault();
        e.stopPropagation();
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pipFocus, onAccept, onDismiss]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour12: false }) + '.' + Math.floor(now.getMilliseconds() / 100));
    };
    updateTime();
    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, []);

  // Animate simulated Ring Porch Camera Feed on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let step = 0;

    const renderPorch = () => {
      step += 0.03;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Porch background (night/ambient front doorstep lighting)
      const bgGradient = ctx.createLinearGradient(0, 0, 0, h);
      bgGradient.addColorStop(0, '#111827');
      bgGradient.addColorStop(0.5, '#1e293b');
      bgGradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, w, h);

      // 2. Doorframe & Porch Lamp Glow
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(w * 0.25, h * 0.1, w * 0.5, h * 0.9);
      ctx.strokeStyle = '#312e81';
      ctx.lineWidth = 3;
      ctx.strokeRect(w * 0.25, h * 0.1, w * 0.5, h * 0.9);

      // Porch Light halo
      const lightHalo = ctx.createRadialGradient(w * 0.78, h * 0.25, 5, w * 0.78, h * 0.25, 70);
      lightHalo.addColorStop(0, 'rgba(251, 191, 36, 0.7)');
      lightHalo.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = lightHalo;
      ctx.beginPath();
      ctx.arc(w * 0.78, h * 0.25, 70, 0, Math.PI * 2);
      ctx.fill();

      // 3. Stylized Ghost Coach Silhouette / Avatar standing on porch
      const coachX = w * 0.5;
      const coachY = h * 0.62 + Math.sin(step * 2) * 4; // subtle floating coach movement

      // Coach Body Glow
      const coachGlow = ctx.createRadialGradient(coachX, coachY - 20, 10, coachX, coachY - 20, 60);
      coachGlow.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
      coachGlow.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = coachGlow;
      ctx.beginPath();
      ctx.arc(coachX, coachY - 20, 60, 0, Math.PI * 2);
      ctx.fill();

      // Coach Head
      ctx.fillStyle = '#00F0FF';
      ctx.beginPath();
      ctx.arc(coachX, coachY - 45, 18, 0, Math.PI * 2);
      ctx.fill();

      // Coach Eyes
      ctx.fillStyle = '#0A0D14';
      ctx.beginPath();
      ctx.arc(coachX - 6, coachY - 46, 3, 0, Math.PI * 2);
      ctx.arc(coachX + 6, coachY - 46, 3, 0, Math.PI * 2);
      ctx.fill();

      // Coach Torso / Athletic jacket
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(coachX - 22, coachY - 24, 44, 52, 10);
      } else {
        ctx.rect(coachX - 22, coachY - 24, 44, 52);
      }
      ctx.fill();

      // Coach Arms with Kettlebell
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      // Left arm waving
      ctx.beginPath();
      ctx.moveTo(coachX - 22, coachY - 14);
      ctx.lineTo(coachX - 38, coachY - 32 + Math.sin(step * 4) * 8);
      ctx.stroke();

      // Right arm holding kettlebell
      ctx.beginPath();
      ctx.moveTo(coachX + 22, coachY - 14);
      ctx.lineTo(coachX + 34, coachY + 12);
      ctx.stroke();

      // Kettlebell
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(coachX + 34, coachY + 22, 9, 0, Math.PI * 2);
      ctx.fill();

      // Ring camera scanline effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1);
      }

      animFrame = requestAnimationFrame(renderPorch);
    };

    renderPorch();
    return () => cancelAnimationFrame(animFrame);
  }, []);

  return (
    <div className="absolute top-20 right-8 z-50 w-[420px] bg-gray-950/95 border-2 border-orange-500/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-slideInRight duration-300">
      {/* Ring Header Bar */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2.5 flex items-center justify-between text-white">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-white animate-bounce" />
          <span className="font-black text-sm tracking-wide uppercase">Ring Doorbell Pro • Front Door</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-600 text-white animate-pulse">
            <Radio className="w-3 h-3 mr-1" /> LIVE
          </span>
          <button
            onClick={onDismiss}
            className="hover:bg-white/20 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Camera Live Viewport */}
      <div className="relative w-full h-[230px] bg-black">
        <canvas
          ref={canvasRef}
          width={420}
          height={230}
          className="w-full h-full object-cover"
        />

        {/* Ring Overlay Badges */}
        <div className="absolute top-2 left-3 flex items-center space-x-2 text-xs font-mono font-semibold text-white/90 drop-shadow">
          <span className="bg-black/60 px-2 py-0.5 rounded">1080p HDR</span>
          <span className="bg-black/60 px-2 py-0.5 rounded">{currentTime}</span>
        </div>

        <div className="absolute bottom-2 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded text-xs text-white/90 flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Motion Detected: {coachName}</span>
        </div>
      </div>

      {/* Action / Summon Details */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <h5 className="text-white font-black text-base">{coachName} is at your door</h5>
        <div className="text-xs font-semibold text-cyan-400 mt-0.5">{workoutType}</div>
        <p className="text-xs text-gray-300 mt-1 line-clamp-2">{message}</p>

        <div className="mt-3 flex items-center space-x-3">
          <button
            onClick={onAccept}
            className={`tv-focusable flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-gray-950 font-black py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-transform text-sm border-2 ${
              pipFocus === 'accept'
                ? 'tv-focused ring-4 ring-cyan-400 border-white scale-105'
                : 'border-transparent'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Open & Start Workout</span>
          </button>

          <button
            onClick={onDismiss}
            className={`tv-focusable bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2.5 px-3 rounded-xl text-xs transition-colors border-2 ${
              pipFocus === 'dismiss'
                ? 'tv-focused ring-4 ring-amber-400 border-white text-white scale-105'
                : 'border-transparent'
            }`}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

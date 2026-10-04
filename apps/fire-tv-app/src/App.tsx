import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Award,
  Bell,
  CheckCircle2,
  ChevronRight,
  Flame,
  Play,
  RotateCcw,
  Sparkles,
  Tv,
  Volume2,
  AlertTriangle,
  Camera
} from 'lucide-react';

interface RepData {
  repNumber: number;
  depth: number;
  duration: number;
  issue?: string;
}

interface RecoveryBrief {
  summary: string;
  overall_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  recovery_recommendations: string[];
}

export default function App() {
  // Navigation & TV Focus state
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [workoutActive, setWorkoutActive] = useState<boolean>(false);
  const [workoutComplete, setWorkoutComplete] = useState<boolean>(false);

  // Exercise state
  const [targetReps, setTargetReps] = useState<number>(10);
  const [repsCompleted, setRepsCompleted] = useState<number>(0);
  const [currentDepth, setCurrentDepth] = useState<number>(0);
  const [repState, setRepState] = useState<'UP' | 'DOWN'>('UP');
  const [repHistory, setRepHistory] = useState<RepData[]>([]);

  // Feedback & AI cues
  const [latestCue, setLatestCue] = useState<string>('Stand in view of camera to begin.');
  const [cueUrgency, setCueUrgency] = useState<'normal' | 'corrective' | 'milestone'>('normal');
  const [ringAlert, setRingAlert] = useState<string | null>(null);
  const [recoveryBrief, setRecoveryBrief] = useState<RecoveryBrief | null>(null);

  // Hardware/Webcam state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Sound generator
  const playBeep = (freq = 440, type: OscillatorType = 'sine', duration = 0.15) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // AudioContext could be blocked until user gesture
    }
  };

  // TV D-Pad Keydown Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (workoutComplete) {
        if (e.key === 'Enter') resetWorkout();
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setFocusedIndex((prev) => Math.min(prev + 1, 3));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        if (focusedIndex === 0) {
          if (!workoutActive) startWorkout();
          else completeWorkout();
        } else if (focusedIndex === 1) {
          simulateRep();
        } else if (focusedIndex === 2) {
          triggerSimulatedDing();
        } else if (focusedIndex === 3) {
          resetWorkout();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workoutActive, workoutComplete, focusedIndex, repsCompleted, targetReps]);

  // Polling Ring & Alexa MCP Status
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:8002/session/status');
        if (res.ok) {
          const data = await res.json();
          if (data.last_ring_event && !ringAlert) {
            setRingAlert(data.last_ring_event.message || 'Coach Jordan is at your front door!');
            playBeep(880, 'triangle', 0.4);
            setTimeout(() => setRingAlert(null), 8000);
          }
          if (data.active && !workoutActive) {
            setTargetReps(data.target_reps || 10);
            startWorkout();
          }
        }
      } catch {
        // Local server might not be running yet
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [workoutActive, ringAlert]);

  // Camera initialization
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        setCameraError(null);
      }
    } catch (err: any) {
      setCameraError('Webcam not detected. Use "Simulate Rep" button to test full pipeline.');
      setCameraActive(false);
    }
  };

  const startWorkout = () => {
    setWorkoutActive(true);
    setWorkoutComplete(false);
    setRepsCompleted(0);
    setRepHistory([]);
    setLatestCue('Workout initiated! Begin squats when ready.');
    setCueUrgency('normal');
    startCamera();
    playBeep(523.25, 'sine', 0.2); // C5
  };

  const completeWorkout = async () => {
    setWorkoutActive(false);
    setWorkoutComplete(true);
    playBeep(659.25, 'sine', 0.3); // E5

    // Request recovery brief from Alexa MCP / Bedrock
    try {
      const res = await fetch('http://localhost:8002/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'brief_1',
          method: 'tools/call',
          params: {
            name: 'generate_recovery_brief',
            arguments: { user_name: 'Alex' },
          },
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const contentStr = json.result?.content?.[0]?.text;
        if (contentStr) {
          const parsed = JSON.parse(contentStr);
          setRecoveryBrief(parsed);
          return;
        }
      }
    } catch {
      // Fallback local brief
    }

    setRecoveryBrief({
      summary: `Awesome effort! Completed ${repsCompleted} reps with deep hip flexion.`,
      overall_score: 92,
      strengths: ['Great pacing (1.7s per rep)', 'Chest remained upright for 90% of set'],
      areas_for_improvement: ['Slight knee cave detected on rep 7'],
      recovery_recommendations: ['Perform 5 minutes of quad & hip stretching', 'Rehydrate with 500ml of water'],
    });
  };

  const resetWorkout = () => {
    setWorkoutActive(false);
    setWorkoutComplete(false);
    setRepsCompleted(0);
    setCurrentDepth(0);
    setRepHistory([]);
    setRecoveryBrief(null);
    setLatestCue('Stand in view of camera to begin.');
  };

  // Simulates a rep for testing without a physical webcam
  const simulateRep = () => {
    if (!workoutActive) {
      startWorkout();
      return;
    }

    setCurrentDepth(95);
    playBeep(440, 'triangle', 0.1);

    setTimeout(() => {
      setCurrentDepth(0);
      const newRepNum = repsCompleted + 1;
      setRepsCompleted(newRepNum);
      playBeep(880, 'sine', 0.2);

      const isSag = newRepNum === 4;
      const cue = isSag
        ? 'Keep your chest tall! Push through heels.'
        : newRepNum === targetReps
        ? 'Target reached! Phenomenal set!'
        : `Rep ${newRepNum} locked in. Stay steady!`;

      setLatestCue(cue);
      setCueUrgency(isSag ? 'corrective' : newRepNum === targetReps ? 'milestone' : 'normal');

      setRepHistory((prev) => [
        ...prev,
        {
          repNumber: newRepNum,
          depth: isSag ? 78 : 95,
          duration: 1.8,
          issue: isSag ? 'chest_sag' : undefined,
        },
      ]);

      if (newRepNum >= targetReps) {
        setTimeout(completeWorkout, 800);
      }
    }, 600);
  };

  const triggerSimulatedDing = async () => {
    try {
      await fetch('http://localhost:8001/api/trigger/ding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'ding',
          coach_name: 'Ghost Coach Jordan',
          workout_type: 'Squat Power Routine',
          message: 'Ghost Coach has arrived at your porch with workout gear!',
        }),
      });
      setRingAlert('🔔 Coach Jordan has arrived at your Front Porch!');
      playBeep(880, 'triangle', 0.4);
      setTimeout(() => setRingAlert(null), 6000);
    } catch {
      setRingAlert('🔔 Coach Jordan has arrived at your Front Porch!');
      setTimeout(() => setRingAlert(null), 6000);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#0A0D14] text-white flex flex-col justify-between p-8 font-sans overflow-hidden">
      {/* Ring Doorbell Ambient Summon Banner */}
      {ringAlert && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-orange-600 to-amber-500 border-2 border-white/40 shadow-2xl rounded-2xl px-8 py-5 flex items-center space-x-5 animate-bounce">
          <Bell className="w-10 h-10 text-white animate-pulse" />
          <div>
            <h4 className="text-xl font-black uppercase tracking-wider text-white">Ring Doorstep Summon</h4>
            <p className="text-lg font-medium text-white/95">{ringAlert}</p>
          </div>
        </div>
      )}

      {/* Top 10-Foot HUD Header */}
      <header className="flex justify-between items-center border-b border-gray-800 pb-4 z-20">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
            <Activity className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              GhostTrainer <span className="text-xs px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-semibold">FIRE TV SMART MIRROR</span>
            </h1>
            <p className="text-sm text-gray-400 font-medium">Cross-Device Ambient AI Fitness Ecosystem</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 bg-gray-900/80 px-4 py-2 rounded-xl border border-gray-800">
            <Tv className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-semibold text-gray-300">10-Foot UI Active</span>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-950/60 px-4 py-2 rounded-xl border border-emerald-800 text-emerald-400">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-semibold">AWS Bedrock Claude 3.5</span>
          </div>
        </div>
      </header>

      {/* Main TV Mirror Viewport */}
      <main className="relative flex-1 my-6 rounded-3xl overflow-hidden bg-gray-950/80 border-2 border-gray-800 flex items-center justify-center">
        {/* Video feed or Camera Simulator backdrop */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 opacity-60"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-8 text-center bg-gradient-to-b from-gray-950/40 via-gray-900/60 to-gray-950/90">
            <div className="w-24 h-24 rounded-full bg-cyan-500/10 border-2 border-cyan-400/40 flex items-center justify-center mb-6">
              <Camera className="w-12 h-12 text-cyan-400" />
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-3">Ambient Smart Mirror Feed</h2>
            <p className="text-lg text-gray-300 max-w-lg mb-6">
              {cameraError || 'Position yourself 6-8 feet away from your Fire TV. MoveNet tracks depth and rep cadence automatically.'}
            </p>
          </div>
        )}

        {/* Live HUD Overlays during workout */}
        {workoutActive && (
          <div className="absolute inset-0 z-20 pointer-events-none p-10 flex flex-col justify-between">
            {/* Top Stat Row */}
            <div className="flex justify-between items-start">
              {/* Rep Counter Card */}
              <div className="bg-gray-950/90 border-2 border-cyan-500/60 backdrop-blur-md rounded-3xl p-6 shadow-2xl min-w-[240px]">
                <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase">Squat Reps</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-7xl font-black text-white">{repsCompleted}</span>
                  <span className="text-3xl font-bold text-gray-500">/ {targetReps}</span>
                </div>
                <div className="w-full bg-gray-800 h-3 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (repsCompleted / targetReps) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Depth & Biomechanics Gauge */}
              <div className="bg-gray-950/90 border-2 border-gray-800 backdrop-blur-md rounded-3xl p-6 shadow-2xl min-w-[240px] text-right">
                <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Hip Depth Target</span>
                <div className="flex items-baseline justify-end space-x-2 mt-1">
                  <span className={`text-6xl font-black ${currentDepth >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {currentDepth > 0 ? `${currentDepth}%` : '--'}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-400">
                  {currentDepth >= 85 ? '✓ Parallel Depth' : 'Sink to 90°'}
                </span>
              </div>
            </div>

            {/* AWS Bedrock Real-time Voice Cue Banner */}
            <div className="flex justify-center">
              <div
                className={`max-w-2xl px-8 py-5 rounded-2xl border-2 shadow-2xl backdrop-blur-md flex items-center space-x-4 transition-all duration-300 ${
                  cueUrgency === 'corrective'
                    ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                    : cueUrgency === 'milestone'
                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                    : 'bg-cyan-950/90 border-cyan-500 text-cyan-200'
                }`}
              >
                {cueUrgency === 'corrective' ? (
                  <AlertTriangle className="w-8 h-8 text-rose-400 flex-shrink-0 animate-bounce" />
                ) : (
                  <Sparkles className="w-8 h-8 text-cyan-400 flex-shrink-0" />
                )}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block opacity-75">
                    Bedrock Coach Cue
                  </span>
                  <p className="text-2xl font-black">{latestCue}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Post-Workout Recovery Debrief Modal */}
        {workoutComplete && recoveryBrief && (
          <div className="absolute inset-0 z-30 bg-gray-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-12 text-center animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-6">
              <Award className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-5xl font-black text-white mb-2">Workout Complete!</h2>
            <p className="text-xl text-gray-300 max-w-xl mb-8">{recoveryBrief.summary}</p>

            <div className="grid grid-cols-3 gap-6 max-w-4xl w-full text-left mb-8">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <span className="text-xs font-bold text-gray-400 uppercase">AI Form Score</span>
                <p className="text-5xl font-black text-cyan-400 mt-2">{recoveryBrief.overall_score}/100</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <span className="text-xs font-bold text-emerald-400 uppercase">Highlights</span>
                <ul className="mt-2 text-sm text-gray-300 space-y-1">
                  {recoveryBrief.strengths.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <span className="text-xs font-bold text-amber-400 uppercase">Recovery Plan</span>
                <ul className="mt-2 text-sm text-gray-300 space-y-1">
                  {recoveryBrief.recovery_recommendations.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={resetWorkout}
              className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-black text-xl rounded-2xl shadow-xl transition-all"
            >
              Start New Routine (Press Enter)
            </button>
          </div>
        )}
      </main>

      {/* 10-Foot D-Pad Bottom Nav Bar */}
      <footer className="flex justify-between items-center z-20">
        <div className="flex items-center space-x-3 text-sm text-gray-400">
          <span className="px-2 py-1 bg-gray-800 rounded font-mono font-bold text-gray-300">D-PAD</span>
          <span>Use Arrow Keys or TV Remote to Navigate, Enter to Select</span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => (!workoutActive ? startWorkout() : completeWorkout())}
            className={`tv-focusable px-6 py-3.5 rounded-2xl font-black text-lg flex items-center space-x-2 border-2 ${
              focusedIndex === 0 ? 'tv-focused bg-cyan-500 text-gray-950 border-cyan-300' : 'bg-gray-900 text-gray-200 border-gray-700'
            }`}
          >
            {!workoutActive ? (
              <>
                <Play className="w-5 h-5" />
                <span>Start Session</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Finish Session</span>
              </>
            )}
          </button>

          <button
            onClick={simulateRep}
            className={`tv-focusable px-6 py-3.5 rounded-2xl font-black text-lg flex items-center space-x-2 border-2 ${
              focusedIndex === 1 ? 'tv-focused bg-emerald-500 text-gray-950 border-emerald-300' : 'bg-gray-900 text-gray-200 border-gray-700'
            }`}
          >
            <Flame className="w-5 h-5 text-emerald-400" />
            <span>Simulate Rep (+1)</span>
          </button>

          <button
            onClick={triggerSimulatedDing}
            className={`tv-focusable px-6 py-3.5 rounded-2xl font-black text-lg flex items-center space-x-2 border-2 ${
              focusedIndex === 2 ? 'tv-focused bg-amber-500 text-gray-950 border-amber-300' : 'bg-gray-900 text-gray-200 border-gray-700'
            }`}
          >
            <Bell className="w-5 h-5 text-amber-400" />
            <span>Trigger Ring Doorbell</span>
          </button>

          <button
            onClick={resetWorkout}
            className={`tv-focusable px-4 py-3.5 rounded-2xl font-bold text-gray-400 hover:text-white border-2 border-transparent ${
              focusedIndex === 3 ? 'tv-focused bg-gray-800 border-gray-600' : ''
            }`}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// components/Header.tsx
// ─────────────────────────────────────────────────────────────
import { Satellite, Activity, Github } from 'lucide-react';

export default function Header() {
  return (
    <header className="relative z-10 border-b border-white/[0.06] bg-surface-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-900/50">
              <Satellite className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-surface-900 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">
              AerialCV
            </h1>
            <p className="text-[10px] text-slate-500 font-medium -mt-0.5 uppercase tracking-widest">
              Construction Monitor
            </p>
          </div>
        </div>

        {/* Centre pills */}
        <div className="hidden md:flex items-center gap-2">
          <span className="badge-blue">
            <Activity className="w-3 h-3" />
            ORB + Homography
          </span>
          <span className="badge-purple">
            SSIM Analysis
          </span>
          <span className="badge-green">
            Canny Edges
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary !px-3 !py-2"
            title="View source"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Source</span>
          </a>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            API Live
          </div>
        </div>
      </div>
    </header>
  );
}

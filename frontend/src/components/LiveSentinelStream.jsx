import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config';
import { 
  Radio, 
  Play, 
  Pause, 
  ShieldAlert, 
  ShieldCheck, 
  AlertCircle, 
  Activity, 
  Zap, 
  TrendingUp 
} from 'lucide-react';

export default function LiveSentinelStream() {
  const [isRunning, setIsRunning] = useState(true);
  const [streamEvents, setStreamEvents] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, fake: 0, genuine: 0 });
  const intervalRef = useRef(null);

  const fetchTick = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stream/simulate-tick`);
      const data = await res.json();
      
      setStreamEvents(prev => [data, ...prev.slice(0, 24)]);
      setMetrics(prev => ({
        total: prev.total + 1,
        fake: prev.fake + (data.prediction.is_fake === 1 ? 1 : 0),
        genuine: prev.genuine + (data.prediction.is_fake === 0 ? 1 : 0)
      }));
    } catch (e) {
      console.error("Stream tick error", e);
    }
  };

  useEffect(() => {
    if (isRunning) {
      // Fetch initial tick immediately
      fetchTick();
      intervalRef.current = setInterval(fetchTick, 2200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const fraudRate = metrics.total > 0 ? ((metrics.fake / metrics.total) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Real-Time Stream Sentinel</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated live high-throughput social event stream with sub-millisecond fraud scoring and risk interception.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition ${
              isRunning 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause Sentinel
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Resume Stream
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stream Metrics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400">Streamed Ingest</span>
            <div className="text-2xl font-extrabold font-mono text-slate-100 mt-1">{metrics.total}</div>
          </div>
          <Activity className="w-6 h-6 text-cyan-400" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-rose-400">Bots Intercepted</span>
            <div className="text-2xl font-extrabold font-mono text-rose-300 mt-1">{metrics.fake}</div>
          </div>
          <ShieldAlert className="w-6 h-6 text-rose-400" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-emerald-400">Organic Users</span>
            <div className="text-2xl font-extrabold font-mono text-emerald-300 mt-1">{metrics.genuine}</div>
          </div>
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-purple-400">Stream Fraud Rate</span>
            <div className="text-2xl font-extrabold font-mono text-purple-300 mt-1">{fraudRate}%</div>
          </div>
          <TrendingUp className="w-6 h-6 text-purple-400" />
        </div>
      </div>

      {/* Live Stream Telemetry Feed */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Live Ingest Feed Ticker
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Auto-polling / 2.2s</span>
        </div>

        <div className="p-4 space-y-2.5 max-h-[480px] overflow-y-auto">
          {streamEvents.length === 0 ? (
            <div className="text-center py-12 text-xs font-mono text-slate-500">
              Awaiting stream connection...
            </div>
          ) : (
            streamEvents.map((evt, idx) => {
              const isFake = evt.prediction.is_fake === 1;
              return (
                <div
                  key={evt.stream_id || idx}
                  className={`p-3.5 rounded-xl border transition duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isFake 
                      ? 'bg-rose-500/5 border-rose-500/30 hover:border-rose-500/60' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    {isFake ? (
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-slate-100">
                          @{evt.account_data.username}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-400">
                          {evt.prediction.predicted_archetype}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">
                        "{evt.account_data.bio || evt.account_data.recent_post || 'No bio text'}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/80">
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 block">Risk Score</span>
                      <span className={`text-xs font-mono font-bold ${isFake ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {evt.prediction.risk_score} / 100
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold ${
                      isFake ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {isFake ? 'BLOCKED' : 'VERIFIED'}
                    </span>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}

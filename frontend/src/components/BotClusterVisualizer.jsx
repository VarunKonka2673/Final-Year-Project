import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { 
  Network, 
  Layers, 
  Info, 
  RefreshCw, 
  Filter, 
  ShieldAlert, 
  Circle 
} from 'lucide-react';

export default function BotClusterVisualizer() {
  const [clusterData, setClusterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, bots, anomalies, clusters

  const fetchClusters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/anomalies/clusters`);
      const json = await res.json();
      setClusterData(json);
    } catch (e) {
      console.error("Failed to load cluster data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-mono text-slate-400">Computing 2D PCA & DBSCAN Bot Clusters...</span>
      </div>
    );
  }

  const points = clusterData?.points || [];
  const clusterSummary = clusterData?.cluster_summary || {};
  const explainedVariance = clusterData?.pca_explained_variance || [0.45, 0.28];

  // Determine coordinate bounding box for SVG scaling
  let minX = -15, maxX = 15, minY = -15, maxY = 15;
  if (points.length > 0) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    minX = Math.min(...xs) - 2;
    maxX = Math.max(...xs) + 2;
    minY = Math.min(...ys) - 2;
    maxY = Math.max(...ys) + 2;
  }

  const mapX = (x) => ((x - minX) / (maxX - minX)) * 540 + 30;
  const mapY = (y) => 360 - (((y - minY) / (maxY - minY)) * 300 + 30);

  // Filter points based on user toggle
  const filteredPoints = points.filter(p => {
    if (filterType === 'bots') return p.is_fake === 1;
    if (filterType === 'anomalies') return p.is_isolation_anomaly;
    if (filterType === 'clusters') return p.cluster_id >= 0;
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Network className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Coordinated Bot Ring & Anomaly Matrix</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                2D PCA Dimensionality Projection of Behavioral Space with DBSCAN Density Clustering & Isolation Forest Anomaly Boundaries.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filter:
          </span>
          {['all', 'bots', 'anomalies', 'clusters'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition ${
                filterType === type 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'bg-slate-850 text-slate-400 hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
          <button
            onClick={fetchClusters}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Recalculate Projection"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: 2D Interactive Scatter Canvas (8 cols) */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-slate-800 relative">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Circle className="w-2.5 h-2.5 fill-cyan-400" /> Genuine Users
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <Circle className="w-2.5 h-2.5 fill-rose-400" /> Fraudulent Bots
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <Circle className="w-2.5 h-2.5 fill-purple-400" /> Coordinated Rings
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Showing {filteredPoints.length} accounts
            </span>
          </div>

          {/* SVG 2D Scatter Chart */}
          <div className="w-full aspect-[16/10] relative mt-4 bg-[#050811] rounded-xl border border-slate-800/80 overflow-hidden cyber-grid">
            <svg className="w-full h-full" viewBox="0 0 600 380">
              
              {/* Axes lines */}
              <line x1="30" y1="190" x2="570" y2="190" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="300" y1="30" x2="300" y2="350" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />

              {/* Data points */}
              {filteredPoints.map((p) => {
                const cx = mapX(p.x);
                const cy = mapY(p.y);
                const isHovered = hoveredPoint && hoveredPoint.id === p.id;
                
                let fillColor = "#38bdf8"; // Genuine Cyan
                if (p.cluster_id >= 0) {
                  fillColor = "#c084fc"; // Coordinated Purple
                } else if (p.is_fake === 1) {
                  fillColor = "#fb7185"; // Fake Rose
                }

                return (
                  <g key={p.id} onMouseEnter={() => setHoveredPoint(p)}>
                    {p.is_isolation_anomaly && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 12 : 7}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        opacity="0.6"
                        className="animate-pulse"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : (p.is_fake === 1 ? 4 : 3)}
                      fill={fillColor}
                      opacity={isHovered ? 1 : 0.85}
                      className="cursor-pointer transition-all duration-150"
                    />
                  </g>
                );
              })}

            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div 
                className="absolute p-3 rounded-xl bg-slate-950/95 border border-cyan-500/40 text-xs shadow-2xl backdrop-blur-md pointer-events-none z-20 space-y-1"
                style={{
                  left: `${Math.min(75, Math.max(10, (mapX(hoveredPoint.x)/600)*100))}%`,
                  top: `${Math.min(75, Math.max(10, (mapY(hoveredPoint.y)/380)*100))}%`
                }}
              >
                <div className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${hoveredPoint.is_fake ? 'bg-rose-400' : 'bg-cyan-400'}`} />
                  {hoveredPoint.archetype}
                </div>
                <div className="font-mono text-[11px] text-slate-300">
                  Status: <strong className={hoveredPoint.is_fake ? 'text-rose-400' : 'text-emerald-400'}>
                    {hoveredPoint.is_fake ? 'Fraudulent Bot' : 'Genuine Organic'}
                  </strong>
                </div>
                <div className="font-mono text-[10px] text-slate-400">
                  PCA: ({hoveredPoint.x}, {hoveredPoint.y})
                </div>
                <div className="font-mono text-[10px] text-slate-400">
                  Anomaly Index: <span className="text-cyan-300 font-bold">{hoveredPoint.anomaly_score}</span>
                </div>
                {hoveredPoint.cluster_id >= 0 && (
                  <div className="font-mono text-[10px] text-purple-300 font-bold">
                    Coordinated Cluster Ring #{hoveredPoint.cluster_id}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mt-3">
            <span>PCA Component 1 ({Math.round(explainedVariance[0]*100)}% variance)</span>
            <span>PCA Component 2 ({Math.round(explainedVariance[1]*100)}% variance)</span>
          </div>

        </div>

        {/* Right: Cluster Intelligence Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              DBSCAN Ring Intelligence
            </h4>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400">Coordinated Rings Detected</div>
              <div className="text-2xl font-extrabold font-mono text-purple-300">
                {clusterSummary.num_coordinated_clusters || 0} Bot Rings
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Accounts exhibiting near-identical creation timestamps, follow frequencies, and lexical templates form high-density clusters in reduced feature space.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">DBSCAN Cluster Sizes</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {Object.entries(clusterSummary.cluster_sizes || {}).map(([cId, count]) => {
                  const isNoise = cId === "-1";
                  return (
                    <div key={cId} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono">
                      <span className={isNoise ? "text-slate-400" : "text-purple-300 font-bold"}>
                        {isNoise ? "Uncorrelated / Noise" : `Ring Cluster #${cId}`}
                      </span>
                      <span className="text-slate-200 font-bold">{count} accounts</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              Isolation Forest Boundary
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pulsing outer rings highlight accounts flagged by Isolation Forest as statistical outliers (contamination rate = 0.25). This catches unseen zero-day bot variants without requiring supervised labels.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

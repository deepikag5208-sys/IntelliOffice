import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, color = "blue", trend, className = "" }) => {
  const colorMap = {
    blue: "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30 hover:border-blue-500/60 hover:shadow-blue-500/20",
    emerald: "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-emerald-500/20",
    amber: "from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30 hover:border-amber-500/60 hover:shadow-amber-500/20",
    purple: "from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/30 hover:border-purple-500/60 hover:shadow-purple-500/20",
    rose: "from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/30 hover:border-rose-500/60 hover:shadow-rose-500/20",
    cyan: "from-cyan-500/20 to-cyan-600/5 text-cyan-400 border-cyan-500/30 hover:border-cyan-500/60 hover:shadow-cyan-500/20"
  };

  const iconBg = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:rotate-3",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500/20 group-hover:rotate-3",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20 group-hover:scale-110 group-hover:bg-amber-500/20 group-hover:rotate-3",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20 group-hover:scale-110 group-hover:bg-purple-500/20 group-hover:rotate-3",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20 group-hover:scale-110 group-hover:bg-rose-500/20 group-hover:rotate-3",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 group-hover:scale-110 group-hover:bg-cyan-500/20 group-hover:rotate-3"
  };

  return (
    <div className={`p-5 rounded-2xl glass-card relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl border group cursor-default ${colorMap[color] || colorMap.blue} ${className}`}>
      {/* Background Ambient Glow Accent */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-current opacity-10 rounded-full blur-xl pointer-events-none group-hover:opacity-20 transition-opacity"></div>
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-extrabold text-white mt-1 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border transition-all duration-300 ${iconBg[color] || iconBg.blue} shrink-0`}>
            <Icon className="w-6 h-6 transition-transform duration-300" />
          </div>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs relative z-10">
          {subtext && <span className="text-slate-400 font-medium">{subtext}</span>}
          {trend && (
            <span className={`inline-flex items-center gap-1 font-semibold ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;

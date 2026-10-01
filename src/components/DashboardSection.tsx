"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, BarChart3, Clock, MoreVertical, Plus, FolderPlus, Activity, Zap } from "lucide-react";
import { useFlow } from "@/context/FlowContext";

export default function DashboardSection({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { tasks, projects } = useFlow();

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "Completed" || t.status === "Closed").length;
    const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // recent tasks
    const recentTasks = [...tasks].sort((a, b) => {
      const aTime = new Date(a.history[a.history.length-1].timestamp).getTime();
      const bTime = new Date(b.history[b.history.length-1].timestamp).getTime();
      return bTime - aTime;
    }).slice(0, 5);

    return { totalTasks, completedTasks, productivity, recentTasks };
  }, [tasks]);

  const getProjectName = (pId: string) => projects.find(p => p.id === pId)?.name || "Unknown Project";

  return (
    <>
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex justify-between items-end mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight">
            Good Morning, Developer
          </h1>
          <p className="text-zinc-500 mt-1">Here is your daily snapshot and quick actions.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400 bg-white/5 px-4 py-2 rounded-full border border-white/5">
          <Calendar size={16} className="text-indigo-400" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-4 gap-4 mb-8"
      >
        <button onClick={() => setActiveTab("My Tasks")} className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 p-4 rounded-2xl flex items-center justify-center gap-3 font-medium transition-colors group">
          <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:scale-110 transition-transform"><Plus size={18} /></div> Add New Task
        </button>
        <button onClick={() => setActiveTab("Projects")} className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center justify-center gap-3 font-medium transition-colors group">
          <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:scale-110 transition-transform"><FolderPlus size={18} /></div> New Project
        </button>
        <button onClick={() => setActiveTab("Performance")} className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 p-4 rounded-2xl flex items-center justify-center gap-3 font-medium transition-colors group">
          <div className="p-2 bg-purple-500/20 rounded-lg group-hover:scale-110 transition-transform"><Activity size={18} /></div> View Performance
        </button>
        <button onClick={() => setActiveTab("My Tasks")} className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 p-4 rounded-2xl flex items-center justify-center gap-3 font-medium transition-colors group">
          <div className="p-2 bg-amber-500/20 rounded-lg group-hover:scale-110 transition-transform"><Zap size={18} /></div> Jump to Board
        </button>
      </motion.div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {[
          { label: "Total Tasks", value: stats.totalTasks, color: "indigo" },
          { label: "Completed", value: stats.completedTasks, color: "emerald" },
          { label: "Productivity", value: `${stats.productivity}%`, color: "purple" },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 + (i * 0.1) }}
            className="bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors group relative overflow-hidden"
          >
            <div className={`absolute -inset-0 bg-gradient-to-br from-${stat.color}-500/0 via-transparent to-${stat.color}-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative z-10">
              <span className="text-zinc-400 text-sm font-medium">{stat.label}</span>
              <div className="mt-4 flex items-baseline gap-4">
                <span className="text-4xl font-semibold text-white tracking-tight">{stat.value}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Task List */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="col-span-2 bg-black/40 border border-white/5 rounded-2xl overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h2 className="text-lg font-semibold text-white">Recent Tasks</h2>
            <button onClick={() => setActiveTab("My Tasks")} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">View All</button>
          </div>
          <div className="p-2 overflow-y-auto max-h-[300px] custom-scrollbar">
            {stats.recentTasks.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">No tasks yet.</div>
            ) : (
              stats.recentTasks.map((task) => (
                <div key={task.id} onClick={() => setActiveTab("My Tasks")} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                      task.label.priority === 1 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' :
                      task.label.priority === 2 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' :
                      'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                    }`} />
                    <div>
                      <p className="text-white font-medium group-hover:text-indigo-300 transition-colors">{task.title}</p>
                      <p className="text-xs text-zinc-500 mt-1">{getProjectName(task.projectId)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 bg-black/50 px-3 py-1.5 rounded-full border border-white/5">
                      <Clock size={12} />
                      {new Date(task.history[task.history.length-1].timestamp).toLocaleDateString()}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                      task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      task.status === 'Progressing' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                    }`}>
                      {task.status}
                    </span>
                    <button className="text-zinc-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Focus Mini-widget */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold text-white">Productivity</h2>
              <BarChart3 size={20} className="text-indigo-400" />
            </div>
            
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                  <motion.circle 
                    initial={{ strokeDashoffset: 251 }}
                    animate={{ strokeDashoffset: 251 * (1 - (stats.productivity / 100)) }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.8 }}
                    cx="50" cy="50" r="40" 
                    stroke="url(#dash-gradient)" 
                    strokeWidth="8" 
                    fill="none" 
                    strokeDasharray="251" 
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="dash-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-white tracking-tighter">{stats.productivity}%</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-zinc-400 text-center leading-relaxed">
              Your overall completion rate based on total vs closed tasks. Keep pushing!
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}

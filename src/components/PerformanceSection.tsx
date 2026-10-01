"use client";

import React, { useMemo } from "react";
import { useFlow, Task } from "@/context/FlowContext";
import { motion } from "framer-motion";
import { BarChart3, Clock, AlertTriangle, Target, Zap, Activity } from "lucide-react";

export default function PerformanceSection() {
  const { tasks } = useFlow();

  // Performance Calculations
  const stats = useMemo(() => {
    let totalFocusTimeMs = 0;
    let totalScore = 0;
    let closedTaskCount = 0;
    let totalReopens = 0;

    const taskScores = [];

    tasks.forEach(task => {
      // Find lifecycle milestones
      const openedHist = task.history.find(h => h.status === "Opened" || h.status === "Progressing");
      const closedHist = task.history.find(h => h.status === "Closed");
      const reopenHists = task.history.filter(h => h.reason); // Reasons are attached when reopening

      // Reopen count
      totalReopens += reopenHists.length;

      if (openedHist && closedHist) {
        const openedTime = new Date(openedHist.timestamp).getTime();
        const closedTime = new Date(closedHist.timestamp).getTime();
        const duration = Math.max(0, closedTime - openedTime);
        totalFocusTimeMs += duration;

        // Calculate individual task score
        closedTaskCount++;
        
        // Priority weight (Priority 1 is best)
        // P1: 100, P2: 90, P3: 80, P4: 70, P5: 60
        const priorityScore = 100 - ((task.label.priority - 1) * 10);
        
        // Time bonus (faster than 24 hours = bonus, longer = slight penalty)
        const hoursSpent = duration / (1000 * 60 * 60);
        let timeMultiplier = 1.0;
        if (hoursSpent < 2) timeMultiplier = 1.2;
        else if (hoursSpent < 24) timeMultiplier = 1.0;
        else timeMultiplier = 0.8;

        // Reopen Penalty (-25% per reopen)
        const penaltyMultiplier = Math.max(0.2, 1 - (reopenHists.length * 0.25));

        let finalTaskScore = Math.round((priorityScore * timeMultiplier) * penaltyMultiplier);
        if (finalTaskScore > 100) finalTaskScore = 100;
        
        totalScore += finalTaskScore;

        taskScores.push({
          title: task.title,
          score: finalTaskScore,
          priority: task.label.priority,
          reopens: reopenHists.length
        });
      }
    });

    const averageScore = closedTaskCount > 0 ? Math.round(totalScore / closedTaskCount) : 0;
    const hours = Math.floor(totalFocusTimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalFocusTimeMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      averageScore,
      focusHours: hours,
      focusMinutes: minutes,
      closedTaskCount,
      totalReopens,
      taskScores: taskScores.sort((a, b) => b.score - a.score)
    };
  }, [tasks]);

  return (
    <div className="w-full flex flex-col h-full animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-end mb-10 shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Performance Analytics</h2>
          <p className="text-zinc-400 mt-2">Deep dive into your productivity, focus time, and task resolution quality.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        
        {/* Main Score Widget */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-1 bg-gradient-to-br from-indigo-900/20 to-purple-900/10 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden flex flex-col items-center justify-center text-center"
        >
          <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <h3 className="text-zinc-400 font-medium mb-8">Overall Performance Score</h3>
          
          <div className="relative w-48 h-48 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
              <motion.circle 
                initial={{ strokeDashoffset: 251 }}
                animate={{ strokeDashoffset: 251 * (1 - (stats.averageScore / 100)) }}
                transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
                cx="50" cy="50" r="40" 
                stroke="url(#perf-gradient)" 
                strokeWidth="8" 
                fill="none" 
                strokeDasharray="251" 
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="perf-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-bold text-white tracking-tighter">{stats.averageScore}</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest mt-2 font-semibold">
                {stats.averageScore >= 80 ? 'Excellent' : stats.averageScore >= 60 ? 'Good' : stats.averageScore > 0 ? 'Needs Focus' : 'No Data'}
              </span>
            </div>
          </div>

          <p className="text-sm text-zinc-400 leading-relaxed px-4">
            Score is calculated based on priority level completion speed, minus penalties for task reopens.
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <div className="xl:col-span-2 grid grid-cols-2 gap-6">
          
          {/* Focus Time */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black/20 border border-white/5 rounded-3xl p-6 flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-zinc-500 text-sm mb-1 font-medium">Total Focus Time</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white tracking-tight">{stats.focusHours}<span className="text-lg text-zinc-500 ml-1">h</span></span>
                <span className="text-4xl font-bold text-white tracking-tight">{stats.focusMinutes}<span className="text-lg text-zinc-500 ml-1">m</span></span>
              </div>
            </div>
          </motion.div>

          {/* Quality Control (Reopens) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/20 border border-white/5 rounded-3xl p-6 flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 mb-4 border border-rose-500/20">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-zinc-500 text-sm mb-1 font-medium">Task Reopens (Penalty)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white tracking-tight">{stats.totalReopens}</span>
                <span className="text-sm text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Quality Drops</span>
              </div>
            </div>
          </motion.div>

          {/* Tasks Completed */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/20 border border-white/5 rounded-3xl p-6 flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20">
              <Target size={24} />
            </div>
            <div>
              <p className="text-zinc-500 text-sm mb-1 font-medium">Closed Tasks Evaluated</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white tracking-tight">{stats.closedTaskCount}</span>
              </div>
            </div>
          </motion.div>

          {/* Activity Rate */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black/20 border border-white/5 rounded-3xl p-6 flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 mb-4 border border-amber-500/20">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-zinc-500 text-sm mb-1 font-medium">Efficiency Rate</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white tracking-tight">
                  {stats.closedTaskCount > 0 && stats.focusHours > 0 ? (stats.closedTaskCount / (stats.focusHours || 1)).toFixed(1) : 0}
                </span>
                <span className="text-sm text-zinc-500">tasks / hour</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Task Performance Breakdown */}
      <div className="bg-black/20 border border-white/5 rounded-3xl p-8 mb-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Activity size={18} className="text-indigo-400" />
          Task Performance Breakdown
        </h3>
        
        {stats.taskScores.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            No closed tasks to evaluate yet. Complete some tasks to generate performance data!
          </div>
        ) : (
          <div className="space-y-3">
            {stats.taskScores.map((ts, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-4 bg-[#18181b] border border-white/5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                    ts.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    ts.score >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {ts.score}
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">{ts.title}</h4>
                    <p className="text-xs text-zinc-500 mt-1">Priority {ts.priority}</p>
                  </div>
                </div>
                
                {ts.reopens > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold">
                    <AlertTriangle size={12} />
                    Reopened {ts.reopens}x
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

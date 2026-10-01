"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  CheckCircle2, 
  BarChart3, 
  Settings, 
  Bell, 
  Search, 
  Plus,
  MoreVertical,
  Calendar,
  Clock,
  Briefcase
} from "lucide-react";
import TasksSection from "@/components/TasksSection";
import ProjectsSection from "@/components/ProjectsSection";
import PerformanceSection from "@/components/PerformanceSection";
import DashboardSection from "@/components/DashboardSection";
import NotificationBell from "@/components/NotificationBell";
import { FlowProvider } from "@/context/FlowContext";

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: CheckCircle2, label: "My Tasks", active: false },
  { icon: BarChart3, label: "Performance", active: false },
  { icon: Briefcase, label: "Projects", active: false },
];

const TASKS = [
  { id: 1, title: "Design Landing Page", project: "Website Redesign", status: "In Progress", priority: "High", time: "2h remaining" },
  { id: 2, title: "Implement Auth Flow", project: "Backend API", status: "Todo", priority: "Medium", time: "Tomorrow" },
  { id: 3, title: "Create Brand Assets", project: "Marketing", status: "Completed", priority: "Low", time: "Done" },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [magicWord, setMagicWord] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (magicWord.trim().toLowerCase() === "please") {
      setIsAuthorized(true);
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setMagicWord("");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full bg-[#0a0a0a] text-zinc-100 font-sans items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md p-10 bg-[#18181b] border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col items-center text-center"
        >
          <div className="mb-8">
            <span className="font-black text-5xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 lowercase italic pr-2">
              flow.
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Halt!</h1>
          <p className="text-zinc-400 mb-8">You must say the magic word to enter FlowSpace.</p>

          <form onSubmit={handleLogin} className="w-full relative">
            <motion.div animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
              <input 
                type="text" 
                autoFocus
                value={magicWord}
                onChange={(e) => setMagicWord(e.target.value)}
                placeholder="What's the magic word?"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-6 py-4 text-center text-lg text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-600 mb-6"
              />
            </motion.div>
            <button 
              type="submit"
              className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-4 rounded-xl transition-colors shadow-lg"
            >
              Ask Nicely
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <FlowProvider>
      <div className="flex h-screen w-full bg-[#0a0a0a] text-zinc-100 font-sans overflow-hidden selection:bg-indigo-500/30">
      
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl flex flex-col justify-between"
      >
        <div className="p-6">
          <div className="flex items-center mb-12">
            <span className="font-black text-3xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 lowercase italic pr-2">
              flow.
            </span>
          </div>

          <nav className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => setActiveTab(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative ${
                    isActive ? "text-white bg-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav"
                      className="absolute inset-0 bg-white/10 rounded-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon size={18} className={`relative z-10 ${isActive ? "text-indigo-400" : "group-hover:text-zinc-200"}`} />
                  <span className="relative z-10 font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="h-9 w-9 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0">
              <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80" alt="User" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">Developer</span>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-[#0a0a0a] to-[#121214]">
        
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 shrink-0 bg-black/20 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4 w-96">
            <div className="relative w-full group">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search tasks, projects..." 
                className="w-full bg-white/5 border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-medium text-sm hover:bg-zinc-200 transition-colors">
              <Plus size={18} />
              New Task
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {activeTab === "Dashboard" && (
              <DashboardSection setActiveTab={setActiveTab} />
            )}

            {activeTab === "My Tasks" && (
              <TasksSection />
            )}

            {activeTab === "Projects" && (
              <ProjectsSection />
            )}

            {activeTab === "Performance" && (
              <PerformanceSection />
            )}

            {activeTab !== "Dashboard" && activeTab !== "My Tasks" && activeTab !== "Projects" && activeTab !== "Performance" && (
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center py-32 text-center"
              >
                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                  {React.createElement(SIDEBAR_ITEMS.find(item => item.label === activeTab)?.icon || LayoutDashboard, { size: 32, className: "text-zinc-500" })}
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight mb-2">{activeTab}</h2>
                <p className="text-zinc-500 max-w-sm">
                  This section is currently under construction. Check back soon for the full {activeTab.toLowerCase()} experience.
                </p>
              </motion.div>
            )}

          </div>
        </div>
      </main>
    </div>
    </FlowProvider>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useFlow } from "@/context/FlowContext";
import { Bell, CheckCircle2, AlertTriangle, Info, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBell() {
  const { notifications, markNotificationAsRead } = useFlow();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 transition-colors ${isOpen || unreadCount > 0 ? "text-white" : "text-zinc-400 hover:text-white"}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} New
                </span>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  You're all caught up!
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id}
                    className={`flex gap-3 p-3 rounded-xl transition-colors cursor-default ${
                      notif.read ? "opacity-60" : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {notif.type === "success" && <CheckCircle2 size={16} className="text-emerald-400" />}
                      {notif.type === "warning" && <AlertTriangle size={16} className="text-amber-400" />}
                      {notif.type === "info" && <Info size={16} className="text-indigo-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-medium text-white">{notif.title}</h4>
                        <span className="text-[10px] text-zinc-500 shrink-0">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{notif.message}</p>
                    </div>
                    {!notif.read && (
                      <button 
                        onClick={() => markNotificationAsRead(notif.id)}
                        className="shrink-0 self-center text-zinc-500 hover:text-white transition-colors p-1"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

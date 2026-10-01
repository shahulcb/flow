"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, GripVertical, History, LayoutList, LayoutGrid, Tag, AlertCircle, X, Clock, MessageSquareWarning, Filter, Trash2 } from "lucide-react";
import { useFlow, Task, Label, TaskStatus } from "@/context/FlowContext";

const COLUMNS: TaskStatus[] = ["Not Opened", "Opened", "Progressing", "Completed", "Closed"];

export default function TasksSection() {
  const { tasks, labels: availableLabels, setLabels: setAvailableLabels, projects, addTask, updateTasksBulk, addNotification, deleteTask } = useFlow();

  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [isAdding, setIsAdding] = useState(false);
  const [filterProjectId, setFilterProjectId] = useState<string>("all");
  
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<Label | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  
  // For creating a new label
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelPriority, setNewLabelPriority] = useState(3);
  
  // For reopening a closed task
  const [pendingReopen, setPendingReopen] = useState<{task: Task, destStatus: TaskStatus} | null>(null);
  const [reopenReason, setReopenReason] = useState("");

  // For viewing history
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  const displayedTasks = filterProjectId === "all" ? tasks : tasks.filter(t => t.projectId === filterProjectId);

  const handleDeleteTask = (task: Task) => {
    if (confirm(`Are you sure you want to permanently delete "${task.title}"?`)) {
      deleteTask(task.id);
      addNotification({
        title: "Task Deleted",
        message: `"${task.title}" has been permanently removed.`,
        type: "info"
      });
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const newTasks = Array.from(tasks);
    
    if (viewMode === "kanban") {
      const sourceStatus = source.droppableId as TaskStatus;
      const destStatus = destination.droppableId as TaskStatus;
      
      const sourceTasks = displayedTasks.filter(t => t.status === sourceStatus);
      const movedTask = sourceTasks[source.index];
      
      if (!movedTask) return;
      
      if (sourceStatus === destStatus) {
        // Reordering within the same column
        if (source.index === destination.index) return;
        
        const columnTasks = displayedTasks.filter(t => t.status === sourceStatus);
        
        // Reorder isolated column subset
        const [removedItem] = columnTasks.splice(source.index, 1);
        
        // Add history log for manual reordering
        removedItem.history = [...removedItem.history, { 
          status: sourceStatus, 
          timestamp: new Date().toISOString(),
          reason: "Reordered Priority" 
        }];

        columnTasks.splice(destination.index, 0, removedItem);

        // Recombine global array
        const otherTasks = newTasks.filter(t => t.status !== sourceStatus);
        const finalTasks = [...otherTasks, ...columnTasks];
        
        updateTasksBulk(finalTasks);
        return;
      }

      if (sourceStatus === "Closed" && destStatus !== "Closed") {
        if (destStatus !== "Opened") {
          addNotification({
            title: "Action Restricted",
            message: "Closed tasks can only be moved back to the 'Opened' column.",
            type: "warning"
          });
          return;
        }

        setPendingReopen({
          task: movedTask,
          destStatus
        });
        return;
      }

      const taskIndex = newTasks.findIndex(t => t.id === movedTask.id);
      newTasks[taskIndex] = { 
        ...newTasks[taskIndex], 
        status: destStatus,
        history: [...newTasks[taskIndex].history, { status: destStatus, timestamp: new Date().toISOString() }]
      };
      
    } else {
      // In a filtered list view, reordering requires careful index mapping. 
      // For simplicity in UI mockups, we'll bypass actual reordering array logic if heavily filtered, 
      // but here we just reorder the global array which might not reflect exactly right if filtered.
      const [reorderedItem] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, reorderedItem);
    }
    
    updateTasksBulk(newTasks);
  };

  const handleConfirmReopen = () => {
    if (!pendingReopen || !reopenReason.trim()) return;

    const newTasks = Array.from(tasks);
    const taskIndex = newTasks.findIndex(t => t.id === pendingReopen.task.id);
    
    newTasks[taskIndex] = {
      ...newTasks[taskIndex],
      status: pendingReopen.destStatus,
      history: [...newTasks[taskIndex].history, { 
        status: pendingReopen.destStatus, 
        timestamp: new Date().toISOString(),
        reason: reopenReason.trim()
      }]
    };

    updateTasksBulk(newTasks);
    setPendingReopen(null);
    setReopenReason("");
  };

  const handleCancelReopen = () => {
    setPendingReopen(null);
    setReopenReason("");
  };

  const handleSaveLabel = () => {
    if (!newLabelName) return;
    const newLabel: Label = { name: newLabelName, priority: newLabelPriority };
    setAvailableLabels([...availableLabels, newLabel]);
    setSelectedLabel(newLabel);
    setIsCreatingLabel(false);
    setNewLabelName("");
    setNewLabelPriority(3);
  };

  const handleAddTask = async () => {
    if (!newTaskTitle) return;
    
    const taskLabel = selectedLabel || availableLabels[0];

    await addTask({
      projectId: selectedProjectId || projects[0]?.id || "",
      title: newTaskTitle,
      label: taskLabel,
      status: "Not Opened",
      history: [{ status: "Not Opened", timestamp: new Date().toISOString() }]
    });
    
    setIsAdding(false);
    setNewTaskTitle("");
    setSelectedLabel(null);
  };

  if (!mounted) return null;

  const getLabelColor = (p: number) => {
    if (p === 1) return "text-rose-400 bg-rose-400/10 border-rose-400/20";
    if (p === 2) return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    if (p === 3) return "text-indigo-400 bg-indigo-400/10 border-indigo-400/20";
    if (p === 4) return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
  };

  const getStatusColorHex = (status: TaskStatus) => {
    switch (status) {
      case 'Completed': return '#10b981';
      case 'Progressing': return '#6366f1';
      case 'Opened': return '#3b82f6';
      case 'Closed': return '#3f3f46';
      default: return '#a1a1aa';
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})}`;
  };

  const getLastHistory = (task: Task) => {
    return task.history[task.history.length - 1];
  };

  const getProjectName = (pId: string) => {
    return projects.find(p => p.id === pId)?.name || "Unknown Project";
  };

  return (
    <div className="w-full flex flex-col h-full animate-in fade-in duration-500 overflow-hidden relative">
      
      {/* History Modal Overlay */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-start shrink-0 bg-white/[0.02]">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 leading-snug">{selectedTask.title}</h3>
                  <p className="text-xs text-indigo-400 mb-3">{getProjectName(selectedTask.projectId)}</p>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border w-fit ${getLabelColor(selectedTask.label.priority)}`}>
                      <AlertCircle size={10} /> {selectedTask.label.name} <span className="opacity-60">P{selectedTask.label.priority}</span>
                    </span>
                    <span className="text-xs text-zinc-500 font-medium px-2 py-0.5 rounded bg-black/40 border border-white/5">
                      Current Status: {selectedTask.status}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedTask(null)} className="text-zinc-500 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-400">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-transparent to-black/20">
                <h4 className="text-sm font-semibold text-zinc-400 mb-6 flex items-center gap-2">
                  <History size={16} /> Status Timeline
                </h4>
                
                <div className="space-y-6 pl-2.5 border-l-2 border-white/10 ml-2">
                  {selectedTask.history.map((hist, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative pl-6"
                    >
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-[#18181b] z-10" 
                           style={{ backgroundColor: getStatusColorHex(hist.status) }} />
                      
                      <div className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-white">{hist.status}</span>
                          <span className="text-[10px] text-zinc-500">{formatDate(hist.timestamp)}</span>
                        </div>
                        {hist.reason && (
                          <div className="mt-3 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-start gap-2 shadow-inner">
                            <MessageSquareWarning size={14} className="shrink-0 mt-0.5 text-rose-500" />
                            <div>
                              <span className="font-semibold text-rose-500 block mb-0.5">Reason for Reopening:</span>
                              <p className="leading-relaxed opacity-90">{hist.reason}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reopen Reason Modal Overlay */}
      <AnimatePresence>
        {pendingReopen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center gap-3 mb-4 text-rose-400">
                <MessageSquareWarning size={24} />
                <h3 className="text-lg font-bold text-white">Reason for Reopening</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-6">
                You are reopening "<span className="text-white font-medium">{pendingReopen.task.title}</span>" which was previously closed. Please provide a reason to continue.
              </p>
              
              <textarea 
                autoFocus
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g., The bug resurfaced in the latest build..."
                className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500 transition-colors min-h-[100px] resize-none mb-6"
              />

              <div className="flex justify-end gap-3">
                <button 
                  onClick={handleCancelReopen}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmReopen}
                  disabled={!reopenReason.trim()}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-rose-500/20"
                >
                  Confirm Reopen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header controls */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">My Tasks</h2>
          <p className="text-sm text-zinc-400 mt-1">Manage tasks across your projects.</p>
        </div>
        
        <div className="flex items-center gap-4">
          
          {/* Project Filter */}
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg">
            <Filter size={14} className="text-zinc-500" />
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className="bg-transparent text-sm text-zinc-300 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
            <button 
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <LayoutList size={18} />
            </button>
            <button 
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "kanban" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      {/* Add Task Modal overlay */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-6 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl relative shrink-0"
          >
            <button onClick={() => setIsAdding(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X size={18} />
            </button>
            <h3 className="text-lg font-semibold text-white mb-6">Create New Task</h3>
            
            <div className="space-y-5">
              
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-2 block">Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  {projects.length === 0 && <option value="">No projects available</option>}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-2 block">Task Title</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g., Fix Navigation Bug"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-2 block">Select Label (Priorities attached)</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {availableLabels.map(lbl => {
                    const isSelected = selectedLabel?.name === lbl.name;
                    return (
                      <button 
                        key={lbl.name}
                        onClick={() => setSelectedLabel(lbl)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                          isSelected 
                            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)] scale-105" 
                            : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${getLabelColor(lbl.priority).split(' ')[1].replace('/10', '')}`}></span>
                        {lbl.name} <span className="opacity-50 text-[10px] ml-1">P{lbl.priority}</span>
                      </button>
                    )
                  })}
                  <button 
                    onClick={() => setIsCreatingLabel(!isCreatingLabel)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-dashed border-white/20 text-zinc-400 hover:text-white hover:border-white/40 transition-all flex items-center gap-1"
                  >
                    <Plus size={12} /> New Label
                  </button>
                </div>

                {/* Inline Label Creator */}
                <AnimatePresence>
                  {isCreatingLabel && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-3 items-end bg-black/20 p-4 rounded-lg border border-white/5 mt-2">
                        <div className="flex-1">
                          <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 block">Label Name</label>
                          <input 
                            type="text" 
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            placeholder="e.g., Hotfix"
                          />
                        </div>
                        <div className="w-24">
                          <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 block">Priority (1-5)</label>
                          <input 
                            type="number" 
                            min="1" max="5"
                            value={newLabelPriority}
                            onChange={(e) => setNewLabelPriority(parseInt(e.target.value) || 3)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <button 
                          onClick={handleSaveLabel}
                          className="px-4 py-2 bg-indigo-500/20 text-indigo-400 font-medium rounded-lg text-sm hover:bg-indigo-500/30 border border-indigo-500/30 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  onClick={handleAddTask}
                  disabled={projects.length === 0}
                  className="px-6 py-2.5 bg-white text-black font-semibold rounded-lg text-sm hover:bg-zinc-200 transition-colors shadow-lg disabled:opacity-50"
                >
                  Create Task
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DragDropContext onDragEnd={onDragEnd}>
        {viewMode === "list" ? (
          <Droppable droppableId="list-view" type="task">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col flex-1"
              >
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-white/[0.02]">
                  <div className="col-span-1"></div>
                  <div className="col-span-5">Task</div>
                  <div className="col-span-2">Label</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Last Updated</div>
                </div>
                <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar flex-1">
                  {displayedTasks.map((task, index) => {
                    const lastHistory = getLastHistory(task);
                    return (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`grid grid-cols-12 gap-4 items-center p-3 rounded-xl transition-colors group ${snapshot.isDragging ? "bg-indigo-500/10 border border-indigo-500/30 z-50 shadow-2xl" : "bg-transparent hover:bg-white/5 border border-transparent"}`}
                          >
                            <div className="col-span-1 flex justify-center text-zinc-600 hover:text-white" {...provided.dragHandleProps}>
                              <GripVertical size={16} />
                            </div>
                            <div className="col-span-5 text-sm font-medium text-white flex flex-col">
                              <span className={`${task.status === 'Closed' ? 'line-through text-zinc-500' : ''}`}>{task.title}</span>
                              <span className="text-[10px] text-zinc-500">{getProjectName(task.projectId)}</span>
                              {lastHistory?.reason && (
                                <span className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                                  <MessageSquareWarning size={10} /> {lastHistory.reason}
                                </span>
                              )}
                            </div>
                            <div className="col-span-2 flex items-center">
                              <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border ${getLabelColor(task.label.priority)}`}>
                                <Tag size={10} /> {task.label.name} <span className="opacity-60 ml-0.5">P{task.label.priority}</span>
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className={`text-[11px] font-medium px-2 py-1 rounded-md border whitespace-nowrap ${
                                task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                task.status === 'Progressing' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                task.status === 'Opened' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                task.status === 'Closed' ? 'bg-zinc-800 text-zinc-500 border-zinc-700/50 line-through' :
                                'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                              }`}>
                                {task.status}
                              </span>
                            </div>
                            <div className="col-span-2 flex items-center justify-between gap-1.5 text-[10px] text-zinc-500 pr-2">
                              <div className="flex items-center gap-1.5">
                                <Clock size={12} />
                                {formatDate(lastHistory.timestamp)}
                              </div>
                              <div className="flex items-center gap-1">
                                {task.status === "Not Opened" && (
                                  <button onClick={() => handleDeleteTask(task)} className="text-rose-500 hover:text-rose-400 p-1.5 bg-white/5 hover:bg-rose-500/20 rounded-md transition-colors opacity-0 group-hover:opacity-100" title="Delete Task">
                                    <Trash2 size={14} />
                                  </button>
                                )}
                                <button onClick={() => setSelectedTask(task)} className="text-zinc-600 hover:text-white p-1.5 bg-white/5 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                                  <History size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                  {displayedTasks.length === 0 && (
                     <div className="text-center py-12 text-zinc-500 text-sm">No tasks found for this project.</div>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        ) : (
          <Droppable droppableId="board" direction="horizontal" type="column">
            {(boardProvided) => (
              <div 
                {...boardProvided.droppableProps}
                ref={boardProvided.innerRef}
                className="flex flex-nowrap overflow-x-auto pb-6 gap-4 h-full items-start custom-scrollbar flex-1"
              >
            {COLUMNS.map((colStatus) => {
              const colTasks = displayedTasks.filter(t => t.status === colStatus);
              
              return (
                <div key={colStatus} className="flex flex-col w-[280px] shrink-0 bg-black/20 border border-white/5 rounded-2xl overflow-hidden h-[calc(100vh-280px)]">
                  <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        colStatus === 'Completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
                        colStatus === 'Progressing' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' :
                        colStatus === 'Opened' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' :
                        colStatus === 'Closed' ? 'bg-zinc-700' :
                        'bg-zinc-400'
                      }`} />
                      <h3 className="font-semibold text-white text-sm whitespace-nowrap">{colStatus}</h3>
                    </div>
                    <span className="text-xs font-medium text-zinc-500 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                      {colTasks.length}
                    </span>
                  </div>

                  <Droppable droppableId={colStatus} type="task">
                    {(provided, snapshot) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 p-3 overflow-y-auto custom-scrollbar space-y-3 transition-colors ${snapshot.isDraggingOver ? "bg-white/5" : ""}`}
                      >
                        {colTasks.map((task, index) => {
                          const lastHistory = getLastHistory(task);
                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snap) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-[#18181b] border border-white/10 rounded-xl p-4 transition-all group ${snap.isDragging ? "rotate-2 scale-105 shadow-2xl shadow-black ring-1 ring-indigo-500/50 z-50" : "hover:border-white/20 hover:shadow-lg"} ${task.status === 'Closed' ? 'opacity-50' : ''}`}
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border ${getLabelColor(task.label.priority)}`}>
                                      <AlertCircle size={10} /> {task.label.name} <span className="opacity-60">P{task.label.priority}</span>
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {task.status === "Not Opened" && (
                                        <button 
                                          onClick={() => handleDeleteTask(task)} 
                                          className="text-rose-500 hover:bg-rose-500/20 bg-rose-500/10 p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                          title="Delete Task"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => setSelectedTask(task)} 
                                        className="text-zinc-500 hover:bg-white/10 bg-white/5 p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                      >
                                        <History size={14} />
                                      </button>
                                    </div>
                                  </div>
                                  <h4 className={`text-sm font-medium text-white mb-1 leading-snug ${task.status === 'Closed' ? 'line-through text-zinc-400' : ''}`}>{task.title}</h4>
                                  <p className="text-[10px] text-indigo-400 mb-3">{getProjectName(task.projectId)}</p>
                                  
                                  {/* Last updated & Reason section */}
                                  <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-white/5">
                                    {lastHistory?.reason && (
                                      <p className="text-[10px] text-rose-400 flex items-start gap-1 leading-tight">
                                        <MessageSquareWarning size={12} className="shrink-0 mt-0.5" />
                                        <span>{lastHistory.reason}</span>
                                      </p>
                                    )}
                                    <div className="flex justify-between items-center text-[10px] text-zinc-500">
                                      <span className="flex items-center gap-1"><Clock size={10}/> {formatDate(lastHistory.timestamp)}</span>
                                      <div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border border-black shadow-sm" />
                                    </div>
                                  </div>

                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
            {boardProvided.placeholder}
          </div>
          )}
          </Droppable>
        )}
      </DragDropContext>
    </div>
  );
}

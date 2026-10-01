"use client";

import React, { useState } from "react";
import { useFlow, Project, Task, Label } from "@/context/FlowContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MoreVertical, Edit2, Trash2, X, Folder, Calendar, Activity, CheckCircle2, PauseCircle, ArrowLeft, Clock, Tag } from "lucide-react";

export default function ProjectsSection() {
  const { projects, tasks, labels, loading, addProject, updateProject, deleteProject, addTask } = useFlow();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Project["status"]>("Active");

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // For viewing a specific project's details
  const [viewProjectId, setViewProjectId] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskLabel, setQuickTaskLabel] = useState<Label | null>(null);

  const openAdd = () => {
    setName("");
    setDescription("");
    setStatus("Active");
    setEditingProject(null);
    setIsAdding(true);
    setActiveMenuId(null);
  };

  const openEdit = (p: Project) => {
    setName(p.name);
    setDescription(p.description);
    setStatus(p.status);
    setEditingProject(p);
    setIsAdding(true);
    setActiveMenuId(null);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    if (editingProject) {
      await updateProject({ ...editingProject, name, description, status });
    } else {
      await addProject({ name, description, status });
    }
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this project? All associated tasks will be removed.")) {
      await deleteProject(id);
      if (viewProjectId === id) setViewProjectId(null);
    }
    setActiveMenuId(null);
  };

  const getStatusIcon = (s: Project["status"]) => {
    if (s === "Active") return <Activity size={14} className="text-indigo-400" />;
    if (s === "Completed") return <CheckCircle2 size={14} className="text-emerald-400" />;
    return <PauseCircle size={14} className="text-amber-400" />;
  };

  const getStatusColor = (s: Project["status"]) => {
    if (s === "Active") return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    if (s === "Completed") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  };

  const handleQuickAddTask = async (projectId: string) => {
    if (!quickTaskTitle.trim()) return;
    await addTask({
      projectId,
      title: quickTaskTitle,
      label: quickTaskLabel || labels[0],
      status: "Not Opened",
      history: [{ status: "Not Opened", timestamp: new Date().toISOString() }]
    });
    setQuickTaskTitle("");
    setQuickTaskLabel(null);
  };

  const getLabelColor = (p: number) => {
    if (p === 1) return "text-rose-400 bg-rose-400/10 border-rose-400/20";
    if (p === 2) return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    if (p === 3) return "text-indigo-400 bg-indigo-400/10 border-indigo-400/20";
    if (p === 4) return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
  };

  // --- Project Details View ---
  if (viewProjectId) {
    const project = projects.find(p => p.id === viewProjectId);
    if (!project) {
      setViewProjectId(null);
      return null;
    }

    const projectTasks = tasks.filter(t => t.projectId === project.id);
    const completedTasks = projectTasks.filter(t => t.status === "Completed").length;
    const progress = projectTasks.length === 0 ? 0 : Math.round((completedTasks / projectTasks.length) * 100);

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full flex flex-col h-full overflow-hidden"
      >
        <button 
          onClick={() => setViewProjectId(null)}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-6 w-fit"
        >
          <ArrowLeft size={16} /> Back to Projects
        </button>

        <div className="bg-black/20 border border-white/5 rounded-3xl p-8 mb-8 shrink-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight mb-2">{project.name}</h2>
              <div className={`flex items-center gap-1.5 text-xs uppercase font-bold w-fit px-2.5 py-1 rounded-md border ${getStatusColor(project.status)}`}>
                {getStatusIcon(project.status)} {project.status}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(project)} className="p-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(project.id)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-lg transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <p className="text-zinc-400 mb-8 max-w-2xl">{project.description}</p>
          
          <div className="max-w-md">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-zinc-400">Project Progress</span>
              <span className="text-sm font-bold text-white">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col bg-black/20 border border-white/5 rounded-3xl p-8">
          <h3 className="text-xl font-bold text-white mb-6">Tasks ({projectTasks.length})</h3>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-6 pr-2">
            {projectTasks.map(task => (
              <div key={task.id} className="bg-[#18181b] border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-white/10 transition-colors">
                <div>
                  <h4 className={`text-sm font-medium text-white mb-2 ${task.status === 'Closed' ? 'line-through text-zinc-500' : ''}`}>{task.title}</h4>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${getLabelColor(task.label.priority)}`}>
                      <Tag size={10} /> {task.label.name}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                      task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      task.status === 'Progressing' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      task.status === 'Opened' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      task.status === 'Closed' ? 'bg-zinc-800 text-zinc-500 border-zinc-700/50 line-through' :
                      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Clock size={12} />
                  {new Date(task.history[task.history.length-1].timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
            {projectTasks.length === 0 && (
              <div className="text-center py-12 text-zinc-500 text-sm">
                No tasks added to this project yet.
              </div>
            )}
          </div>

          <div className="shrink-0 pt-4 border-t border-white/5 flex flex-col gap-3">
            
            {/* Inline Label Picker */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium text-zinc-500 flex items-center mr-2">Label:</span>
              {labels.map(lbl => {
                const isSelected = quickTaskLabel?.name === lbl.name;
                return (
                  <button 
                    key={lbl.name}
                    onClick={() => setQuickTaskLabel(isSelected ? null : lbl)}
                    className={`text-[10px] font-medium px-2 py-1 rounded-md border transition-all flex items-center gap-1 ${
                      isSelected 
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 scale-105" 
                        : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${getLabelColor(lbl.priority).split(' ')[1].replace('/10', '')}`}></span>
                    {lbl.name}
                  </button>
                )
              })}
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleQuickAddTask(project.id); }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Quick add a new task..."
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button 
                type="submit"
                disabled={!quickTaskTitle.trim()}
                className="absolute right-2 p-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <Plus size={16} />
              </button>
            </form>
          </div>
        </div>

      </motion.div>
    );
  }

  // --- Main Projects Grid View ---
  return (
    <div className="w-full flex flex-col h-full animate-in fade-in duration-500 relative">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Projects</h2>
          <p className="text-sm text-zinc-400 mt-1">Manage your workspaces and high-level goals.</p>
        </div>
        
        <button 
          onClick={openAdd}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* Add / Edit Modal Overlay */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-md relative"
            >
              <button onClick={() => setIsAdding(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                <X size={18} />
              </button>
              <h3 className="text-lg font-semibold text-white mb-6">{editingProject ? "Edit Project" : "Create New Project"}</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-2 block">Project Name</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g., Mobile App Launch"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-2 block">Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors min-h-[100px] resize-none"
                    placeholder="Brief details about the project..."
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-2 block">Status</label>
                  <div className="flex gap-3">
                    {["Active", "Paused", "Completed"].map(s => (
                      <button
                        key={s}
                        onClick={() => setStatus(s as Project["status"])}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                          status === s 
                            ? getStatusColor(s as Project["status"]) + " shadow-md"
                            : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {getStatusIcon(s as Project["status"])}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-white text-black font-semibold rounded-lg text-sm hover:bg-zinc-200 transition-colors shadow-lg"
                  >
                    {editingProject ? "Save Changes" : "Create Project"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-8 custom-scrollbar">
        {projects.map((project) => {
          const projectTasks = tasks.filter(t => t.projectId === project.id);
          const completedTasks = projectTasks.filter(t => t.status === "Completed").length;
          const progress = projectTasks.length === 0 ? 0 : Math.round((completedTasks / projectTasks.length) * 100);

          return (
            <motion.div 
              layout
              key={project.id}
              onClick={() => setViewProjectId(project.id)}
              className="bg-black/20 border border-white/5 hover:border-indigo-500/30 transition-all rounded-2xl p-6 relative group cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/10"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Folder size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg leading-tight group-hover:text-indigo-300 transition-colors">{project.name}</h3>
                    <div className={`flex items-center gap-1 text-[10px] uppercase font-bold mt-1 ${
                      project.status === 'Active' ? 'text-indigo-400' :
                      project.status === 'Completed' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {getStatusIcon(project.status)} {project.status}
                    </div>
                  </div>
                </div>

                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === project.id ? null : project.id)}
                    className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {activeMenuId === project.id && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-36 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-30"
                      >
                        <button 
                          onClick={() => openEdit(project)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(project.id)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <p className="text-sm text-zinc-400 mb-6 line-clamp-2 min-h-[40px]">
                {project.description}
              </p>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-medium text-zinc-500">Progress</span>
                  <span className="text-xs font-bold text-white">{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
                <span className="bg-black/40 px-2 py-1 rounded border border-white/5">
                  {projectTasks.length} Tasks
                </span>
              </div>
            </motion.div>
          );
        })}
        {projects.length === 0 && !isAdding && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-zinc-600">
              <Folder size={32} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-zinc-500 max-w-sm mb-6">Create a project to start organizing your tasks and tracking your team's progress.</p>
            <button 
              onClick={openAdd}
              className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              Create First Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

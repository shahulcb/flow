"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchAllData, saveProject as apiSaveProject, removeProject as apiRemoveProject, saveTask as apiSaveTask, removeTask as apiRemoveTask, bulkSaveTasks as apiBulkSaveTasks } from "@/actions/flowActions";

export type TaskStatus = "Not Opened" | "Opened" | "Progressing" | "Completed" | "Closed";

export type Label = {
  name: string;
  priority: number;
};

export type StatusChange = {
  status: TaskStatus;
  timestamp: string;
  reason?: string;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "info" | "warning" | "success";
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  label: Label;
  status: TaskStatus;
  order?: number;
  history: StatusChange[];
};

export type Project = {
  id: string;
  name: string;
  description: string;
  status: "Active" | "Paused" | "Completed";
  createdAt: string;
};

const DEFAULT_LABELS: Label[] = [
  { name: "Bug", priority: 1 },
  { name: "Urgent", priority: 1 },
  { name: "Feature", priority: 2 },
  { name: "Backend", priority: 3 },
  { name: "Design", priority: 3 },
  { name: "Docs", priority: 5 },
];

type FlowContextType = {
  projects: Project[];
  tasks: Task[];
  labels: Label[];
  setLabels: React.Dispatch<React.SetStateAction<Label[]>>;
  loading: boolean;
  addProject: (p: Omit<Project, "id" | "createdAt">) => Promise<void>;
  updateProject: (p: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTask: (t: Omit<Task, "id">) => Promise<void>;
  updateTask: (t: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTasksBulk: (tasks: Task[]) => Promise<void>;
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  addNotification: (n: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
};

const FlowContext = createContext<FlowContextType | undefined>(undefined);

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [labels, setLabels] = useState<Label[]>(DEFAULT_LABELS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Keep a ref of tasks for the interval without triggering re-renders
  const tasksRef = React.useRef(tasks);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  useEffect(() => {
    // Request native push notification permissions if not already granted or denied
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    fetchAllData().then(data => {
      if (data.projects) setProjects(data.projects);
      if (data.tasks) setTasks(data.tasks);
      setLoading(false);
      
      // Welcome notification
      setNotifications([{
        id: `n-welcome`,
        title: "Welcome Back",
        message: "Your workspace is ready. Let's get things done!",
        timestamp: new Date().toISOString(),
        read: false,
        type: "success"
      }]);
    });

    // Background engine: Check task states and remind every 2 minutes
    const interval = setInterval(() => {
      const currentTasks = tasksRef.current;
      const notOpened = currentTasks.filter(t => t.status === "Not Opened");
      const progressing = currentTasks.filter(t => t.status === "Progressing");
      
      if (notOpened.length > 0) {
        addNotification({
          title: "Tasks Waiting",
          message: `You have ${notOpened.length} tasks sitting in "Not Opened". Time to pick one up!`,
          type: "warning"
        });
      }
      
      if (progressing.length > 0) {
        addNotification({
          title: "Status Check-in",
          message: `You have ${progressing.length} tasks currently progressing. Remember to update them if completed!`,
          type: "info"
        });
      }
    }, 120000); // 2 mins

    return () => clearInterval(interval);
  }, []);

  const addNotification = (n: Omit<AppNotification, "id" | "timestamp" | "read">) => {
    setNotifications(prev => [{
      ...n,
      id: `n-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false
    }, ...prev].slice(0, 50)); // Keep last 50

    // Fire actual OS-level Push Notification
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(n.title, {
        body: n.message,
        silent: false
      });
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const addProject = async (p: Omit<Project, "id" | "createdAt">) => {
    const tempId = `temp-${Date.now()}`;
    const newProj = { ...p, id: tempId, createdAt: new Date().toISOString() } as Project;
    setProjects(prev => [...prev, newProj]);
    
    const savedProj = await apiSaveProject(newProj);
    setProjects(prev => prev.map(pr => pr.id === tempId ? savedProj : pr));
  };

  const updateProject = async (p: Project) => {
    setProjects(prev => prev.map(pr => pr.id === p.id ? p : pr));
    await apiSaveProject(p);
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(pr => pr.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
    await apiRemoveProject(id);
  };

  const addTask = async (t: Omit<Task, "id">) => {
    const tempId = `temp-${Date.now()}`;
    const newTask = { ...t, id: tempId } as Task;
    setTasks(prev => [...prev, newTask]);
    
    const savedTask = await apiSaveTask(newTask);
    setTasks(prev => prev.map(tk => tk.id === tempId ? savedTask : tk));
    
    addNotification({
      title: "Task Created",
      message: `"${newTask.title}" has been successfully created.`,
      type: "success"
    });
  };

  const updateTask = async (t: Task) => {
    setTasks(prev => prev.map(tk => tk.id === t.id ? t : tk));
    await apiSaveTask(t);
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(tk => tk.id !== id));
    await apiRemoveTask(id);
  };

  const updateTasksBulk = async (newTasksList: Task[]) => {
    // Determine if any task actually changed status
    const changedTask = newTasksList.find(nT => {
      const oldT = tasks.find(t => t.id === nT.id);
      return oldT && oldT.status !== nT.status;
    });

    // Assign explicit ordering to the array based on their visual order
    const updatedOrderedTasks = newTasksList.map((t, index) => ({
      ...t,
      order: index
    }));
    
    setTasks(updatedOrderedTasks);
    
    if (changedTask) {
      addNotification({
        title: "Status Updated",
        message: `Task moved to ${changedTask.status}.`,
        type: "info"
      });
    }

    // Always bulk save to ensure order gets updated in backend
    await apiBulkSaveTasks(updatedOrderedTasks);
  };

  return (
    <FlowContext.Provider value={{ 
      projects, tasks, labels, setLabels, loading, 
      addProject, updateProject, deleteProject, 
      addTask, updateTask, deleteTask, updateTasksBulk,
      notifications, addNotification, markNotificationAsRead
    }}>
      {children}
    </FlowContext.Provider>
  );
}

export function useFlow() {
  const context = useContext(FlowContext);
  if (!context) throw new Error("useFlow must be used within a FlowProvider");
  return context;
}

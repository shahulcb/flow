"use server";
import connectToDatabase from '@/lib/mongodb';
import { Project } from '@/models/Project';
import { Task } from '@/models/Task';

export async function fetchAllData() {
  try {
    await connectToDatabase();
    const projects = await Project.find({});
    const tasks = await Task.find({}).sort({ order: 1 });
    
    return {
      projects: projects.map(p => ({
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        status: p.status,
        createdAt: p.createdAt.toISOString()
      })),
      tasks: tasks.map(t => ({
        id: t._id.toString(),
        projectId: t.projectId.toString(),
        title: t.title,
        label: {
          name: t.label?.name || 'Bug',
          priority: t.label?.priority || 1
        },
        status: t.status,
        order: t.order || 0,
        history: t.history.map((h: any) => ({
          status: h.status,
          timestamp: h.timestamp.toISOString(),
          reason: h.reason
        }))
      }))
    };
  } catch (error) {
    console.error("Failed to fetch data", error);
    return { projects: [], tasks: [] };
  }
}

export async function saveProject(data: any) {
  await connectToDatabase();
  if (data.id && data.id.length === 24) {
    const { id, ...updateData } = data;
    await Project.findByIdAndUpdate(id, updateData);
    return data;
  } else {
    const { id, ...createData } = data;
    const p = await Project.create(createData);
    return { ...data, id: p._id.toString(), createdAt: p.createdAt.toISOString() };
  }
}

export async function removeProject(id: string) {
  await connectToDatabase();
  await Project.findByIdAndDelete(id);
  await Task.deleteMany({ projectId: id });
  return true;
}

export async function saveTask(data: any) {
  await connectToDatabase();
  if (data.id && data.id.length === 24) {
    const { id, ...updateData } = data;
    await Task.findByIdAndUpdate(id, updateData);
    return data;
  } else {
    const { id, ...createData } = data;
    const t = await Task.create(createData);
    return { ...data, id: t._id.toString() };
  }
}

export async function removeTask(id: string) {
  await connectToDatabase();
  await Task.findByIdAndDelete(id);
  return true;
}

export async function bulkSaveTasks(tasksData: any[]) {
  await connectToDatabase();
  const bulkOps = tasksData.map(t => ({
    updateOne: {
      filter: { _id: t.id },
      update: { $set: { status: t.status, order: t.order, history: t.history } }
    }
  }));
  if (bulkOps.length > 0) {
    await Task.bulkWrite(bulkOps);
  }
  return true;
}

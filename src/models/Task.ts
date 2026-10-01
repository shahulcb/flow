import mongoose from 'mongoose';

const StatusChangeSchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, required: true },
  reason: { type: String }
}, { _id: false });

const TaskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  label: { 
    name: String,
    priority: Number
  },
  status: { type: String, default: 'Not Opened' },
  history: [StatusChangeSchema]
}, { timestamps: true });

export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

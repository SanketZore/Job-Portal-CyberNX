import mongoose, { Document } from 'mongoose';

export interface IJob extends Document {
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
  requirements: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  employer: mongoose.Types.ObjectId;
  status: 'open' | 'closed' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: {
      type: String,
      required: true,
    },
    salary: {
      min: {
        type: Number,
        required: true,
      },
      max: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        required: true,
        default: 'USD',
      },
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'draft'],
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
);

// Index for search functionality
jobSchema.index({ title: 'text', company: 'text', description: 'text' });

export default mongoose.model<IJob>('Job', jobSchema); 
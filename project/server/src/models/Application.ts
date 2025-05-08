import mongoose, { Document } from 'mongoose';

export interface IApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  applicantId: mongoose.Types.ObjectId;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  coverLetter: string;
  resumeUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'accepted', 'rejected'],
      default: 'pending',
    },
    coverLetter: {
      type: String,
      required: true,
    },
    resumeUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate applications
applicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

export default mongoose.model<IApplication>('Application', applicationSchema); 
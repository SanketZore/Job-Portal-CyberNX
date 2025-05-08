export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  postedDate: string;
  category: string;
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: 'pending' | 'reviewed' | 'rejected' | 'accepted';
  appliedDate: string;
  coverLetter: string;
  resume: string;
}

export type UserRole = 'employer' | 'jobseeker';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'employer' | 'jobseeker';
  company?: string;
}

export interface JobListing {
  _id: string;
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
  employer: string;
  status: 'open' | 'closed' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  _id: string;
  jobId: string;
  job: JobListing;
  applicantId: string;
  applicant: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  coverLetter: string;
  resumeUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}
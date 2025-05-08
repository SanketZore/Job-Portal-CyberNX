
export const API_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : `http://localhost:${import.meta.env.VITE_API_PORT}/api`;

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me',
  },
  jobs: {
    list: '/jobs',
    create: '/jobs',
    getOne: (id: string) => `/jobs/${id}`,
    update: (id: string) => `/jobs/${id}`,
    delete: (id: string) => `/jobs/${id}`,
    employerJobs: '/employer/jobs',
  },
  applications: {
    list: '/applications',
    create: '/applications',
    getOne: (id: string) => `/applications/${id}`,
    update: (id: string) => `/applications/${id}`,
    delete: (id: string) => `/applications/${id}`,
    myApplications: '/applications/my-applications',
    employerApplications: (jobId: string) => `/applications/job/${jobId}`,
  },
};

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, CheckCircle2, Clock, AlertCircle, Eye } from 'lucide-react';
import { JobListing, JobApplication } from '../../types';
import { API_URL } from '../../config/api';

const EmployerDashboard = () => {
  const location = useLocation();
  const [view, setView] = useState<'applications' | 'jobs'>(() => {
    // Initialize from localStorage or default to 'jobs'
    return (localStorage.getItem('employerDashboardView') as 'applications' | 'jobs') || 'jobs';
  });
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingJob, setDeletingJob] = useState<string | null>(null);

  // Update localStorage when view changes
  useEffect(() => {
    localStorage.setItem('employerDashboardView', view);
  }, [view]);

  // Handle route changes
  useEffect(() => {
    const currentPath = location.pathname;
    const isDashboardSubpage = currentPath.startsWith('/employer/jobs/') || 
                             currentPath.startsWith('/employer/applications/');
    
    // Only reset to jobs view if we're coming from a completely different route
    // and not from a dashboard subpage
    if (!isDashboardSubpage && !currentPath.includes('/employer/')) {
      setView('jobs');
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        setLoading(true);
        if (view === 'jobs') {
          const response = await fetch(`${API_URL}/jobs/employer/jobs`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          const data = await response.json();
          console.log('Jobs API Response:', data);
          if (data.success) {
            setJobs(data.data);
          } else {
            throw new Error(data.message || 'Failed to fetch jobs');
          }
        } else {
          console.log('Fetching applications...');
          const response = await fetch(`${API_URL}/applications/employer/applications`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          const data = await response.json();
          console.log('Applications API Response:', data);
          if (data.success) {
            console.log('Setting applications:', data.data);
            setApplications(data.data);
          } else {
            throw new Error(data.message || 'Failed to fetch applications');
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [view]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'reviewed':
        return <Eye className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-status-pending-light dark:bg-status-pending-dark text-status-pending-text-light dark:text-status-pending-text-dark';
      case 'reviewed':
        return 'bg-status-reviewed-light dark:bg-status-reviewed-dark text-status-reviewed-text-light dark:text-status-reviewed-text-dark';
      case 'accepted':
        return 'bg-status-accepted-light dark:bg-status-accepted-dark text-status-accepted-text-light dark:text-status-accepted-text-dark';
      case 'rejected':
        return 'bg-status-rejected-light dark:bg-status-rejected-dark text-status-rejected-text-light dark:text-status-rejected-text-dark';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: 'pending' | 'reviewed' | 'accepted' | 'rejected') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      setUpdatingStatus(applicationId);
      const response = await fetch(`${API_URL}/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Application not found. It may have been deleted.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to update this application.');
        } else {
          throw new Error(data.message || 'Failed to update status');
        }
      }

      // Update the applications list with the new status
      setApplications(prevApplications =>
        prevApplications.map(app =>
          app._id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      setDeletingJob(jobId);
      const response = await fetch(`${API_URL}/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete job');
      }

      // Remove the deleted job from the list
      setJobs(prevJobs => prevJobs.filter(job => job._id !== jobId));
    } catch (err) {
      console.error('Error deleting job:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    } finally {
      setDeletingJob(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-light dark:border-primary-dark"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">Employer Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              value={view}
              onChange={(e) => setView(e.target.value as 'applications' | 'jobs')}
              className="appearance-none bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark text-text-light-primary dark:text-text-dark-primary"
            >
              <option value="jobs">Jobs Created</option>
              <option value="applications">Applications</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-light-tertiary dark:text-text-dark-tertiary pointer-events-none" />
          </div>
          <Link
            to="/employer/post-job"
            className="bg-primary-light dark:bg-primary-dark text-white px-4 py-2 rounded-lg hover:bg-primary dark:hover:bg-primary transition-colors shadow-sm"
          >
            Post New Job
          </Link>
        </div>
      </div>

      {view === 'applications' ? (
        <div className="bg-surface-light dark:bg-surface-dark shadow-lg rounded-lg border border-border-light dark:border-border-dark">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-text-light-primary dark:text-text-dark-primary">Applications</h2>
            {applications.length === 0 ? (
              <p className="text-text-light-tertiary dark:text-text-dark-tertiary">No applications found.</p>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div
                    key={application._id}
                    className="bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-text-light-primary dark:text-text-dark-primary">{application.job.title}</h3>
                        <p className="text-text-light-secondary dark:text-text-dark-secondary">{application.job.company}</p>
                        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                          Applicant: {application.applicant.name}
                        </p>
                        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                          Applied on: {new Date(application.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <select
                            value={application.status}
                            onChange={(e) => handleStatusUpdate(application._id, e.target.value as 'pending' | 'reviewed' | 'accepted' | 'rejected')}
                            disabled={updatingStatus === application._id}
                            className={`appearance-none bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark text-text-light-primary dark:text-text-dark-primary ${
                              updatingStatus === application._id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center space-x-1">
                            <div className={getStatusColor(application.status)}>
                              {getStatusIcon(application.status)}
                            </div>
                            <ChevronDown className="h-4 w-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
                          </div>
                        </div>
                        <Link
                          to={`/employer/applications/${application._id}`}
                          className="text-primary-light dark:text-primary-dark hover:text-primary dark:hover:text-primary text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-surface-light dark:bg-surface-dark shadow-lg rounded-lg border border-border-light dark:border-border-dark">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-text-light-primary dark:text-text-dark-primary">Jobs Created</h2>
            {jobs.length === 0 ? (
              <p className="text-text-light-tertiary dark:text-text-dark-tertiary">No jobs posted yet.</p>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job._id}
                    className="bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-text-light-primary dark:text-text-dark-primary">{job.title}</h3>
                        <p className="text-text-light-secondary dark:text-text-dark-secondary">{job.company}</p>
                        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                          Location: {job.location}
                        </p>
                        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                          Posted on: {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Link
                          to={`/employer/jobs/${job._id}`}
                          className="text-primary-light dark:text-primary-dark hover:text-primary dark:hover:text-primary text-sm font-medium"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleDeleteJob(job._id)}
                          disabled={deletingJob === job._id}
                          className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingJob === job._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard; 
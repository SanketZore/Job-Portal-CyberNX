import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { JobApplication } from '../../types';
import { apiRequest } from '../../utils/api';
import { API_ENDPOINTS } from '../../config/api';
import { AlertCircle, RefreshCw, Loader2, X } from 'lucide-react';

const JobSeekerDashboard = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [applicationToWithdraw, setApplicationToWithdraw] = useState<JobApplication | null>(null);
  const maxRetries = 3;

  const fetchApplications = async (isRetry = false) => {
    try {
      if (!isAuthenticated || !user) {
        throw new Error('Please log in to view your applications');
      }

      if (!isRetry) {
        setLoading(true);
        setError('');
      }

      const response = await apiRequest<JobApplication[]>(
        API_ENDPOINTS.applications.myApplications,
        { requiresAuth: true }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch applications');
      }

      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format from server');
      }

      setApplications(response.data);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error fetching applications:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch applications';
      setError(errorMessage);

      // Handle session expiration
      if (errorMessage.includes('session has expired') || errorMessage.includes('log in')) {
        logout();
        navigate('/login');
        return;
      }

      // Implement retry logic
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchApplications(true), 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [isAuthenticated, user]);

  const handleWithdrawClick = (application: JobApplication) => {
    setApplicationToWithdraw(application);
    setShowConfirmModal(true);
  };

  const handleConfirmWithdraw = async () => {
    if (!applicationToWithdraw) return;
    
    try {
      setWithdrawingId(applicationToWithdraw._id);
      setError('');

      const response = await apiRequest(
        API_ENDPOINTS.applications.delete(applicationToWithdraw._id),
        {
          method: 'DELETE',
          requiresAuth: true
        }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to withdraw application');
      }

      setApplications(prev => prev.filter(app => app._id !== applicationToWithdraw._id));
      setShowConfirmModal(false);
      setApplicationToWithdraw(null);
    } catch (err) {
      console.error('Error withdrawing application:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to withdraw application';
      setError(errorMessage);

      if (errorMessage.includes('session has expired') || errorMessage.includes('log in')) {
        logout();
        navigate('/login');
      }
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleCancelWithdraw = () => {
    setShowConfirmModal(false);
    setApplicationToWithdraw(null);
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchApplications();
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Loading your applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
          <div className="flex items-center space-x-4">
            {error.includes('session has expired') || error.includes('log in') ? (
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center text-red-700 hover:text-red-800"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Log In Again
              </button>
            ) : (
              <button
                onClick={handleRetry}
                className="flex items-center text-red-700 hover:text-red-800"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                {retryCount < maxRetries ? 'Retry' : 'Try Again'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Job Seeker Dashboard</h1>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Applications</h2>
          
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No applications found. Start applying for jobs!</p>
              <Link
                to="/jobs"
                className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Browse Available Jobs
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <div
                  key={application._id}
                  className="border rounded p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium">{application.job.title}</h3>
                      <p className="text-gray-600">{application.job.company}</p>
                      <p className="text-sm text-gray-500">
                        Location: {application.job.location}
                      </p>
                      <p className="text-sm text-gray-500">
                        Applied on: {new Date(application.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          application.status
                        )}`}
                      >
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-4">
                    <Link
                      to={`/jobs/${application.jobId}`}
                      className="text-blue-500 hover:text-blue-600 text-sm"
                    >
                      View Job Details
                    </Link>
                    <button
                      onClick={() => handleWithdrawClick(application)}
                      className="text-red-500 hover:text-red-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={withdrawingId === application._id}
                    >
                      {withdrawingId === application._id ? (
                        <span className="flex items-center">
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Withdrawing...
                        </span>
                      ) : (
                        'Withdraw Application'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && applicationToWithdraw && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Confirm Withdrawal</h3>
              <button
                onClick={handleCancelWithdraw}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to withdraw your application for{' '}
              <span className="font-medium">{applicationToWithdraw.job.title}</span> at{' '}
              <span className="font-medium">{applicationToWithdraw.job.company}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelWithdraw}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWithdraw}
                disabled={withdrawingId === applicationToWithdraw._id}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawingId === applicationToWithdraw._id ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Withdrawing...
                  </span>
                ) : (
                  'Withdraw Application'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSeekerDashboard; 
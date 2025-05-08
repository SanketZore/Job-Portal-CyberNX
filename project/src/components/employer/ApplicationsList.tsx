import React, { useState, useEffect } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { API_ENDPOINTS } from '../../config/api';

interface Application {
  _id: string;
  jobId: string;
  jobseeker: {
    _id: string;
    name: string;
    email: string;
  };
  coverLetter: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface ApplicationsListProps {
  jobId: string;
}

function ApplicationsList({ jobId }: ApplicationsListProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApplications = async () => {
    try {
      const response = await apiRequest<Application[]>(
        `${API_ENDPOINTS.applications.list}?jobId=${jobId}`,
        { requiresAuth: true }
      );

      if (response.success && response.data) {
        setApplications(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch applications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching applications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const handleStatusUpdate = async (applicationId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const response = await apiRequest(
        API_ENDPOINTS.applications.update(applicationId),
        {
          method: 'PUT',
          requiresAuth: true,
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.success) {
        // Refresh applications list
        fetchApplications();
      } else {
        throw new Error(response.message || 'Failed to update application status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating application status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="p-4 bg-gray-100 text-gray-700 rounded-lg">
        No applications received yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <div
          key={application._id}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{application.jobseeker.name}</h3>
              <p className="text-gray-500">{application.jobseeker.email}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-medium mb-2">Cover Letter</h4>
            <p className="text-gray-600 whitespace-pre-line">{application.coverLetter}</p>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Applied {new Date(application.createdAt).toLocaleDateString()}
            </span>

            {application.status === 'pending' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStatusUpdate(application._id, 'accepted')}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </button>
                <button
                  onClick={() => handleStatusUpdate(application._id, 'rejected')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition flex items-center"
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ApplicationsList; 
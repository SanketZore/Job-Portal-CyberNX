import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, FileText, Calendar, ExternalLink } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { API_ENDPOINTS } from '../../config/api';
import { JobApplication } from '../../types';

const ApplicationDetails = () => {
  const { id } = useParams();
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const response = await apiRequest<JobApplication>(
          API_ENDPOINTS.applications.getOne(id || ''),
          { requiresAuth: true }
        );

        if (response.success && response.data) {
          setApplication(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch application details');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch application details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchApplication();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error || 'Application not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          to="/employer/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Application Details</h1>

          {/* Job Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Job Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">{application.job.title}</h3>
              <p className="text-gray-600">{application.job.company}</p>
            </div>
          </div>

          {/* Applicant Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Applicant Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-500 mr-3" />
                <div>
                  <p className="font-medium">{application.applicant.name}</p>
                  <p className="text-sm text-gray-500">Applicant</p>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-500 mr-3" />
                <div>
                  <p className="font-medium">{application.applicant.email}</p>
                  <p className="text-sm text-gray-500">Email Address</p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-500 mr-3" />
                <div>
                  <p className="font-medium">
                    {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">Applied Date</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Cover Letter</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="whitespace-pre-line">{application.coverLetter}</p>
            </div>
          </div>

          {/* Resume */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Resume</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <a
                href={application.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-700"
              >
                <FileText className="w-5 h-5 mr-2" />
                View Resume
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>

          {/* Application Status */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Application Status</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                application.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetails; 
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';
import { JobListing, JobApplication } from '../types';
import { Loader2, Send, Building2, MapPin, Briefcase, DollarSign, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const JobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [application, setApplication] = useState<JobApplication | null>(null);
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    const fetchJobAndApplication = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch job details
        const jobResponse = await apiRequest<JobListing>(
          API_ENDPOINTS.jobs.getOne(id || ''),
          { requiresAuth: true }
        );

        if (!jobResponse.success || !jobResponse.data) {
          throw new Error(jobResponse.message || 'Failed to fetch job details');
        }

        setJob(jobResponse.data);

        // If user is a jobseeker, fetch their application status
        if (currentUser?.role === 'jobseeker') {
          try {
            const applicationResponse = await apiRequest<JobApplication[]>(
              API_ENDPOINTS.applications.myApplications,
              { requiresAuth: true }
            );

            if (applicationResponse.success && Array.isArray(applicationResponse.data)) {
              const userApplication = applicationResponse.data.find(app => app.jobId === id);
              setApplication(userApplication || null);
            } else {
              console.warn('Invalid application response format:', applicationResponse);
              setApplication(null);
            }
          } catch (appErr) {
            console.error('Error fetching application status:', appErr);
            // Don't throw here, just set application to null
            setApplication(null);
          }
        }
      } catch (err) {
        console.error('Error in fetchJobAndApplication:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch job details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJobAndApplication();
    }
  }, [id, currentUser?.role]);

  const handleApply = async () => {
    if (!job) return;
    
    if (!coverLetter.trim()) {
      setError('Please provide a cover letter');
      return;
    }

    if (!resumeUrl.trim()) {
      setError('Please provide a resume URL');
      return;
    }

    setIsApplying(true);
    setError('');

    try {
      const response = await apiRequest(
        API_ENDPOINTS.applications.create,
        {
          method: 'POST',
          requiresAuth: true,
          body: JSON.stringify({
            jobId: job._id,
            coverLetter,
            resumeUrl,
          }),
        }
      );

      if (response.success) {
        navigate('/jobseeker/dashboard');
      } else {
        throw new Error(response.message || 'Failed to apply for the job');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while applying for the job');
    } finally {
      setIsApplying(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'reviewed':
        return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Your application has been accepted!';
      case 'rejected':
        return 'Your application has been rejected.';
      case 'reviewed':
        return 'Your application is being reviewed.';
      default:
        return 'Your application is pending review.';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error || 'Job not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
          <div className="flex items-center text-gray-600 mb-4">
            <Building2 className="w-5 h-5 mr-2" />
            <span>{job.company}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-gray-600">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Briefcase className="w-5 h-5 mr-2" />
              <span>{job.type}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <DollarSign className="w-5 h-5 mr-2" />
              <span>
                {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-2" />
              <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>

            <h2 className="text-xl font-semibold mt-6 mb-2">Requirements</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
          </div>
        </div>
      </div>

      {currentUser?.role === 'jobseeker' && job.status === 'open' && (
        <div className="mt-8 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            {application ? (
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  {getStatusIcon(application.status)}
                </div>
                <h2 className="text-xl font-semibold mb-2">Application Status</h2>
                <p className="text-gray-600 mb-4">{getStatusText(application.status)}</p>
                <div className="text-sm text-gray-500">
                  Applied on {new Date(application.createdAt).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">Apply for this Position</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-1">
                      Cover Letter
                    </label>
                    <textarea
                      id="coverLetter"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={6}
                      placeholder="Write a cover letter explaining why you're a good fit for this position..."
                    />
                  </div>

                  <div>
                    <label htmlFor="resumeUrl" className="block text-sm font-medium text-gray-700 mb-1">
                      Resume URL
                    </label>
                    <input
                      type="url"
                      id="resumeUrl"
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://linkedin.com/in/your-profile"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Provide a URL to your resume or LinkedIn profile
                    </p>
                  </div>

                  <button
                    onClick={handleApply}
                    disabled={isApplying}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Submit Application
                      </>
                    )}
                  </button>
                  {error && (
                    <p className="mt-2 text-red-600 text-sm">{error}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {currentUser?.role === 'jobseeker' && job.status !== 'open' && (
        <div className="mt-8">
          <button
            disabled
            className="w-full bg-gray-400 text-white px-6 py-3 rounded-lg cursor-not-allowed flex items-center justify-center"
          >
            {job.status === 'closed' ? 'Position Closed' : 'Position Not Available'}
          </button>
        </div>
      )}
    </div>
  );
};

export default JobDetails;
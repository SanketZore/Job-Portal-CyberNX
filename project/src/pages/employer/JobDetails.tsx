import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Building2, Clock, Loader2, Edit2, ArrowLeft } from 'lucide-react';
import { useStore } from '../../store';
import { apiRequest } from '../../utils/api';
import { API_ENDPOINTS } from '../../config/api';
import { JobListing } from '../../types';

function JobDetails() {
  const { id } = useParams();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const [job, setJob] = useState<JobListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await apiRequest<JobListing>(
          API_ENDPOINTS.jobs.getOne(id || ''),
          { requiresAuth: true }
        );

        if (response.success && response.data) {
          setJob(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch job details');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching job details');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchJob();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-red-100 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-yellow-100 text-yellow-700 rounded-lg">
        Job not found
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} max-w-7xl mx-auto px-4 py-8`}>
      <div className="mb-6">
        <Link
          to="/employer/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-8 mb-8`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">{job.title}</h1>
            <div className="flex items-center text-gray-500 mb-4">
              <Building2 className="w-5 h-5 mr-2" />
              <span className="mr-4">{job.company}</span>
              <MapPin className="w-5 h-5 mr-2" />
              <span>{job.location}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`px-4 py-2 rounded-full text-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {job.type}
              </span>
              <span className={`px-4 py-2 rounded-full text-sm ${
                job.status === 'open' 
                  ? isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                  : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
            </div>
            <div className="flex items-center text-gray-500">
              <Clock className="w-5 h-5 mr-2" />
              <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-8 mb-8`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Job Description</h2>
              <Link
                to={`/employer/edit-job/${job._id}`}
                className="inline-flex items-center text-blue-600 hover:text-blue-700"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Job
              </Link>
            </div>
            <p className="mb-6 whitespace-pre-line">{job.description}</p>

            <h3 className="text-xl font-bold mb-4">Requirements</h3>
            <ul className="list-disc pl-6 space-y-2">
              {job.requirements.split('\n').map((req: string, index: number) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-8`}>
            <h2 className="text-xl font-bold mb-4">Company Overview</h2>
            <div className="flex items-center mb-4">
              <Building2 className="w-12 h-12 text-blue-600 mr-4" />
              <div>
                <h3 className="font-semibold">{job.company}</h3>
                <p className="text-gray-500">{job.location}</p>
              </div>
            </div>
            <p className="text-gray-500">
              {job.company} is looking for talented individuals to join their team...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetails; 
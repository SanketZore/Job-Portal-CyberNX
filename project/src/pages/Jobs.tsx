import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Building2, Clock, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';
import { JobListing } from '../types';

function Jobs() {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchJobs = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const response = await apiRequest<JobListing[]>(
        `${API_ENDPOINTS.jobs.list}?page=${pageNum}&limit=10`,
        { requiresAuth: false }
      );
      
      if (response.success && response.data) {
        if (append) {
          setJobs(prev => [...prev, ...(response.data || [])]);
        } else {
          setJobs(response.data || []);
        }
        setHasMore((response.data || []).length === 10);
      } else {
        throw new Error(response.message || 'Failed to fetch jobs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching jobs');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
      fetchJobs(page + 1, true);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
    fetchJobs(1);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value);
    setPage(1);
    fetchJobs(1);
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || job.type === selectedType;
    return matchesSearch && matchesType;
  });

  const jobTypes = ['full-time', 'part-time', 'contract', 'internship'];

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

  return (
    <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Find Your Next Opportunity</h1>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className={`flex items-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-2 shadow-md`}>
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={handleSearch}
                className={`w-full bg-transparent focus:outline-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              />
            </div>
          </div>
          
          <select
            value={selectedType}
            onChange={handleTypeChange}
            className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-md`}
          >
            <option value="">All Types</option>
            {jobTypes.map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredJobs.map(job => (
          <Link
            key={job._id}
            to={`/jobs/${job._id}`}
            className={`${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} p-6 rounded-lg shadow-md transition`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
                <div className="flex items-center text-gray-500 mb-2">
                  <Building2 className="w-4 h-4 mr-1" />
                  <span className="mr-4">{job.company}</span>
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{job.location}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    {job.type}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    {job.status}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-blue-600">
                  {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
                </div>
                <div className="flex items-center text-gray-500 mt-2">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className="text-sm">Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoadingMore ? (
              <span className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading more...
              </span>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default Jobs;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import { API_ENDPOINTS } from '../../config/api';
import { ApiResponse } from '../../types';

interface FormData {
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
}

const PostJobForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    company: '',
    location: '',
    type: 'full-time',
    description: '',
    requirements: '',
    salary: {
      min: 0,
      max: 0,
      currency: 'USD'
    }
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('salary.')) {
      const salaryField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        salary: {
          ...prev.salary,
          [salaryField]: salaryField === 'currency' ? value : parseInt(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate salary
      if (formData.salary.min >= formData.salary.max) {
        throw new Error('Minimum salary must be less than maximum salary');
      }

      if (formData.salary.min < 0 || formData.salary.max < 0) {
        throw new Error('Salary values cannot be negative');
      }

      const response = await apiRequest<ApiResponse>(API_ENDPOINTS.jobs.create, {
        method: 'POST',
        body: JSON.stringify(formData),
        requiresAuth: true
      });

      if (response.success) {
        navigate('/employer/dashboard');
      } else {
        setError(response.message || 'Failed to create job posting');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job posting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Post a New Job</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-700 mb-2">
            Job Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="company" className="block text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="location" className="block text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="type" className="block text-gray-700 mb-2">
            Job Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Salary Range
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="salary-min" className="block text-sm text-gray-600 mb-1">
                Minimum
              </label>
              <input
                type="number"
                id="salary-min"
                name="salary.min"
                value={formData.salary.min || ''}
                onChange={handleChange}
                required
                min="0"
                step="1"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="salary-max" className="block text-sm text-gray-600 mb-1">
                Maximum
              </label>
              <input
                type="number"
                id="salary-max"
                name="salary.max"
                value={formData.salary.max || ''}
                onChange={handleChange}
                required
                min="0"
                step="1"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="salary-currency" className="block text-sm text-gray-600 mb-1">
                Currency
              </label>
              <select
                id="salary-currency"
                name="salary.currency"
                value={formData.salary.currency}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 mb-2">
            Job Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="requirements" className="block text-gray-700 mb-2">
            Requirements
          </label>
          <textarea
            id="requirements"
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
        >
          {isSubmitting ? 'Posting Job...' : 'Post Job'}
        </button>
      </form>
    </div>
  );
};

export default PostJobForm; 
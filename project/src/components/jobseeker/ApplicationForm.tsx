import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { API_ENDPOINTS } from '../../config/api';

interface ApplicationFormProps {
  jobId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function ApplicationForm({ jobId, onSuccess, onError }: ApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await apiRequest(
        API_ENDPOINTS.applications.create,
        {
          method: 'POST',
          requiresAuth: true,
          body: JSON.stringify({
            jobId,
          }),
        }
      );

      if (response.success) {
        onSuccess();
      } else {
        throw new Error(response.message || 'Failed to submit application');
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'An error occurred while submitting your application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Applying...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            Apply Now
          </>
        )}
      </button>
    </form>
  );
}

export default ApplicationForm; 
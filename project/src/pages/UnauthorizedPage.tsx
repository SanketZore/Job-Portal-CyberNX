import { Link } from 'react-router-dom';

const UnauthorizedPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Unauthorized Access</h1>
      <p className="text-gray-600 mb-8">You don't have permission to access this page.</p>
      <Link
        to="/"
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
};

export default UnauthorizedPage; 
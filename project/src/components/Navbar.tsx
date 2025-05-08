import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import useAuthStore from '../store/authStore';

const Navbar = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-blue-600'}`}>
            Job Portal
          </Link>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} hover:bg-gray-100`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to={user?.role === 'employer' ? '/employer/dashboard' : '/jobseeker/dashboard'}
                  className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} hover:text-blue-600`}
                >
                  Dashboard
                </Link>
                <Link to="/jobs" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} hover:text-blue-600`}>
                  Jobs
                </Link>
                <button
                  onClick={handleLogout}
                  className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} hover:text-blue-600`}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/jobs" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} hover:text-blue-600`}>
                  Browse Jobs
                </Link>
                <Link to="/login" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} hover:text-blue-600`}>
                  Login
                </Link>
                <Link
                  to="/register"
                  className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-600'} text-white px-4 py-2 rounded hover:bg-blue-700`}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
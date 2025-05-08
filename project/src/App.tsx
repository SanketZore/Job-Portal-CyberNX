import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import EmployerDashboard from './pages/employer/Dashboard';
import JobSeekerDashboard from './pages/jobseeker/Dashboard';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import EmployerJobDetails from './pages/employer/JobDetails';
import ApplicationDetails from './pages/employer/ApplicationDetails';
import UnauthorizedPage from './pages/UnauthorizedPage';
import Home from './pages/Home';
import PostJobForm from './components/employer/PostJobForm';
import EditJob from './pages/employer/EditJob';
import useAuthStore from './store/authStore';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const { isAuthenticated, user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route 
                path="/login" 
                element={isAuthenticated ? <Navigate to={user?.role === 'employer' ? '/employer/dashboard' : '/jobseeker/dashboard'} /> : <LoginForm />} 
              />
              <Route 
                path="/register" 
                element={isAuthenticated ? <Navigate to={user?.role === 'employer' ? '/employer/dashboard' : '/jobseeker/dashboard'} /> : <RegisterForm />} 
              />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route 
                path="/jobs/:id" 
                element={
                  <ProtectedRoute>
                    <JobDetails />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Employer Routes */}
              <Route
                path="/employer/*"
                element={
                  <ProtectedRoute allowedRoles={['employer']}>
                    <Routes>
                      <Route path="dashboard" element={<EmployerDashboard />} />
                      <Route path="post-job" element={<PostJobForm />} />
                      <Route path="edit-job/:id" element={<EditJob />} />
                      <Route path="jobs/:id" element={<EmployerJobDetails />} />
                      <Route path="applications/:id" element={<ApplicationDetails />} />
                      <Route path="*" element={<Navigate to="/employer/dashboard" replace />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Protected Job Seeker Routes */}
              <Route
                path="/jobseeker/*"
                element={
                  <ProtectedRoute allowedRoles={['jobseeker']}>
                    <Routes>
                      <Route path="dashboard" element={<JobSeekerDashboard />} />
                      <Route path="*" element={<Navigate to="/jobseeker/dashboard" replace />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
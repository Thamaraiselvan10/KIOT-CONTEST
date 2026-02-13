import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ContestList from './pages/ContestList';
import ContestDetail from './pages/ContestDetail';
import ContestChat from './pages/ContestChat';
import StudentHome from './pages/StudentHome';
import StudentMyContests from './pages/StudentMyContests';
import StudentProfile from './pages/StudentProfile';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import MentorDashboard from './pages/MentorDashboard';
import CreateContest from './pages/CreateContest';

// Layout component
const Layout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
  </>
);

// Unauthorized page
const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="card p-8 text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
      <p className="text-stone-500 mb-6">You don't have permission to view this page.</p>
      <a href="/" className="btn-primary">Go Home</a>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout><Navigate to="/contests" /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/contests" element={
            <ProtectedRoute>
              <Layout><ContestList /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/contests/:id" element={
            <ProtectedRoute>
              <Layout><ContestDetail /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/contests/:id/chat" element={
            <ProtectedRoute>
              <ContestChat />
            </ProtectedRoute>
          } />

          {/* Student Routes */}
          <Route path="/student" element={
            <ProtectedRoute roles={['student']}>
              <Layout><StudentHome /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/student/my-contests" element={
            <ProtectedRoute roles={['student']}>
              <Layout><StudentMyContests /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/student/profile" element={
            <ProtectedRoute roles={['student']}>
              <Layout><StudentProfile /></Layout>
            </ProtectedRoute>
          } />

          {/* Coordinator Routes */}
          <Route path="/coordinator" element={
            <ProtectedRoute roles={['coordinator']}>
              <Layout><CoordinatorDashboard /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/coordinator/contests/new" element={
            <ProtectedRoute roles={['coordinator']}>
              <Layout><CreateContest /></Layout>
            </ProtectedRoute>
          } />

          {/* Mentor Routes */}
          <Route path="/mentor" element={
            <ProtectedRoute roles={['mentor']}>
              <Layout><MentorDashboard /></Layout>
            </ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

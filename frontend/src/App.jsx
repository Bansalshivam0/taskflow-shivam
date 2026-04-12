import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import DashboardLayout from './components/DashboardLayout'
import Home from './pages/home'
import SprintPlanner from './pages/SprintPlanner'
import TaskDetail from './pages/TaskDetail'
import Login from './pages/login'
import Register from './pages/register'

import Project from './pages/Project'
import Dashboard from './pages/Dashboard'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" toastOptions={{ style: { background: 'var(--bg-secondary)', color: 'var(--text)', border: '1px solid var(--border)' } }} />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Main Dashboard Area */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/sprint" element={<SprintPlanner />} />
            <Route path="/project/:projectId" element={<Project />} />
            <Route path="/task/:taskId" element={<TaskDetail />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
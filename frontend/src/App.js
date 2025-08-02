import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentRegister from './pages/StudentRegister';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('user');
    const storedUserType = localStorage.getItem('userType');
    
    if (storedUser && storedUserType) {
      setUser(JSON.parse(storedUser));
      setUserType(storedUserType);
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData, type) => {
    setUser(userData);
    setUserType(type);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userType', type);
  };

  const handleLogout = () => {
    setUser(null);
    setUserType(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {user && <Navbar user={user} userType={userType} onLogout={handleLogout} />}
        <Container fluid className="mt-3">
          <Routes>
            <Route 
              path="/" 
              element={
                user ? (
                  userType === 'student' ? 
                    <Navigate to="/student/dashboard" /> : 
                    <Navigate to="/admin/dashboard" />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/login" 
              element={
                user ? (
                  userType === 'student' ? 
                    <Navigate to="/student/dashboard" /> : 
                    <Navigate to="/admin/dashboard" />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              } 
            />
            <Route 
              path="/register" 
              element={
                user ? (
                  userType === 'student' ? 
                    <Navigate to="/student/dashboard" /> : 
                    <Navigate to="/admin/dashboard" />
                ) : (
                  <StudentRegister />
                )
              } 
            />
            <Route 
              path="/student/dashboard" 
              element={
                user && userType === 'student' ? (
                  <StudentDashboard user={user} />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                user && userType === 'admin' ? (
                  <AdminDashboard user={user} />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/student/certificates" 
              element={
                user && userType === 'student' ? (
                  <StudentDashboard user={user} />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/admin/certificates" 
              element={
                user && userType === 'admin' ? (
                  <AdminDashboard user={user} />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/admin/analytics" 
              element={
                user && userType === 'admin' ? (
                  <AdminDashboard user={user} />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/admin/students" 
              element={
                user && userType === 'admin' ? (
                  <AdminDashboard user={user} />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/profile" 
              element={
                user ? (
                  userType === 'student' ? (
                    <StudentDashboard user={user} />
                  ) : (
                    <AdminDashboard user={user} />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App; 
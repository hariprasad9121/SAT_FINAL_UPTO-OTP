import React, { useState } from 'react';
import { Card, Form, Button, Alert, Tabs, Tab, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import backgroundImage from '../background-image.jpg';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('student');
  const [formData, setFormData] = useState({
    student: { rollnumber: '', password: '' },
    admin: { employee_id: '', password: '' }
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');

  const handleInputChange = (userType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [userType]: {
        ...prev[userType],
        [field]: value
      }
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleKeyPress = (e, userType) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(userType);
    }
  };

  const validateForm = (userType) => {
    const newErrors = {};
    const data = formData[userType];

    if (userType === 'student') {
      if (!data.rollnumber.trim()) {
        newErrors.rollnumber = 'Roll number is required';
      }
    } else {
      if (!data.employee_id.trim()) {
        newErrors.employee_id = 'Employee ID is required';
      }
    }

    if (!data.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (data.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (userType) => {
    if (!validateForm(userType)) return;

    setLoading(true);
    setMessage('');

    try {
      const credentials = formData[userType];
      const response = userType === 'student' 
        ? await authAPI.studentLogin(credentials)
        : await authAPI.adminLogin(credentials);

      const userData = response.data;
      const loggedUser = userData[userType];
      
      // Set correct user type based on login type
      if (userType === 'student') {
        onLogin(loggedUser, 'student');
      } else {
        // For admin login, check if it's super admin
        onLogin(loggedUser, 'admin');
      }
      
      // Clear form data after successful login
      setFormData({
        student: { rollnumber: '', password: '' },
        admin: { employee_id: '', password: '' }
      });
      
      setMessage('Login successful! Redirecting...');
      setTimeout(() => {
        if (userType === 'student') {
          navigate('/student/dashboard');
        } else {
          if (loggedUser?.role === 'superadmin') {
            navigate('/superadmin/dashboard');
          } else {
            navigate('/admin/dashboard');
          }
        }
      }, 1000);

    } catch (error) {
      setMessage(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError('Please enter your email address');
      return;
    }

    try {
      setForgotPasswordLoading(true);
      setForgotPasswordError('');
      
      await authAPI.forgotPassword({ email: forgotPasswordEmail.trim() });
      
      setShowForgotPasswordModal(false);
      setResetPasswordData(prev => ({ ...prev, email: forgotPasswordEmail.trim() }));
      setShowResetPasswordModal(true);
      setMessage('Password reset OTP sent to your email! Please check and enter the verification code.');
      
    } catch (error) {
      setForgotPasswordError(error.response?.data?.error || 'Failed to send reset OTP. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!resetPasswordData.otp.trim()) {
      setResetPasswordError('Please enter the OTP');
      return;
    }
    
    if (!resetPasswordData.newPassword) {
      setResetPasswordError('Please enter a new password');
      return;
    }
    
    if (resetPasswordData.newPassword !== resetPasswordData.confirmNewPassword) {
      setResetPasswordError('Passwords do not match');
      return;
    }

    try {
      setResetPasswordLoading(true);
      setResetPasswordError('');
      
      await authAPI.resetPassword({
        email: resetPasswordData.email,
        otp: resetPasswordData.otp.trim(),
        new_password: resetPasswordData.newPassword
      });
      
      setShowResetPasswordModal(false);
      setResetPasswordData({
        email: '',
        otp: '',
        newPassword: '',
        confirmNewPassword: ''
      });
      setMessage('Password reset successfully! You can now login with your new password.');
      
    } catch (error) {
      setResetPasswordError(error.response?.data?.error || 'Password reset failed. Please try again.');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  return (
    <div 
      className="d-flex justify-content-center align-items-center min-vh-100"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        margin: 0,
        padding: 0
      }}
    >
      <div className="w-100" style={{ maxWidth: '500px' }}>
        <Card className="shadow">
          <Card.Header className="text-center">
            <h3 className="mb-0">SAT Portal Login</h3>
            <p className="text-muted mb-0">Student Achievement Tracker</p>
          </Card.Header>
          <Card.Body className="p-4">
            {message && (
              <Alert variant={message.includes('successful') ? 'success' : 'danger'}>
                {message}
              </Alert>
            )}

            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-4"
            >
              <Tab eventKey="student" title="Student Login">
                <Form autoComplete="off">
                  <Form.Group className="mb-3">
                    <Form.Label>Roll Number</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter your roll number"
                      value={formData.student.rollnumber}
                      onChange={(e) => handleInputChange('student', 'rollnumber', e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, 'student')}
                      isInvalid={!!errors.rollnumber}
                      autoComplete="off"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.rollnumber}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter your password"
                      value={formData.student.password}
                      onChange={(e) => handleInputChange('student', 'password', e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, 'student')}
                      isInvalid={!!errors.password}
                      autoComplete="off"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button
                    variant="primary"
                    className="w-100 mb-3"
                    onClick={() => handleSubmit('student')}
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Student Login'}
                  </Button>
                  
                  <div className="text-center">
                    <Button
                      variant="link"
                      className="text-decoration-none p-0"
                      onClick={() => setShowForgotPasswordModal(true)}
                    >
                      Forgot Password?
                    </Button>
                  </div>
                </Form>
              </Tab>

              <Tab eventKey="admin" title="Admin Login">
                <Form autoComplete="off">
                  <Form.Group className="mb-3">
                    <Form.Label>Employee ID</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter your employee ID"
                      value={formData.admin.employee_id}
                      onChange={(e) => handleInputChange('admin', 'employee_id', e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, 'admin')}
                      isInvalid={!!errors.employee_id}
                      autoComplete="off"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.employee_id}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter your password"
                      value={formData.admin.password}
                      onChange={(e) => handleInputChange('admin', 'password', e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, 'admin')}
                      isInvalid={!!errors.password}
                      autoComplete="off"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button
                    variant="primary"
                    className="w-100 mb-3"
                    onClick={() => handleSubmit('admin')}
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Admin Login'}
                  </Button>
                </Form>
              </Tab>
            </Tabs>

            <div className="text-center">
              <p className="mb-0">
                New student?{' '}
                <Link to="/register" className="text-primary text-decoration-none">
                  Register here
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      <Modal show={showForgotPasswordModal} onHide={() => setShowForgotPasswordModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Forgot Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            Enter your email address and we'll send you a password reset code.
          </p>
          
          {forgotPasswordError && (
            <Alert variant="danger" className="mb-3">
              {forgotPasswordError}
            </Alert>
          )}
          
          <Form onSubmit={handleForgotPassword}>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email address"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                autoComplete="off"
              />
            </Form.Group>
            
            <div className="d-grid gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={forgotPasswordLoading}
              >
                {forgotPasswordLoading ? 'Sending...' : 'Send Reset Code'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Reset Password Modal */}
      <Modal show={showResetPasswordModal} onHide={() => setShowResetPasswordModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            We've sent a reset code to <strong>{resetPasswordData.email}</strong>
          </p>
          <p className="text-muted small mb-3">
            Please check your email and enter the 6-digit code below, then set your new password.
          </p>
          
          {resetPasswordError && (
            <Alert variant="danger" className="mb-3">
              {resetPasswordError}
            </Alert>
          )}
          
          <Form onSubmit={handleResetPassword}>
            <Form.Group className="mb-3">
              <Form.Label>Reset Code</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter 6-digit OTP"
                value={resetPasswordData.otp}
                onChange={(e) => setResetPasswordData(prev => ({ ...prev, otp: e.target.value }))}
                maxLength={6}
                autoComplete="off"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter new password"
                value={resetPasswordData.newPassword}
                onChange={(e) => setResetPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                autoComplete="new-password"
              />
              <Form.Text className="text-muted">
                Must be at least 8 characters with uppercase, lowercase, and number
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirm new password"
                value={resetPasswordData.confirmNewPassword}
                onChange={(e) => setResetPasswordData(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                autoComplete="new-password"
              />
            </Form.Group>
            
            <div className="d-grid gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={resetPasswordLoading}
              >
                {resetPasswordLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Login; 
import React, { useState } from 'react';
import { Card, Form, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

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
      onLogin(userData[userType], userType);
      
      // Clear form data after successful login
      setFormData({
        student: { rollnumber: '', password: '' },
        admin: { employee_id: '', password: '' }
      });
      
      setMessage('Login successful! Redirecting...');
      setTimeout(() => {
        navigate(userType === 'student' ? '/student/dashboard' : '/admin/dashboard');
      }, 1000);

    } catch (error) {
      setMessage(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="w-100" style={{ maxWidth: '500px' }}>
        <Card className="shadow">
          <Card.Header className="text-center">
            <h3 className="mb-0">🎓 SAT Portal Login</h3>
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
              <Tab eventKey="student" title="👨‍🎓 Student Login">
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
                </Form>
              </Tab>

              <Tab eventKey="admin" title="👨‍💼 Admin Login">
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
    </div>
  );
};

export default Login; 
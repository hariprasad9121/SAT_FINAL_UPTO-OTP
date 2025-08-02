import React, { useState } from 'react';
import { Card, Form, Button, Alert, Row, Col, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const StudentRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    rollnumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: '',
    branch: '',
    section: '',
    year: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);

  const branches = [
    'COMPUTER SCIENCE AND ENGINEERING',
    'COMPUTER SCIENCE AND ENGINEERING [DATA SCIENCE]',
    'COMPUTER SCIENCE AND ENGINEERING [AIML]',
    'ELECTRICAL AND ELECTRONICS OF COMMUNICATION ENGINEERING',
    'ELECTRICAL AND ELECTRONICS ENGINEERING',
    'CIVIL ENGINEERING',
    'MECHANICAL ENGINEERING'
  ];

  const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const years = ['I', 'II', 'III', 'IV'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Roll number validation - 10 alphanumeric characters
    if (!formData.rollnumber.trim()) {
      newErrors.rollnumber = 'Roll number is required';
    } else if (!/^[A-Za-z0-9]{10}$/.test(formData.rollnumber.trim())) {
      newErrors.rollnumber = 'Roll number must be exactly 10 alphanumeric characters (e.g., 224G1A3224)';
    }

    // Email validation - must contain @srit.ac.in
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.trim().endsWith('@srit.ac.in')) {
      newErrors.email = 'Email must be from @srit.ac.in domain';
    } else if (!/^[^\s@]+@srit\.ac\.in$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    // Other required fields
    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }
    if (!formData.branch) {
      newErrors.branch = 'Please select your branch';
    }
    if (!formData.section) {
      newErrors.section = 'Please select your section';
    }
    if (!formData.year) {
      newErrors.year = 'Please select your year of study';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setMessage('');

      const data = {
        name: formData.name.trim(),
        rollnumber: formData.rollnumber.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        gender: formData.gender,
        branch: formData.branch,
        section: formData.section,
        year: formData.year
      };

      // Send OTP first
      await authAPI.sendRegistrationOTP({ email: data.email });
      
      // Store registration data and show OTP modal
      setRegistrationData(data);
      setShowOTPModal(true);
      setMessage('OTP sent to your email! Please check and enter the verification code.');

    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      setOtpError('Please enter the OTP');
      return;
    }

    try {
      setOtpLoading(true);
      setOtpError('');

      // Add OTP to registration data
      const finalData = {
        ...registrationData,
        otp: otp.trim()
      };

      await authAPI.studentRegister(finalData);
      
      // Clear form data after successful registration
      setFormData({
        name: '',
        rollnumber: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        gender: '',
        branch: '',
        section: '',
        year: ''
      });
      
      setShowOTPModal(false);
      setOtp('');
      setMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      setOtpError(error.response?.data?.error || 'OTP verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setOtpLoading(true);
      setOtpError('');
      
      await authAPI.sendRegistrationOTP({ email: registrationData.email });
      setMessage('OTP resent successfully! Please check your email.');
      
    } catch (error) {
      setOtpError(error.response?.data?.error || 'Failed to resend OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="w-100" style={{ maxWidth: '600px' }}>
        <Card className="shadow">
          <Card.Header className="text-center">
            <h3 className="mb-0">Student Registration</h3>
            <p className="text-muted mb-0">Join SAT Portal</p>
          </Card.Header>
          <Card.Body className="p-4">
            {message && (
              <Alert variant={message.includes('successful') ? 'success' : 'danger'}>
                {message}
              </Alert>
            )}

            <Form onSubmit={handleSubmit} autoComplete="off">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      onKeyPress={handleKeyPress}
                      isInvalid={!!errors.name}
                      autoComplete="off"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Roll Number *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter 10-digit roll number (e.g., 224G1A3224)"
                      value={formData.rollnumber}
                      onChange={(e) => handleInputChange('rollnumber', e.target.value)}
                      onKeyPress={handleKeyPress}
                      isInvalid={!!errors.rollnumber}
                      autoComplete="off"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.rollnumber}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address *</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email (@srit.ac.in)"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onKeyPress={handleKeyPress}
                      isInvalid={!!errors.email}
                      autoComplete="off"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number *</Form.Label>
                    <Form.Control
                      type="tel"
                      placeholder="Enter 10-digit phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      onKeyPress={handleKeyPress}
                      isInvalid={!!errors.phone}
                      autoComplete="off"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.phone}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Password *</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      onKeyPress={handleKeyPress}
                      isInvalid={!!errors.password}
                      autoComplete="new-password"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Must be at least 8 characters with uppercase, lowercase, and number
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm Password *</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      onKeyPress={handleKeyPress}
                      isInvalid={!!errors.confirmPassword}
                      autoComplete="new-password"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.confirmPassword}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Gender *</Form.Label>
                    <Form.Select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      onKeyPress={handleKeyPress}
                      isInvalid={!!errors.gender}
                      autoComplete="off"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.gender}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Branch *</Form.Label>
                    <Form.Select
                      value={formData.branch}
                      onChange={(e) => handleInputChange('branch', e.target.value)}
                      onKeyPress={handleKeyPress}
                      isInvalid={!!errors.branch}
                      autoComplete="off"
                    >
                      <option value="">Select branch</option>
                      {branches.map(branch => (
                        <option key={branch} value={branch}>{branch}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.branch}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Section *</Form.Label>
                    <Form.Select
                      value={formData.section}
                      onChange={(e) => handleInputChange('section', e.target.value)}
                      onKeyPress={handleKeyPress}
                      isInvalid={!!errors.section}
                      autoComplete="off"
                    >
                      <option value="">Select section</option>
                      {sections.map(section => (
                        <option key={section} value={section}>Section {section}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.section}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Year of Study *</Form.Label>
                    <Form.Select
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      onKeyPress={handleKeyPress}
                      isInvalid={!!errors.year}
                      autoComplete="off"
                    >
                      <option value="">Select year of study</option>
                      {years.map(year => (
                        <option key={year} value={year}>Year {year}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.year}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-grid gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>

              <div className="text-center mt-3">
                <p className="mb-0">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary text-decoration-none">
                    Login here
                  </Link>
                </p>
                <p className="mb-0 mt-2">
                  <Link to="/login" className="text-decoration-none">
                    Forgot Password?
                  </Link>
                </p>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>

      {/* OTP Verification Modal */}
      <Modal show={showOTPModal} onHide={() => setShowOTPModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Email Verification</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            We've sent a verification code to <strong>{registrationData?.email}</strong>
          </p>
          <p className="text-muted small mb-3">
            Please check your email and enter the 6-digit code below.
          </p>
          
          {otpError && (
            <Alert variant="danger" className="mb-3">
              {otpError}
            </Alert>
          )}
          
          <Form onSubmit={handleOTPSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Verification Code</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                autoComplete="off"
              />
            </Form.Group>
            
            <div className="d-grid gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={otpLoading}
              >
                {otpLoading ? 'Verifying...' : 'Verify & Complete Registration'}
              </Button>
              
              <Button
                type="button"
                variant="outline-secondary"
                onClick={handleResendOTP}
                disabled={otpLoading}
              >
                {otpLoading ? 'Sending...' : 'Resend OTP'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default StudentRegister; 
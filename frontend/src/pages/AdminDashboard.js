import React, { useState, useEffect, useCallback } from 'react';
import { 
  Row, Col, Card, Button, Table, Badge, Form, Alert, Spinner,
  Modal, Dropdown, Tabs, Tab, ButtonGroup
} from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { adminAPI } from '../services/api';
import FormCreationModal from '../components/FormCreationModal';
import { useLocation, useNavigate } from 'react-router-dom';

const AdminDashboard = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [analyticsFilters, setAnalyticsFilters] = useState({});
  const [studentFilters, setStudentFilters] = useState({});
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('certificates');
  const [forms, setForms] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showResponsesModal, setShowResponsesModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formResponses, setFormResponses] = useState([]);
  const [showUnsubmittedModal, setShowUnsubmittedModal] = useState(false);
  const [unsubmitted, setUnsubmitted] = useState([]);
  const [unsubmittedCount, setUnsubmittedCount] = useState(0);
  const [unsubmittedFilters, setUnsubmittedFilters] = useState({ year: '', section: '' });
  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  // Super admin view state
  const [superAdminView, setSuperAdminView] = useState(false);
  const [departmentName, setDepartmentName] = useState('');

  // Admin credentials mapping
  const adminCredentials = {
    'admin@cse': { branch: 'COMPUTER SCIENCE AND ENGINEERING', password: 'Cse@srit' },
    'admin@csd': { branch: 'COMPUTER SCIENCE AND ENGINEERING [DATA SCIENCE]', password: 'Csd@srit' },
    'admin@csm': { branch: 'COMPUTER SCIENCE AND ENGINEERING [AIML]', password: 'Csm@srit' },
    'admin@ece': { branch: 'ELECTRICAL AND ELECTRONICS OF COMMUNICATION ENGINEERING', password: 'Ece@srit' },
    'admin@eee': { branch: 'ELECTRICAL AND ELECTRONICS ENGINEERING', password: 'Eee@srit' },
    'admin@civ': { branch: 'CIVIL ENGINEERING', password: 'Civ@srit' },
    'admin@mech': { branch: 'MECHANICAL ENGINEERING', password: 'Mech@srit' }
  };

  // Check if this is a super admin view
  useEffect(() => {
    if (location.state?.superAdminView) {
      setSuperAdminView(true);
      setDepartmentName(location.state.departmentName || '');
      // Reload data with the new branch filter - only loadDashboardData which includes analytics
      setTimeout(() => {
        loadDashboardData();
      }, 100);
    }
  }, [location.state]);

  const userBranch = superAdminView ? location.state?.forceBranch : adminCredentials[user?.employee_id]?.branch;

  const loadDashboardData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (dashboardLoading) {
      return;
    }
    
    try {
      setDashboardLoading(true);
      const branch = superAdminView ? location.state?.forceBranch : userBranch;
      
      // Ensure we have a valid branch before making API calls
      if (!branch) {
        return;
      }
      
      const [dashboardRes, analyticsRes] = await Promise.all([
        adminAPI.getDashboard({ branch: branch }),
        adminAPI.getAnalytics({ branch: branch })
      ]);
      
      console.log('Setting dashboard data:', dashboardRes.data);
      console.log('Setting analytics data:', analyticsRes.data);
      setDashboardData(dashboardRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      setMessage('Failed to load dashboard data.');
    } finally {
      setDashboardLoading(false);
    }
  }, [userBranch, superAdminView, location.state?.forceBranch]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await loadDashboardData();
        await loadForms();
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [loadDashboardData]);

  const loadCertificates = async (filters = {}) => {
    try {
      // Add department filter for department-specific admins
      const branch = superAdminView ? location.state?.forceBranch : userBranch;
      if (branch) {
        filters.branch = branch;
      }
      const response = await adminAPI.getCertificates(filters);
      setCertificates(response.data.certificates);
    } catch (error) {
      setMessage('Failed to load certificates.');
    }
  };

  const loadStudents = async (filters = {}) => {
    try {
      const branch = superAdminView ? location.state?.forceBranch : userBranch;
      const params = { branch: branch, ...filters };
      const response = await adminAPI.getStudents(params);
      let studentsData = response.data.students;
      
      // Sort by roll number last 4 digits
      studentsData.sort((a, b) => {
        const aLast4 = a.rollnumber.slice(-4);
        const bLast4 = b.rollnumber.slice(-4);
        return aLast4.localeCompare(bLast4);
      });
      
      setStudents(studentsData);
    } catch (error) {
      setMessage('Failed to load students data.');
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadCertificates(newFilters);
    loadAnalytics(newFilters);
  };

  const handleAnalyticsFilterChange = (key, value) => {
    const newFilters = { ...analyticsFilters, [key]: value };
    setAnalyticsFilters(newFilters);
    loadAnalytics(newFilters);
  };

  const handleStudentFilterChange = (key, value) => {
    const newFilters = { ...studentFilters, [key]: value };
    setStudentFilters(newFilters);
    loadStudents(newFilters);
  };

  const loadAnalytics = async (filters = {}) => {
    try {
      const branch = superAdminView ? location.state?.forceBranch : userBranch;
      if (branch) {
        filters.branch = branch;
      }
      const response = await adminAPI.getAnalytics(filters);
      setAnalytics(response.data);
    } catch (error) {
      setMessage('Failed to load analytics.');
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedCertificate || !newStatus) return;

    try {
      setUpdating(true);
      await adminAPI.updateCertificateStatus({
        certificate_id: selectedCertificate.id,
        status: newStatus
      });
      
      setMessage('Certificate status updated successfully!');
      setStatusModal(false);
      setSelectedCertificate(null);
      setNewStatus('');
      loadCertificates(filters);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (!certificates.length) {
      setMessage('No certificates to process.');
      return;
    }

    try {
      setUpdating(true);
      const certificateIds = certificates.map(cert => cert.id);
      await adminAPI.bulkUpdateStatus({
        certificate_ids: certificateIds,
        status: action === 'approve' ? 'Approved' : 'Rejected'
      });
      
      setMessage(`All certificates ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      loadCertificates(filters);
    } catch (error) {
      setMessage(error.response?.data?.error || `Failed to ${action} certificates.`);
    } finally {
      setUpdating(false);
    }
  };

  const handleReportDownload = async (type = 'excel') => {
    try {
      const branch = superAdminView ? location.state?.forceBranch : userBranch;
      const response = await adminAPI.generateReport({
        type,
        ...filters,
        branch: branch
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificates_report.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to generate report.';
      setMessage(errorMessage);
    }
  };

  const handleStudentsDownload = async () => {
    try {
      const branch = superAdminView ? location.state?.forceBranch : userBranch;
      const params = { branch: branch, ...studentFilters };
      const response = await adminAPI.downloadStudentsExcel(params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setMessage('Students report downloaded successfully!');
    } catch (error) {
      setMessage('Failed to download students report.');
    }
  };

  const loadForms = async () => {
    try {
      const response = await adminAPI.getForms(user.id);
      setForms(response.data.forms);
    } catch (error) {
      setMessage('Failed to load forms.');
    }
  };

  const handleViewResponses = async (formId) => {
    try {
      const response = await adminAPI.getFormResponses(formId, user.id);
      setSelectedForm(response.data.form);
      setFormResponses(response.data.responses);
      setShowResponsesModal(true);
    } catch (error) {
      setMessage('Failed to load form responses.');
    }
  };

  const handleViewUnsubmitted = async (form) => {
    try {
      const res = await adminAPI.getUnsubmittedStudents(form.id, user.id, unsubmittedFilters);
      setSelectedForm(form);
      setUnsubmitted(res.data.unsubmitted || []);
      setUnsubmittedCount(res.data.count || 0);
      setShowUnsubmittedModal(true);
    } catch (error) {
      setMessage('Failed to load unsubmitted students.');
    }
  };

  const handleUnsubmittedFilterChange = async (key, value) => {
    const next = { ...unsubmittedFilters, [key]: value };
    setUnsubmittedFilters(next);
    if (selectedForm) {
      try {
        const res = await adminAPI.getUnsubmittedStudents(selectedForm.id, user.id, next);
        setUnsubmitted(res.data.unsubmitted || []);
        setUnsubmittedCount(res.data.count || 0);
      } catch (_) {}
    }
  };

  const handleDownloadUnsubmitted = async () => {
    if (!selectedForm) return;
    try {
      const response = await adminAPI.downloadUnsubmittedStudents(selectedForm.id, user.id, unsubmittedFilters);
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `unsubmitted_students_${selectedForm.id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage('Failed to download unsubmitted students.');
    }
  };

  const handleDownloadResponses = async (formId) => {
    try {
      const response = await adminAPI.downloadFormResponses(formId, user.id);
      
      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.headers['content-disposition']?.split('filename=')[1] || 'form_responses.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setMessage('Form responses downloaded successfully!');
    } catch (error) {
      setMessage('Failed to download form responses.');
    }
  };

  const handleSendDeadlineReminders = async () => {
    try {
      const response = await adminAPI.sendDeadlineReminders(user.id);
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Failed to send deadline reminders.');
    }
  };

  const handleDeleteForm = async (formId) => {
    if (window.confirm('Are you sure you want to delete this form? This action cannot be undone and will delete all responses and uploaded files.')) {
      try {
        await adminAPI.deleteForm(formId, user.id);
        setMessage('Form deleted successfully!');
        loadForms(); // Reload the forms list
      } catch (error) {
        setMessage('Failed to delete form.');
      }
    }
  };

  const handleShowProfile = () => {
    setShowProfileModal(true);
  };

  const handleShowMessage = (message) => {
    setSelectedMessage(message);
    setShowMessageModal(true);
  };

  // Listen for message display events
  useEffect(() => {
    const handleMessageDisplay = (event) => {
      if (event.detail && event.detail.message) {
        handleShowMessage(event.detail.message);
      }
    };

    window.addEventListener('showMessage', handleMessageDisplay);
    return () => window.removeEventListener('showMessage', handleMessageDisplay);
  }, []);

  // Refresh messages when modal is closed
  const handleMessageModalClose = () => {
    setShowMessageModal(false);
    setSelectedMessage(null);
    // Trigger a refresh of messages in navbar
    window.dispatchEvent(new CustomEvent('refreshMessages'));
  };

  const handlePasswordChange = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage('Please fill in all password fields.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New password and confirm password do not match.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage('New password must be at least 6 characters long.');
      return;
    }

    try {
      setPasswordChanging(true);
      const response = await adminAPI.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      }, user.id);
      
      setMessage('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to change password.');
    } finally {
      setPasswordChanging(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Pending': 'warning',
      'Approved': 'success',
      'Rejected': 'danger'
    };
    return <Badge bg={variants[status]} className="status-badge">{status}</Badge>;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Approved': '#28A745',
      'Rejected': '#DC3545',
      'Pending': '#FFC107'
    };
    return colors[status] || '#6C757D';
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h2>{superAdminView ? `${departmentName} Department Dashboard` : 'Admin Dashboard'}</h2>
          <p className="text-muted">
            {superAdminView ? `Super Admin View - ${departmentName} Department` : `Welcome back, ${user?.name}!`}
          </p>
          {userBranch && (
            <p className="admin-department-text">
              <strong>Department:</strong> {userBranch}
            </p>
          )}
          {superAdminView && (
            <div className="mt-3">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/superadmin/dashboard')}
              >
                ← Back to Super Admin Dashboard
              </button>
            </div>
          )}
          {!superAdminView && (
            <div className="mt-3">
              <button 
                className="btn btn-outline-primary"
                onClick={() => setShowProfileModal(true)}
              >
                Admin Profile
              </button>
            </div>
          )}
        </Col>
      </Row>

      {message && (
        <Alert 
          variant={message.includes('successfully') ? 'success' : 'danger'}
          dismissible
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      {/* Statistics Cards */}
      {loading ? (
        <Row className="mb-4">
          <Col className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading dashboard data...</p>
          </Col>
        </Row>
      ) : (
        <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <Card className="dashboard-card analytics-card">
            <Card.Body className="text-center">
              <h3 className="text-white">{dashboardData?.statistics?.total_certificates || 0}</h3>
              <p className="text-white mb-0">Total Certificates</p>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="dashboard-card">
            <Card.Body className="text-center">
              <h3 className="text-warning">{dashboardData?.statistics?.pending_certificates || 0}</h3>
              <p className="text-muted mb-0">Pending</p>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="dashboard-card">
            <Card.Body className="text-center">
              <h3 className="text-success">{dashboardData?.statistics?.approved_certificates || 0}</h3>
              <p className="text-muted mb-0">Approved</p>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="dashboard-card">
            <Card.Body className="text-center">
              <h3 className="text-danger">{dashboardData?.statistics?.rejected_certificates || 0}</h3>
              <p className="text-muted mb-0">Rejected</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      )}

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab eventKey="certificates" title="Manage Certificates">
          <Card className="dashboard-card">
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h5 className="mb-0">Certificate Management</h5>
                </Col>
                <Col xs="auto">
                  <ButtonGroup>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      className="admin-action-btn"
                      onClick={() => handleBulkAction('approve')}
                      disabled={updating}
                    >
                       Approve All
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      className="admin-action-btn"
                      onClick={() => handleBulkAction('reject')}
                      disabled={updating}
                    >
                       Reject All
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      className="admin-action-btn"
                      onClick={() => {
                        loadCertificates(filters);
                        loadDashboardData();
                      }}
                      disabled={loading}
                    >
                       Refresh
                    </Button>
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" size="sm" className="admin-action-btn">
                         Download Report
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleReportDownload('excel')}>
                           Excel Report
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleReportDownload('pdf')}>
                           PDF Report
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </ButtonGroup>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              {/* Filters */}
              <Row className="mb-3">
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Year</Form.Label>
                    <Form.Select
                      value={filters.year || ''}
                      onChange={(e) => handleFilterChange('year', e.target.value)}
                    >
                      <option value="">All Years</option>
                      <option value="I">Year I</option>
                      <option value="II">Year II</option>
                      <option value="III">Year III</option>
                      <option value="IV">Year IV</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Branch</Form.Label>
                    <Form.Select
                      value={filters.branch || ''}
                      onChange={(e) => handleFilterChange('branch', e.target.value)}
                      disabled={!!userBranch}
                    >
                      <option value="">All Branches</option>
                      <option value="COMPUTER SCIENCE AND ENGINEERING">CSE</option>
                      <option value="COMPUTER SCIENCE AND ENGINEERING [DATA SCIENCE]">CSD</option>
                      <option value="COMPUTER SCIENCE AND ENGINEERING [AIML]">CSM</option>
                      <option value="ELECTRICAL AND ELECTRONICS OF COMMUNICATION ENGINEERING">ECE</option>
                      <option value="ELECTRICAL AND ELECTRONICS ENGINEERING">EEE</option>
                      <option value="CIVIL ENGINEERING">CIV</option>
                      <option value="MECHANICAL ENGINEERING">MECH</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Event Type</Form.Label>
                    <Form.Select
                      value={filters.event_type || ''}
                      onChange={(e) => handleFilterChange('event_type', e.target.value)}
                    >
                      <option value="">All Types</option>
                      <option value="Internship">Internship</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="NPTEL">NPTEL</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Conference">Conference</option>
                      <option value="Competition">Competition</option>
                      <option value="Training">Training</option>
                      <option value="Certification">Certification</option>
                      <option value="Project">Project</option>
                      <option value="Other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={filters.status || ''}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Section</Form.Label>
                    <Form.Select
                      value={filters.section || ''}
                      onChange={(e) => handleFilterChange('section', e.target.value)}
                    >
                      <option value="">All Sections</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                      <option value="E">Section E</option>
                      <option value="F">Section F</option>
                      <option value="G">Section G</option>
                      <option value="H">Section H</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => {
                      setFilters({});
                      loadCertificates({});
                    }}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                </Col>
              </Row>

              {/* Certificates Table */}
              <Table responsive>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    <th>Branch</th>
                    <th>Certificate Name</th>
                    <th>Event Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Uploaded At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert) => (
                    <tr key={cert.id}>
                      <td>{cert.student_name}</td>
                      <td>{cert.rollnumber}</td>
                      <td>{cert.branch}</td>
                      <td>{cert.certificate_name || cert.event_type}</td>
                      <td>{cert.event_type}</td>
                      <td>{cert.start_date || 'N/A'}</td>
                      <td>{cert.end_date || 'N/A'}</td>
                      <td>{getStatusBadge(cert.status)}</td>
                      <td>{cert.uploaded_at}</td>
                      <td>
                        <Button 
                          size="sm" 
                          variant="outline-primary"
                          onClick={() => {
                            setSelectedCertificate(cert);
                            setStatusModal(true);
                          }}
                        >
                          Update Status
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="analytics" title="Analytics">
          <Card className="dashboard-card">
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h5 className="mb-0">Analytics Dashboard</h5>
                </Col>
                <Col xs="auto">
                  <Row>
                    <Col>
                      <Form.Select
                        size="sm"
                        value={analyticsFilters.year || ''}
                        onChange={(e) => handleAnalyticsFilterChange('year', e.target.value)}
                      >
                        <option value="">All Years</option>
                        <option value="I">Year I</option>
                        <option value="II">Year II</option>
                        <option value="III">Year III</option>
                        <option value="IV">Year IV</option>
                      </Form.Select>
                    </Col>
                    <Col>
                      <Form.Select
                        size="sm"
                        value={analyticsFilters.branch || ''}
                        onChange={(e) => handleAnalyticsFilterChange('branch', e.target.value)}
                        disabled={!!userBranch}
                      >
                        <option value="">All Branches</option>
                        <option value="COMPUTER SCIENCE AND ENGINEERING">CSE</option>
                        <option value="COMPUTER SCIENCE AND ENGINEERING [DATA SCIENCE]">CSD</option>
                        <option value="COMPUTER SCIENCE AND ENGINEERING [AIML]">CSM</option>
                        <option value="ELECTRICAL AND ELECTRONICS OF COMMUNICATION ENGINEERING">ECE</option>
                        <option value="ELECTRICAL AND ELECTRONICS ENGINEERING">EEE</option>
                        <option value="CIVIL ENGINEERING">CIV</option>
                        <option value="MECHANICAL ENGINEERING">MECH</option>
                      </Form.Select>
                    </Col>
                    <Col>
                      <Form.Select
                        size="sm"
                        value={analyticsFilters.event_type || ''}
                        onChange={(e) => handleAnalyticsFilterChange('event_type', e.target.value)}
                      >
                        <option value="">All Event Types</option>
                        <option value="Internship">Internship</option>
                        <option value="Hackathon">Hackathon</option>
                        <option value="NPTEL">NPTEL</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Conference">Conference</option>
                        <option value="Competition">Competition</option>
                        <option value="Training">Training</option>
                        <option value="Certification">Certification</option>
                        <option value="Project">Project</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col lg={6} className="mb-4">
                  <Card>
                    <Card.Header>
                      <h6 className="mb-0">Status Distribution</h6>
                    </Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analytics?.status_stats || []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {analytics?.status_stats?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={6} className="mb-4">
                  <Card>
                    <Card.Header>
                      <h6 className="mb-0">Event Type Distribution</h6>
                    </Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics?.event_stats || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="event_type" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#FF4500" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>

                 <Tab eventKey="forms" title="Form Management">
           <Card className="dashboard-card">
             <Card.Header>
               <Row className="align-items-center">
                 <Col>
                   <h5 className="mb-0">Form Management</h5>
                   <p className="student-info-text mb-0">
                     Create and manage forms for your department students
                   </p>
                 </Col>
                 <Col xs="auto">
                   <Button 
                     variant="outline-warning" 
                     size="sm"
                     className="admin-action-btn"
                     onClick={handleSendDeadlineReminders}
                   >
                     Send Deadline Reminders
                   </Button>
                   <Button 
                     variant="outline-secondary" 
                     size="sm"
                     className="admin-action-btn"
                     onClick={() => setShowFormModal(true)}
                   >
                     Create New Form
                   </Button>
                 </Col>
               </Row>
             </Card.Header>
            <Card.Body>
               <Table responsive>
                 <thead>
                   <tr>
                     <th>Title</th>
                     <th>Description</th>
                     <th>Deadline</th>
                     <th>Responses</th>
                     <th>Status</th>
                    <th>Actions</th>
                    <th>Unsubmitted</th>
                     <th>Delete Responses</th>
                   </tr>
                 </thead>
                 <tbody>
                   {forms.map((form) => (
                     <tr key={form.id}>
                       <td>{form.title}</td>
                       <td>{form.description}</td>
                       <td>{new Date(form.deadline).toLocaleDateString()}</td>
                       <td>{form.response_count}</td>
                       <td>
                         <Badge bg={form.is_active ? 'success' : 'secondary'}>
                           {form.is_active ? 'Active' : 'Inactive'}
                         </Badge>
                       </td>
                       <td>
                         <Button 
                           size="sm" 
                           variant="outline-success"
                           onClick={() => handleDownloadResponses(form.id)}
                         >
                           Download Responses
                         </Button>
                       </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-warning"
                          onClick={() => handleViewUnsubmitted(form)}
                        >
                          View Unsubmitted
                        </Button>
                      </td>
                       <td>
                         <Button 
                           size="sm" 
                           variant="outline-danger"
                           onClick={() => handleDeleteForm(form.id)}
                         >
                           Delete
                         </Button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </Table>
             </Card.Body>
           </Card>
         </Tab>

         <Tab eventKey="students" title="Student Data">
          <Card className="dashboard-card">
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h5 className="mb-0">Student Information</h5>
                                     <p className="student-info-text mb-0">
                     {userBranch ? `Showing students from ${userBranch}` : 'Showing all students'}
                   </p>
                </Col>
                <Col xs="auto">
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    className="admin-action-btn"
                    onClick={() => loadStudents(studentFilters)}
                  >
                    Refresh Data
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    className="admin-action-btn"
                    onClick={() => handleStudentsDownload()}
                  >
                    Download Excel
                  </Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              {/* Year-wise Filter */}
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Filter by Year</Form.Label>
                    <Form.Select
                      value={studentFilters.year || ''}
                      onChange={(e) => handleStudentFilterChange('year', e.target.value)}
                    >
                      <option value="">All Years</option>
                      <option value="I">Year I</option>
                      <option value="II">Year II</option>
                      <option value="III">Year III</option>
                      <option value="IV">Year IV</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Filter by Section</Form.Label>
                    <Form.Select
                      value={studentFilters.section || ''}
                      onChange={(e) => handleStudentFilterChange('section', e.target.value)}
                    >
                      <option value="">All Sections</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                      <option value="E">Section E</option>
                      <option value="F">Section F</option>
                      <option value="G">Section G</option>
                      <option value="H">Section H</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-end h-100">
                    <div className="text-muted">
                      <small>
                        Showing {students.length} students 
                        {studentFilters.year && ` in Year ${studentFilters.year}`}
                        {studentFilters.section && ` Section ${studentFilters.section}`}
                        {userBranch && ` from ${userBranch}`}
                      </small>
                    </div>
                  </div>
                </Col>
              </Row>

              <Table responsive>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Roll Number</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Branch</th>
                    <th>Section</th>
                    <th>Year</th>
                    <th>Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.rollnumber}</td>
                      <td>{student.email}</td>
                      <td>{student.phone}</td>
                      <td>{student.branch}</td>
                      <td>{student.section}</td>
                      <td>{student.year}</td>
                      <td>{student.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Status Update Modal */}
      <Modal show={statusModal} onHide={() => setStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Certificate Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCertificate && (
            <div>
              <p><strong>Student:</strong> {selectedCertificate.student_name}</p>
              <p><strong>Certificate Name:</strong> {selectedCertificate.certificate_name || selectedCertificate.event_type}</p>
              <p><strong>Event Type:</strong> {selectedCertificate.event_type}</p>
              <p><strong>Start Date:</strong> {selectedCertificate.start_date || 'N/A'}</p>
              <p><strong>End Date:</strong> {selectedCertificate.end_date || 'N/A'}</p>
              <p><strong>Current Status:</strong> {getStatusBadge(selectedCertificate.status)}</p>
              
              <Form.Group className="mt-3">
                <Form.Label>New Status</Form.Label>
                <Form.Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="">Select status</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Pending">Pending</option>
                </Form.Select>
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setStatusModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleStatusUpdate}
            disabled={updating || !newStatus}
          >
            {updating ? 'Updating...' : 'Update Status'}
          </Button>
                 </Modal.Footer>
       </Modal>

      {/* Unsubmitted Students Modal */}
      <Modal show={showUnsubmittedModal} onHide={() => setShowUnsubmittedModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            Unsubmitted Students{selectedForm ? ` - ${selectedForm.title}` : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Year</Form.Label>
                <Form.Select
                  value={unsubmittedFilters.year}
                  onChange={(e) => handleUnsubmittedFilterChange('year', e.target.value)}
                >
                  <option value="">All Years</option>
                  <option value="I">Year I</option>
                  <option value="II">Year II</option>
                  <option value="III">Year III</option>
                  <option value="IV">Year IV</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Section</Form.Label>
                <Form.Select
                  value={unsubmittedFilters.section}
                  onChange={(e) => handleUnsubmittedFilterChange('section', e.target.value)}
                >
                  <option value="">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                  <option value="E">Section E</option>
                  <option value="F">Section F</option>
                  <option value="G">Section G</option>
                  <option value="H">Section H</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-end">
              <div className="text-muted">
                <small>Showing {unsubmittedCount} unsubmitted students</small>
              </div>
            </Col>
          </Row>
          <Table responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll Number</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Branch</th>
                <th>Section</th>
                <th>Year</th>
                <th>Gender</th>
              </tr>
            </thead>
            <tbody>
              {unsubmitted.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.rollnumber}</td>
                  <td>{s.email}</td>
                  <td>{s.phone}</td>
                  <td>{s.branch}</td>
                  <td>{s.section}</td>
                  <td>{s.year}</td>
                  <td>{s.gender}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="success" 
            onClick={handleDownloadUnsubmitted}
            disabled={!unsubmittedCount}
          >
            Download Excel
          </Button>
          <Button variant="secondary" onClick={() => setShowUnsubmittedModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

       {/* Form Creation Modal */}
       <FormCreationModal
         show={showFormModal}
         onHide={() => setShowFormModal(false)}
         onFormCreated={loadForms}
         user={user}
       />

       {/* Form Responses Modal */}
       <Modal show={showResponsesModal} onHide={() => setShowResponsesModal(false)} size="xl">
         <Modal.Header closeButton>
           <Modal.Title>
             Form Responses: {selectedForm?.title}
           </Modal.Title>
         </Modal.Header>
         <Modal.Body>
           {selectedForm && (
             <div className="mb-4">
               <h6>Form Details</h6>
               <p><strong>Description:</strong> {selectedForm.description}</p>
               <p><strong>Deadline:</strong> {new Date(selectedForm.deadline).toLocaleString()}</p>
             </div>
           )}
           
           <h6>Responses ({formResponses.length})</h6>
           {formResponses.map((response, index) => (
             <Card key={response.id} className="mb-3">
               <Card.Header>
                 <strong>{response.student_name}</strong> - {response.student_rollnumber}
                 <br />
                 <small className="text-muted">
                   Submitted: {new Date(response.submitted_at).toLocaleString()}
                 </small>
               </Card.Header>
               <Card.Body>
                 {Object.entries(response.responses).map(([fieldId, value]) => {
                   const field = selectedForm?.form_fields?.find(f => f.id === parseInt(fieldId));
                   return (
                     <div key={fieldId} className="mb-2">
                       <strong>{field?.label || fieldId}:</strong>
                       <div className="mt-1">
                         {Array.isArray(value) ? value.join(', ') : value}
                       </div>
                     </div>
                   );
                 })}
               </Card.Body>
             </Card>
           ))}
           
           {formResponses.length === 0 && (
             <p className="text-muted text-center">No responses yet</p>
           )}
         </Modal.Body>
         <Modal.Footer>
           {formResponses.length > 0 && (
             <Button 
               variant="success" 
               onClick={() => handleDownloadResponses(selectedForm.id)}
               className="me-2"
             >
               Download Excel
             </Button>
           )}
           <Button variant="secondary" onClick={() => setShowResponsesModal(false)}>
             Close
           </Button>
         </Modal.Footer>
       </Modal>

       {/* Password Change Modal */}
       <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
         <Modal.Header closeButton>
           <Modal.Title>Change Password</Modal.Title>
         </Modal.Header>
         <Modal.Body>
           <Form>
             <Form.Group className="mb-3">
               <Form.Label>Current Password</Form.Label>
               <Form.Control
                 type="password"
                 value={passwordData.oldPassword}
                 onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                 placeholder="Enter current password"
               />
             </Form.Group>
             <Form.Group className="mb-3">
               <Form.Label>New Password</Form.Label>
               <Form.Control
                 type="password"
                 value={passwordData.newPassword}
                 onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                 placeholder="Enter new password"
               />
             </Form.Group>
             <Form.Group className="mb-3">
               <Form.Label>Confirm New Password</Form.Label>
               <Form.Control
                 type="password"
                 value={passwordData.confirmPassword}
                 onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                 placeholder="Confirm new password"
               />
             </Form.Group>
           </Form>
         </Modal.Body>
         <Modal.Footer>
           <Button 
             variant="primary" 
             onClick={handlePasswordChange}
             disabled={passwordChanging}
           >
             {passwordChanging ? 'Changing...' : 'Change Password'}
           </Button>
           <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
             Cancel
           </Button>
         </Modal.Footer>
       </Modal>

       {/* Profile Modal */}
       <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)}>
         <Modal.Header closeButton>
           <Modal.Title>Admin Profile</Modal.Title>
         </Modal.Header>
         <Modal.Body>
           <Row>
             <Col md={6}>
               <h6>Admin Information</h6>
               <p><strong>Name:</strong> {user?.name}</p>
               <p><strong>Employee ID:</strong> {user?.employee_id}</p>
               <p><strong>Email:</strong> {user?.email}</p>
               <p><strong>Department:</strong> {user?.branch}</p>
             </Col>
             <Col md={6}>
               <h6>Security</h6>
               <Button 
                 variant="primary" 
                 onClick={() => {
                   setShowProfileModal(false);
                   setShowPasswordModal(true);
                 }}
               >
                 Change Password
               </Button>
             </Col>
           </Row>
         </Modal.Body>
         <Modal.Footer>
           <Button variant="secondary" onClick={() => setShowProfileModal(false)}>
             Close
           </Button>
         </Modal.Footer>
       </Modal>

       {/* Message Modal */}
       <Modal show={showMessageModal} onHide={handleMessageModalClose} size="lg">
         <Modal.Header closeButton>
           <Modal.Title>Admin Message</Modal.Title>
         </Modal.Header>
         <Modal.Body>
           {selectedMessage && (
             <div>
               <h6>From: Super Admin</h6>
               <h5 className="mb-3">{selectedMessage.subject}</h5>
               <div className="border p-3 rounded">
                 <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                   {selectedMessage.body}
                 </p>
               </div>
               <small className="text-muted">
                 Sent: {selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Unknown date'}
               </small>
             </div>
           )}
         </Modal.Body>
         <Modal.Footer>
           <Button variant="secondary" onClick={handleMessageModalClose}>
             Close
           </Button>
         </Modal.Footer>
       </Modal>
     </div>
   );
 };

export default AdminDashboard; 
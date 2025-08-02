import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Button, Table, Badge, Form, Alert, Spinner,
  Modal, Dropdown, Tabs, Tab, ButtonGroup
} from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { adminAPI } from '../services/api';

const AdminDashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [analyticsFilters, setAnalyticsFilters] = useState({});
  const [studentFilters, setStudentFilters] = useState({});
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('certificates');

  const COLORS = ['#FF4500', '#28A745', '#FFC107', '#DC3545', '#17A2B8'];

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

  const userBranch = adminCredentials[user?.employee_id]?.branch;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, analyticsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getAnalytics()
      ]);
      
      setDashboardData(dashboardRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      setMessage('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const loadCertificates = async (filters = {}) => {
    try {
      // Add department filter for department-specific admins
      if (userBranch) {
        filters.branch = userBranch;
      }
      const response = await adminAPI.getCertificates(filters);
      setCertificates(response.data.certificates);
    } catch (error) {
      setMessage('Failed to load certificates.');
    }
  };

  const loadStudents = async (filters = {}) => {
    try {
      const params = { branch: userBranch, ...filters };
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
      if (userBranch) {
        filters.branch = userBranch;
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
      const response = await adminAPI.generateReport({
        type,
        ...filters,
        branch: userBranch
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificates_report.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setMessage('Failed to generate report.');
    }
  };

  const handleStudentsDownload = async () => {
    try {
      const params = { branch: userBranch, ...studentFilters };
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
          <h2>👨‍💼 Admin Dashboard</h2>
          <p className="text-muted">Welcome back, {user?.name}!</p>
          {userBranch && (
            <p className="text-info">
              <strong>Department:</strong> {userBranch}
            </p>
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

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab eventKey="certificates" title="📋 Manage Certificates">
          <Card className="dashboard-card">
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h5 className="mb-0">Certificate Management</h5>
                </Col>
                <Col xs="auto">
                  <ButtonGroup>
                    <Button 
                      variant="success" 
                      size="sm"
                      onClick={() => handleBulkAction('approve')}
                      disabled={updating}
                    >
                      ✅ Approve All
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleBulkAction('reject')}
                      disabled={updating}
                    >
                      ❌ Reject All
                    </Button>
                    <Dropdown>
                      <Dropdown.Toggle variant="primary" size="sm">
                        📊 Download Report
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleReportDownload('excel')}>
                          📄 Excel Report
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleReportDownload('pdf')}>
                          📄 PDF Report
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

        <Tab eventKey="analytics" title="📊 Analytics">
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

        <Tab eventKey="students" title="👥 Student Data">
          <Card className="dashboard-card">
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h5 className="mb-0">Student Information</h5>
                  <p className="text-muted mb-0">
                    {userBranch ? `Showing students from ${userBranch}` : 'Showing all students'}
                  </p>
                </Col>
                <Col xs="auto">
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => loadStudents(studentFilters)}
                    className="me-2"
                  >
                    🔄 Refresh Data
                  </Button>
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={() => handleStudentsDownload()}
                  >
                    📊 Download Excel
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
                        📊 Showing {students.length} students 
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
              <p><strong>Certificate:</strong> {selectedCertificate.certificate_name || selectedCertificate.event_type}</p>
              <p><strong>Event Type:</strong> {selectedCertificate.event_type}</p>
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
    </div>
  );
};

export default AdminDashboard; 
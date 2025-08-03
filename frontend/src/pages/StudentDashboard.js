import React, { useState, useEffect, useCallback } from 'react';
import { 
  Row, Col, Card, Button, Form, Modal, Alert, Badge, 
  Table, Spinner
} from 'react-bootstrap';
import { studentAPI } from '../services/api';
import StudentFormDisplay from '../components/StudentFormDisplay';

const StudentDashboard = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [viewCertificateModal, setViewCertificateModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    event_type: '',
    certificate_name: '',
    start_date: '',
    end_date: '',
    certificate: null
  });
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    branch: '',
    section: '',
    year: ''
  });
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const eventTypes = [
    'Internship', 'Hackathon', 'NPTEL', 'Workshop', 'Conference',
    'Competition', 'Training', 'Certification', 'Project', 'Other'
  ];

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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, certificatesRes, formsRes] = await Promise.all([
        studentAPI.getProfile(user.id),
        studentAPI.getCertificates(user.id),
        studentAPI.getForms(user.id)
      ]);
      
      setProfile(profileRes.data);
      setCertificates(certificatesRes.data.certificates);
      setForms(formsRes.data.forms);
    } catch (error) {
      setMessage('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadForm(prev => ({ ...prev, certificate: file }));
    } else {
      setMessage('Please select a valid PDF file.');
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.event_type || !uploadForm.certificate_name || !uploadForm.certificate) {
      setMessage('Please fill all required fields and select a certificate file.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('student_id', user.id);
      formData.append('event_type', uploadForm.event_type);
      formData.append('certificate_name', uploadForm.certificate_name);
      formData.append('start_date', uploadForm.start_date);
      formData.append('end_date', uploadForm.end_date);
      formData.append('certificate', uploadForm.certificate);

      await studentAPI.uploadCertificate(formData);
      
      setMessage('Certificate uploaded successfully!');
      setUploadModal(false);
      setUploadForm({ event_type: '', certificate_name: '', start_date: '', end_date: '', certificate: null });
      loadData(); // Reload certificates
    } catch (error) {
      setMessage(error.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleEditProfile = () => {
    if (!profile) {
      setMessage('Profile data not loaded. Please try again.');
      return;
    }
    
    setEditForm({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      gender: profile.gender || '',
      branch: profile.branch || '',
      section: profile.section || '',
      year: profile.year || ''
    });
    setEditProfileModal(true);
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      await studentAPI.updateProfile({
        student_id: user.id,
        ...editForm
      });
      
      setMessage('Profile updated successfully!');
      setEditProfileModal(false);
      loadData(); // Reload profile data
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewCertificate = (cert) => {
    setSelectedCertificate(cert);
    setViewCertificateModal(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Pending': 'warning',
      'Approved': 'success',
      'Rejected': 'danger'
    };
    return <Badge bg={variants[status]} className="status-badge">{status}</Badge>;
  };

  const handleViewForm = (form) => {
    setSelectedForm(form);
    setShowFormModal(true);
  };

  const handleFormSubmitted = () => {
    loadData(); // Reload forms to update has_responded status
    setShowFormModal(false); // Close the form modal after successful submission
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
          <h2>Student Dashboard</h2>
          <p className="text-muted">Welcome back, {profile?.name}!</p>
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

      <Row>
        {/* Profile Card */}
        <Col lg={4} md={6} className="mb-4">
          <Card className="dashboard-card h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Profile Information</h5>
              {profile && (
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={handleEditProfile}
                >
                  ✏️ Edit Profile
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {profile ? (
                <>
                  <div className="mb-3">
                    <strong>Name:</strong> {profile.name}
                  </div>
                  <div className="mb-3">
                    <strong>Roll Number:</strong> {profile.rollnumber}
                  </div>
                  <div className="mb-3">
                    <strong>Email:</strong> {profile.email}
                  </div>
                  <div className="mb-3">
                    <strong>Phone:</strong> {profile.phone}
                  </div>
                  <div className="mb-3">
                    <strong>Branch:</strong> {profile.branch}
                  </div>
                  <div className="mb-3">
                    <strong>Section:</strong> {profile.section}
                  </div>
                  <div className="mb-3">
                    <strong>Year:</strong> {profile.year}
                  </div>
                  <div className="mb-3">
                    <strong>Gender:</strong> {profile.gender}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-muted">Loading profile information...</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Stats */}
        <Col lg={4} md={6} className="mb-4">
          <Card className="dashboard-card h-100">
            <Card.Header>
              <h5 className="mb-0">Certificate Statistics</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <div className="mb-3">
                  <h3 className="text-primary">{certificates.length}</h3>
                  <p className="text-muted">Total Certificates</p>
                </div>
                <div className="row text-center">
                  <div className="col-4">
                    <h5 className="text-warning">
                      {certificates.filter(c => c.status === 'Pending').length}
                    </h5>
                    <small className="text-muted">Pending</small>
                  </div>
                  <div className="col-4">
                    <h5 className="text-success">
                      {certificates.filter(c => c.status === 'Approved').length}
                    </h5>
                    <small className="text-muted">Approved</small>
                  </div>
                  <div className="col-4">
                    <h5 className="text-danger">
                      {certificates.filter(c => c.status === 'Rejected').length}
                    </h5>
                    <small className="text-muted">Rejected</small>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Upload Certificate */}
        <Col lg={4} md={12} className="mb-4">
          <Card className="dashboard-card h-100">
            <Card.Header>
              <h5 className="mb-0">Upload Certificate</h5>
            </Card.Header>
            <Card.Body className="d-flex flex-column">
              <p className="text-muted mb-3">
                Upload your certificates for approval by the admin.
              </p>
              <Button 
                variant="primary" 
                className="mt-auto"
                onClick={() => setUploadModal(true)}
              >
                Upload New Certificate
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Certificates Table */}
      <Row>
        <Col>
          <Card className="dashboard-card">
            <Card.Header>
              <h5 className="mb-0">My Certificates</h5>
            </Card.Header>
            <Card.Body>
              {certificates.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No certificates uploaded yet.</p>
                  <Button variant="outline-primary" onClick={() => setUploadModal(true)}>
                    Upload Your First Certificate
                  </Button>
                </div>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
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
                            onClick={() => handleViewCertificate(cert)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Forms Section */}
      <Row>
        <Col>
          <Card className="dashboard-card">
            <Card.Header>
              <h5 className="mb-0">Department Forms</h5>
            </Card.Header>
            <Card.Body>
              {forms.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No forms available from your department admin.</p>
                </div>
              ) : (
                <div>
                  {forms.map((form) => (
                    <Card key={form.id} className="mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">{form.title}</h6>
                            {form.description && (
                              <p className="text-muted mb-2">{form.description}</p>
                            )}
                            <div className="mb-2">
                              <small className="text-muted">
                                <strong>Deadline:</strong> {new Date(form.deadline).toLocaleString()}
                              </small>
                            </div>
                            <div className="mb-2">
                              <small className="text-muted">
                                <strong>Created:</strong> {new Date(form.created_at).toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                          <div className="text-end">
                            {form.has_responded ? (
                              <Badge bg="success">Completed</Badge>
                            ) : new Date(form.deadline) < new Date() ? (
                              <Badge bg="danger">Deadline Passed</Badge>
                            ) : (
                              <Badge bg="warning">Pending</Badge>
                            )}
                            <br />
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handleViewForm(form)}
                              className="mt-2"
                            >
                              {form.has_responded ? 'View Form' : 'Fill Form'}
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Upload Modal */}
      <Modal show={uploadModal} onHide={() => setUploadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Upload Certificate</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Certificate Name *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter certificate name"
                    value={uploadForm.certificate_name}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, certificate_name: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Event Type *</Form.Label>
                  <Form.Select
                    value={uploadForm.event_type}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, event_type: e.target.value }))}
                  >
                    <option value="">Select event type</option>
                    {eventTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={uploadForm.start_date}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={uploadForm.end_date}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Certificate File *</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
              />
              <Form.Text className="text-muted">
                Only PDF files are allowed. Maximum size: 10MB
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setUploadModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpload}
            disabled={uploading || !uploadForm.event_type || !uploadForm.certificate_name || !uploadForm.certificate}
          >
            {uploading ? 'Uploading...' : 'Upload Certificate'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal show={editProfileModal} onHide={() => setEditProfileModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>✏️ Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number *</Form.Label>
                  <Form.Control
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender *</Form.Label>
                  <Form.Select
                    value={editForm.gender}
                    onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Branch *</Form.Label>
                  <Form.Select
                    value={editForm.branch}
                    onChange={(e) => setEditForm(prev => ({ ...prev, branch: e.target.value }))}
                  >
                    <option value="">Select branch</option>
                    {branches.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Section *</Form.Label>
                  <Form.Select
                    value={editForm.section}
                    onChange={(e) => setEditForm(prev => ({ ...prev, section: e.target.value }))}
                  >
                    <option value="">Select section</option>
                    {sections.map(section => (
                      <option key={section} value={section}>Section {section}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Year of Study *</Form.Label>
                  <Form.Select
                    value={editForm.year}
                    onChange={(e) => setEditForm(prev => ({ ...prev, year: e.target.value }))}
                  >
                    <option value="">Select year</option>
                    {years.map(year => (
                      <option key={year} value={year}>Year {year}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditProfileModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateProfile}
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Update Profile'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Certificate Modal */}
      <Modal show={viewCertificateModal} onHide={() => setViewCertificateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Certificate Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCertificate && (
            <div>
              <Row>
                <Col md={6}>
                  <p><strong>Certificate Name:</strong> {selectedCertificate.certificate_name || selectedCertificate.event_type}</p>
                  <p><strong>Event Type:</strong> {selectedCertificate.event_type}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedCertificate.status)}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Start Date:</strong> {selectedCertificate.start_date || 'N/A'}</p>
                  <p><strong>End Date:</strong> {selectedCertificate.end_date || 'N/A'}</p>
                  <p><strong>Uploaded:</strong> {selectedCertificate.uploaded_at}</p>
                </Col>
              </Row>
              <div className="mt-3">
                <p><strong>Certificate File:</strong></p>
                {selectedCertificate.file_path && (
                  <div>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      className="me-2"
                      onClick={() => {
                        const url = `http://localhost:5000/api/student/certificate/${selectedCertificate.id}/download`;
                        window.open(url, '_blank');
                      }}
                    >
                      Download Certificate
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => {
                        const url = `http://localhost:5000/api/student/certificate/${selectedCertificate.id}/view`;
                        window.open(url, '_blank');
                      }}
                    >
                      View Certificate
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setViewCertificateModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Form Modal */}
      <Modal show={showFormModal} onHide={() => setShowFormModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>{selectedForm?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedForm && (
            <StudentFormDisplay
              form={selectedForm}
              studentId={user.id}
              onFormSubmitted={handleFormSubmitted}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default StudentDashboard; 
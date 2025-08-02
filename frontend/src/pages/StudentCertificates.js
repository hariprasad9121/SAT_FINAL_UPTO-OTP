import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Button, Form, Modal, Alert, Badge, 
  Table, Spinner
} from 'react-bootstrap';
import { studentAPI } from '../services/api';

const StudentCertificates = ({ user }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [viewCertificateModal, setViewCertificateModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    event_type: '',
    certificate_name: '',
    start_date: '',
    end_date: '',
    certificate: null
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const eventTypes = [
    'Internship', 'Hackathon', 'NPTEL', 'Workshop', 'Conference',
    'Competition', 'Training', 'Certification', 'Project', 'Other'
  ];

  useEffect(() => {
    loadCertificates();
  }, [user.id]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getCertificates(user.id);
      setCertificates(response.data.certificates);
    } catch (error) {
      setMessage('Failed to load certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      // Clear form data after successful upload
      setUploadForm({ event_type: '', certificate_name: '', start_date: '', end_date: '', certificate: null });
      loadCertificates(); // Reload certificates
    } catch (error) {
      setMessage(error.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
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
          <h2>📋 Manage Certificates</h2>
          <p className="text-muted">Upload and manage your certificates</p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={() => setUploadModal(true)}
          >
            📤 Upload New Certificate
          </Button>
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

      {/* Certificate Statistics */}
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <Card className="dashboard-card">
            <Card.Body className="text-center">
              <h3 className="text-primary">{certificates.length}</h3>
              <p className="text-muted mb-0">Total Certificates</p>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="dashboard-card">
            <Card.Body className="text-center">
              <h3 className="text-warning">
                {certificates.filter(c => c.status === 'Pending').length}
              </h3>
              <p className="text-muted mb-0">Pending</p>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="dashboard-card">
            <Card.Body className="text-center">
              <h3 className="text-success">
                {certificates.filter(c => c.status === 'Approved').length}
              </h3>
              <p className="text-muted mb-0">Approved</p>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="dashboard-card">
            <Card.Body className="text-center">
              <h3 className="text-danger">
                {certificates.filter(c => c.status === 'Rejected').length}
              </h3>
              <p className="text-muted mb-0">Rejected</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Certificates Table */}
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

      {/* Upload Modal */}
      <Modal show={uploadModal} onHide={() => setUploadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📤 Upload Certificate</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form autoComplete="off">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Certificate Name *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter certificate name"
                    value={uploadForm.certificate_name}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, certificate_name: e.target.value }))}
                    autoComplete="off"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Event Type *</Form.Label>
                  <Form.Select
                    value={uploadForm.event_type}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, event_type: e.target.value }))}
                    autoComplete="off"
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
                    autoComplete="off"
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
                    autoComplete="off"
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
                autoComplete="off"
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

      {/* View Certificate Modal */}
      <Modal show={viewCertificateModal} onHide={() => setViewCertificateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📄 Certificate Details</Modal.Title>
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
                      onClick={async () => {
                        try {
                          const response = await studentAPI.downloadCertificate(selectedCertificate.id);
                          const blob = new Blob([response.data], { type: 'application/pdf' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `certificate_${selectedCertificate.id}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } catch (error) {
                          console.error('Download error:', error);
                          alert('Error downloading certificate');
                        }
                      }}
                    >
                      📄 Download Certificate
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await studentAPI.downloadCertificate(selectedCertificate.id);
                          const blob = new Blob([response.data], { type: 'application/pdf' });
                          const url = window.URL.createObjectURL(blob);
                          window.open(url, '_blank');
                        } catch (error) {
                          console.error('View error:', error);
                          alert('Error viewing certificate');
                        }
                      }}
                    >
                      👁️ View Certificate
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
    </div>
  );
};

export default StudentCertificates; 
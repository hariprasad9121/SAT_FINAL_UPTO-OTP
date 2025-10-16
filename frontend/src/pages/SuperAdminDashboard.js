import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Table, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { superAdminAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const departments = [
  { key: 'COMPUTER SCIENCE AND ENGINEERING', label: 'CSE' },
  { key: 'COMPUTER SCIENCE AND ENGINEERING [DATA SCIENCE]', label: 'CSD' },
  { key: 'COMPUTER SCIENCE AND ENGINEERING [AIML]', label: 'CSM' },
  { key: 'ELECTRICAL AND ELECTRONICS OF COMMUNICATION ENGINEERING', label: 'ECE' },
  { key: 'ELECTRICAL AND ELECTRONICS ENGINEERING', label: 'EEE' },
  { key: 'CIVIL ENGINEERING', label: 'CIV' },
  { key: 'MECHANICAL ENGINEERING', label: 'MECH' },
];

const SuperAdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [message, setMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');

  const loadAdmins = async () => {
    try {
      const res = await superAdminAPI.listAdmins();
      setAdmins(res.data.admins || []);
    } catch (error) {
      setMessage('Failed to load admins.');
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleGoToDept = (branch) => {
    // Navigate to admin dashboard with branch filter
    navigate('/admin/dashboard', { 
      state: { 
        forceBranch: branch,
        superAdminView: true,
        departmentName: departments.find(d => d.key === branch)?.label || branch
      } 
    });
  };

  const openPasswordModal = (admin) => {
    setSelectedAdmin(admin);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const saveNewPassword = async () => {
    if (!selectedAdmin || !newPassword) return;
    try {
      await superAdminAPI.changeAdminPassword(selectedAdmin.id, newPassword);
      setMessage('Admin password updated successfully!');
      setShowPasswordModal(false);
    } catch (error) {
      setMessage('Failed to update password.');
    }
  };

  const deleteAdmin = async (admin) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await superAdminAPI.deleteAdmin(admin.id);
      setMessage('Admin deleted successfully!');
      loadAdmins();
    } catch (error) {
      setMessage('Failed to delete admin.');
    }
  };

  const openMessageModal = (admin) => {
    setSelectedAdmin(admin);
    setMsgSubject('');
    setMsgBody('');
    setShowMessageModal(true);
  };

  const sendMessage = async () => {
    if (!selectedAdmin || !msgSubject || !msgBody) return;
    try {
      await superAdminAPI.sendMessageToAdmin(selectedAdmin.id, msgSubject, msgBody);
      setMessage('Message sent to admin!');
      setShowMessageModal(false);
    } catch (error) {
      setMessage('Failed to send message.');
    }
  };

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h2>Super Admin Dashboard</h2>
          <p className="text-muted">Manage department admins and navigate to department dashboards</p>
        </Col>
      </Row>

      {message && (
        <Alert 
          variant={message.includes('success') ? 'success' : 'danger'}
          dismissible
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      <Row className="mb-4">
        {departments.map(dep => (
          <Col key={dep.key} lg={3} md={4} sm={6} className="mb-3">
            <Card className="dashboard-card h-100">
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{dep.label}</h5>
                  <Badge bg="primary">Dept</Badge>
                </div>
                <div className="text-muted mt-2" style={{ minHeight: 40 }}>
                  <small>{dep.key}</small>
                </div>
                <Button 
                  variant="outline-primary" 
                  className="mt-auto"
                  onClick={() => handleGoToDept(dep.key)}
                >
                  Open Dashboard
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="dashboard-card">
        <Card.Header>
          <h5 className="mb-0">Admins</h5>
        </Card.Header>
        <Card.Body>
          <Table responsive>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Admin ID</th>
                <th>Branch</th>
                <th>Change Password</th>
                <th>Delete Admin</th>
                <th>Send Message</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a, idx) => (
                <tr key={a.id}>
                  <td>{idx + 1}</td>
                  <td>{a.employee_id}</td>
                  <td>{a.branch}</td>
                  <td>
                    <Button size="sm" variant="outline-primary" onClick={() => openPasswordModal(a)}>
                      Change Password
                    </Button>
                  </td>
                  <td>
                    <Button size="sm" variant="outline-danger" onClick={() => deleteAdmin(a)}>
                      Delete
                    </Button>
                  </td>
                  <td>
                    <Button size="sm" variant="outline-secondary" onClick={() => openMessageModal(a)}>
                      Send Message
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change Admin Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={saveNewPassword} disabled={!newPassword}>Save</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showMessageModal} onHide={() => setShowMessageModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Send Message to Admin</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Message</Form.Label>
              <Form.Control as="textarea" rows={4} value={msgBody} onChange={(e) => setMsgBody(e.target.value)} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMessageModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={sendMessage} disabled={!msgSubject || !msgBody}>Send</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SuperAdminDashboard;



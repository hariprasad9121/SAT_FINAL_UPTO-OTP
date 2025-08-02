import React from 'react';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const NavigationBar = ({ user, userType, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand href="#" className="fw-bold">
          🎓 SAT Portal
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              href="#" 
              onClick={() => handleNavigation(userType === 'student' ? '/student/dashboard' : '/admin/dashboard')}
            >
              Dashboard
            </Nav.Link>
            {userType === 'student' && (
              <Nav.Link href="#" onClick={() => handleNavigation('/student/certificates')}>
                Manage Certificates
              </Nav.Link>
            )}
          </Nav>
          
          <Nav className="ms-auto">
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-primary" id="dropdown-basic">
                👤 {user?.name || 'User'}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Header>
                  <strong>{userType === 'student' ? 'Student' : 'Admin'}</strong>
                  <br />
                  <small className="text-muted">
                    {userType === 'student' 
                      ? `Roll: ${user?.rollnumber}` 
                      : `ID: ${user?.employee_id}`
                    }
                  </small>
                  {userType === 'admin' && user?.branch && (
                    <>
                      <br />
                      <small className="text-muted">
                        Dept: {user.branch}
                      </small>
                    </>
                  )}
                </Dropdown.Header>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => handleNavigation('/profile')}>
                  📋 Profile
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  🚪 Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar; 
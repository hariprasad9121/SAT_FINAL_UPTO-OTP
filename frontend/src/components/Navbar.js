import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Dropdown, Badge } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { studentAPI, adminAPI } from '../services/api';

const NavigationBar = ({ user, userType, onLogout, onShowProfile, onShowMessage }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState({ unresponded_count: 0, forms: [] });
  const [adminMessages, setAdminMessages] = useState([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    if (userType === 'student' && user?.id) {
      const loadNotifications = async () => {
        try {
          const response = await studentAPI.getFormNotifications(user.id);
          setNotifications(response.data);
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      };

      loadNotifications();
      // Refresh notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    } else if (userType === 'admin' && user?.id) {
      const loadAdminMessages = async () => {
        try {
          const response = await adminAPI.getAdminMessages(user.id);
          setAdminMessages(response.data.messages || []);
          setUnreadMessageCount(response.data.unread_count || 0);
        } catch (error) {
          console.error('Failed to load admin messages:', error);
        }
      };

      loadAdminMessages();
      // Refresh messages every 30 seconds
      const interval = setInterval(loadAdminMessages, 30000);
      
      // Listen for refresh events
      const handleRefresh = () => {
        loadAdminMessages();
      };
      window.addEventListener('refreshMessages', handleRefresh);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('refreshMessages', handleRefresh);
      };
    }
  }, [userType, user?.id]);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    console.log('Navigating to:', path);
    navigate(path);
  };

  // Determine the correct dashboard path based on current location and user type
  const getDashboardPath = () => {
    console.log('getDashboardPath - userType:', userType, 'location:', location.pathname);
    if (userType === 'student') {
      return '/student/dashboard';
    } else if (userType === 'superadmin') {
      // If we're in the main super admin dashboard, stay there
      if (location.pathname === '/superadmin/dashboard') {
        console.log('Already in super admin dashboard, staying here');
        return '/superadmin/dashboard';
      }
      // If we're in department view or anywhere else, go to main super admin dashboard
      console.log('Not in main super admin dashboard, navigating to /superadmin/dashboard');
      return '/superadmin/dashboard';
    } else {
      return '/admin/dashboard';
    }
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand 
          href="#" 
          className="fw-bold"
          onClick={(e) => {
            e.preventDefault();
            if (userType === 'superadmin') {
              // Force navigation to super admin dashboard
              console.log('Super admin clicking SAT Portal, navigating to /superadmin/dashboard');
              navigate('/superadmin/dashboard', { replace: true });
            } else {
              handleNavigation(getDashboardPath());
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          SAT Portal
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                if (userType === 'superadmin') {
                  // Force navigation to super admin dashboard
                  console.log('Super admin clicking Dashboard, navigating to /superadmin/dashboard');
                  navigate('/superadmin/dashboard', { replace: true });
                } else {
                  handleNavigation(getDashboardPath());
                }
              }}
            >
              Dashboard
            </Nav.Link>
            {userType === 'student' && (
              <Nav.Link href="#" onClick={() => handleNavigation('/student/certificates')}>
                Manage Certificates
              </Nav.Link>
            )}
            {userType === 'superadmin' && (
              <Nav.Link 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation('/superadmin/dashboard');
                }}
              >
                Super Admin Dashboard
              </Nav.Link>
            )}
          </Nav>
          
          <Nav className="ms-auto">
            {userType === 'student' && (
              <Dropdown align="end" className="me-2">
                <Dropdown.Toggle variant="outline-secondary" id="notifications-dropdown">
                  📢 Notifications
                  {notifications.unresponded_count > 0 && (
                    <Badge bg="danger" className="ms-1">
                      {notifications.unresponded_count}
                    </Badge>
                  )}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Header>
                    <strong>Form Notifications</strong>
                  </Dropdown.Header>
                  {notifications.forms.length === 0 ? (
                    <Dropdown.Item disabled>
                      No pending forms
                    </Dropdown.Item>
                  ) : (
                    notifications.forms.map((form) => (
                      <Dropdown.Item 
                        key={form.id}
                        onClick={() => {
                          navigate('/student/dashboard');
                          // The form modal will be opened from the dashboard
                        }}
                      >
                        <div>
                          <strong>{form.title}</strong>
                          <br />
                          <small className="text-muted">
                            Deadline: {new Date(form.deadline).toLocaleDateString()}
                          </small>
                        </div>
                      </Dropdown.Item>
                    ))
                  )}
                </Dropdown.Menu>
              </Dropdown>
            )}
            
            {userType === 'admin' && (
              <Dropdown align="end" className="me-2">
                <Dropdown.Toggle variant="outline-secondary" id="admin-messages-dropdown">
                  Notifications
                  {unreadMessageCount > 0 && (
                    <Badge bg="danger" className="ms-1">
                      {unreadMessageCount}
                    </Badge>
                  )}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Header>
                    <strong>Admin Messages</strong>
                  </Dropdown.Header>
                  {adminMessages.length === 0 ? (
                    <Dropdown.Item disabled>
                      No messages
                    </Dropdown.Item>
                  ) : (
                    <>
                      {adminMessages.map((message) => (
                      <Dropdown.Item 
                        key={message.id}
                        onClick={async () => {
                          try {
                            // Mark as read and show message details
                            await adminAPI.markAdminMessageAsRead(message.id);
                            
                            // Update local state
                            setUnreadMessageCount(prev => Math.max(0, prev - 1));
                            setAdminMessages(prev => 
                              prev.map(msg => 
                                msg.id === message.id ? { ...msg, is_read: true } : msg
                              )
                            );
                            
                            // Dispatch custom event to show message
                            const event = new CustomEvent('showMessage', {
                              detail: { message: { ...message, is_read: true } }
                            });
                            window.dispatchEvent(event);
                          } catch (error) {
                            console.error('Failed to mark message as read:', error);
                          }
                        }}
                        className={!message.is_read ? 'fw-bold' : ''}
                      >
                        <div>
                          <strong>{message.subject}</strong>
                          <br />
                          <small className="text-muted">
                            From: Super Admin
                            <br />
                            {message.created_at ? new Date(message.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Unknown date'}
                          </small>
                        </div>
                      </Dropdown.Item>
                      ))}
                      <Dropdown.Divider />
                      <Dropdown.Item 
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to clear all messages?')) {
                            try {
                              // Clear all messages by marking them as read
                              for (const message of adminMessages) {
                                if (!message.is_read) {
                                  await adminAPI.markAdminMessageAsRead(message.id);
                                }
                              }
                              setAdminMessages(prev => 
                                prev.map(msg => ({ ...msg, is_read: true }))
                              );
                              setUnreadMessageCount(0);
                            } catch (error) {
                              console.error('Failed to clear messages:', error);
                            }
                          }
                        }}
                        className="text-danger"
                      >
                        🗑️ Clear All Messages
                      </Dropdown.Item>
                    </>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            )}
            
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-primary" id="dropdown-basic">
                 {user?.name || 'User'}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Header>
                  <strong>
                    {userType === 'student' ? 'Student' : 
                     userType === 'superadmin' ? 'Super Admin' : 'Admin'}
                  </strong>
                  <br />
                  <small className="text-muted">
                    {userType === 'student' 
                      ? `Roll: ${user?.rollnumber}` 
                      : `ID: ${user?.employee_id}`
                    }
                  </small>
                  {(userType === 'admin' || userType === 'superadmin') && user?.branch && (
                    <>
                      <br />
                      <small className="text-muted">
                        Dept: {user.branch}
                      </small>
                    </>
                  )}
                </Dropdown.Header>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => onShowProfile && onShowProfile()}>
                   Profile
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                   Logout
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
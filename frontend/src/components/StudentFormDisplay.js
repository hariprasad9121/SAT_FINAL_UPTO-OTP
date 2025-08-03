import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { studentAPI } from '../services/api';

const StudentFormDisplay = ({ form, studentId, onFormSubmitted }) => {
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submittedResponses, setSubmittedResponses] = useState(null);
  const [loadingResponses, setLoadingResponses] = useState(false);

  // Load submitted responses if student has already responded
  useEffect(() => {
    if (form.has_responded) {
      loadSubmittedResponses();
    }
  }, [form.id]);

  const loadSubmittedResponses = async () => {
    setLoadingResponses(true);
    try {
      const response = await studentAPI.getFormResponse(form.id, studentId);
      setSubmittedResponses(response.data);
    } catch (error) {
      console.error('Failed to load submitted responses:', error);
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleInputChange = (fieldId, value) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleCheckboxChange = (fieldId, value, checked) => {
    setResponses(prev => {
      const currentValues = prev[fieldId] || [];
      if (checked) {
        return {
          ...prev,
          [fieldId]: [...currentValues, value]
        };
      } else {
        return {
          ...prev,
          [fieldId]: currentValues.filter(v => v !== value)
        };
      }
    });
  };

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = form.form_fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => {
      const value = responses[field.id];
      return !value || (Array.isArray(value) && value.length === 0);
    });

    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await studentAPI.submitFormResponse(form.id, {
        student_id: studentId,
        responses
      });

      setSuccess('Form submitted successfully!');
      onFormSubmitted();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const fieldId = field.id;
    const value = responses[fieldId];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Form.Control
            type={field.type}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldId, e.target.value)}
            placeholder={`Enter ${field.label}`}
            required={field.required}
          />
        );
      
      case 'textarea':
        return (
          <Form.Control
            as="textarea"
            rows={3}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldId, e.target.value)}
            placeholder={`Enter ${field.label}`}
            required={field.required}
          />
        );
      
      case 'date':
        return (
          <Form.Control
            type="date"
            value={value || ''}
            onChange={(e) => handleInputChange(fieldId, e.target.value)}
            required={field.required}
          />
        );
      
      case 'file':
        return (
          <div>
            <Form.Control
              type="file"
              accept=".pdf"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  try {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('student_id', studentId);
                    formData.append('field_id', fieldId);
                    
                    const response = await studentAPI.uploadFormFile(form.id, formData);
                    handleInputChange(fieldId, response.data.filename);
                  } catch (error) {
                    setError('Failed to upload file: ' + (error.response?.data?.error || error.message));
                  }
                }
              }}
              required={field.required}
            />
            {value && (
              <small className="text-success mt-1 d-block">
                File uploaded: {value}
              </small>
            )}
          </div>
        );
      
      case 'radio':
        return (
          <div>
            {field.options.map((option, index) => (
              <Form.Check
                key={index}
                type="radio"
                label={option}
                name={`field-${fieldId}`}
                checked={value === option}
                onChange={(e) => handleInputChange(fieldId, option)}
                required={field.required}
              />
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div>
            {field.options.map((option, index) => (
              <Form.Check
                key={index}
                type="checkbox"
                label={option}
                checked={Array.isArray(value) && value.includes(option)}
                onChange={(e) => handleCheckboxChange(fieldId, option, e.target.checked)}
              />
            ))}
          </div>
        );
      
      case 'select':
        return (
          <Form.Select
            value={value || ''}
            onChange={(e) => handleInputChange(fieldId, e.target.value)}
            required={field.required}
          >
            <option value="">Select an option</option>
            {field.options.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </Form.Select>
        );
      
      default:
        return null;
    }
  };

  const isDeadlinePassed = new Date(form.deadline) < new Date();

  // Show submitted responses if student has already responded
  if (form.has_responded) {
    return (
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{form.title} - Your Response</h5>
            <div>
              <Badge bg="info">Submitted</Badge>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {form.description && (
            <p className="text-muted mb-3">{form.description}</p>
          )}
          
          <div className="mb-3">
            <strong>Deadline:</strong> {new Date(form.deadline).toLocaleString()}
          </div>

          {loadingResponses ? (
            <div className="text-center">
              <p>Loading your submitted responses...</p>
            </div>
          ) : submittedResponses ? (
            <div>
              <div className="mb-3">
                <strong>Submitted on:</strong> {new Date(submittedResponses.submitted_at).toLocaleString()}
              </div>
              
              <h6>Your Responses:</h6>
              {form.form_fields.map((field) => {
                const fieldId = field.id.toString();
                const value = submittedResponses.responses[fieldId];
                
                return (
                  <div key={field.id} className="mb-3 p-3 border rounded">
                    <strong>{field.label}:</strong>
                    <div className="mt-1">
                      {Array.isArray(value) ? value.join(', ') : (value || 'No response')}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Alert variant="warning">Unable to load your submitted responses.</Alert>
          )}
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{form.title}</h5>
          <div>
            {isDeadlinePassed ? (
              <Badge bg="danger">Deadline Passed</Badge>
            ) : (
              <Badge bg="success">Active</Badge>
            )}
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {form.description && (
          <p className="text-muted mb-3">{form.description}</p>
        )}
        
        <div className="mb-3">
          <strong>Deadline:</strong> {new Date(form.deadline).toLocaleString()}
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form>
          {form.form_fields.map((field) => (
            <Form.Group key={field.id} className="mb-3">
              <Form.Label>
                {field.label}
                {field.required && <span className="text-danger"> *</span>}
              </Form.Label>
              {renderField(field)}
            </Form.Group>
          ))}

          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || isDeadlinePassed}
          >
            {loading ? 'Submitting...' : 'Submit Form'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default StudentFormDisplay; 
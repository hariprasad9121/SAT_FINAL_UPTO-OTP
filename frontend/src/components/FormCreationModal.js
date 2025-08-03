import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import { adminAPI } from '../services/api';

const FormCreationModal = ({ show, onHide, onFormCreated, user }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    form_fields: []
  });
  const [currentField, setCurrentField] = useState({
    type: 'text',
    label: '',
    required: false,
    options: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'file', label: 'File Upload' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'select', label: 'Dropdown' }
  ];

  const handleAddField = () => {
    if (!currentField.label.trim()) {
      setError('Field label is required');
      return;
    }

    if (['radio', 'checkbox', 'select'].includes(currentField.type) && currentField.options.length === 0) {
      setError('Options are required for this field type');
      return;
    }

    const newField = {
      id: Date.now(),
      ...currentField,
      options: currentField.options.filter(opt => opt.trim() !== '')
    };

    setFormData(prev => ({
      ...prev,
      form_fields: [...prev.form_fields, newField]
    }));

    setCurrentField({
      type: 'text',
      label: '',
      required: false,
      options: []
    });
    setError('');
  };

  const handleRemoveField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      form_fields: prev.form_fields.filter(field => field.id !== fieldId)
    }));
  };

  const handleAddOption = () => {
    setCurrentField(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const handleOptionChange = (index, value) => {
    setCurrentField(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleRemoveOption = (index) => {
    setCurrentField(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Form title is required');
      return;
    }

    if (!formData.deadline) {
      setError('Deadline is required');
      return;
    }

    if (formData.form_fields.length === 0) {
      setError('At least one field is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await adminAPI.createForm({
        ...formData,
        admin_id: user.id
      });

             // Form created successfully
      onFormCreated();
      onHide();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        deadline: '',
        form_fields: []
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create form');
    } finally {
      setLoading(false);
    }
  };

  const renderFieldPreview = (field) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return <Form.Control type={field.type} placeholder={`Enter ${field.label}`} disabled />;
      case 'textarea':
        return <Form.Control as="textarea" rows={3} placeholder={`Enter ${field.label}`} disabled />;
      case 'date':
        return <Form.Control type="date" disabled />;
      case 'file':
        return <Form.Control type="file" disabled />;
      case 'radio':
        return (
          <div>
            {field.options.map((option, index) => (
              <Form.Check
                key={index}
                type="radio"
                label={option}
                name={`preview-${field.id}`}
                disabled
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
                disabled
              />
            ))}
          </div>
        );
      case 'select':
        return (
          <Form.Select disabled>
            <option>Select an option</option>
            {field.options.map((option, index) => (
              <option key={index}>{option}</option>
            ))}
          </Form.Select>
        );
      default:
        return null;
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Create New Form</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Row>
          <Col md={6}>
            <Card>
              <Card.Header>
                <h6>Form Details</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Form Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter form title"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter form description"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Deadline *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="mt-3">
              <Card.Header>
                <h6>Add Form Field</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Field Type</Form.Label>
                  <Form.Select
                    value={currentField.type}
                    onChange={(e) => setCurrentField(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {fieldTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Field Label *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentField.label}
                    onChange={(e) => setCurrentField(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="Enter field label"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Required field"
                    checked={currentField.required}
                    onChange={(e) => setCurrentField(prev => ({ ...prev, required: e.target.checked }))}
                  />
                </Form.Group>

                {['radio', 'checkbox', 'select'].includes(currentField.type) && (
                  <Form.Group className="mb-3">
                    <Form.Label>Options</Form.Label>
                    {currentField.options.map((option, index) => (
                      <Row key={index} className="mb-2">
                        <Col>
                          <Form.Control
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                          />
                        </Col>
                        <Col xs="auto">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveOption(index)}
                          >
                            Remove
                          </Button>
                        </Col>
                      </Row>
                    ))}
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={handleAddOption}
                    >
                      Add Option
                    </Button>
                  </Form.Group>
                )}

                <Button
                  variant="primary"
                  onClick={handleAddField}
                  disabled={!currentField.label.trim()}
                >
                  Add Field
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card>
              <Card.Header>
                <h6>Form Preview</h6>
              </Card.Header>
              <Card.Body>
                {formData.title && (
                  <h5 className="mb-3">{formData.title}</h5>
                )}
                
                {formData.description && (
                  <p className="text-muted mb-3">{formData.description}</p>
                )}

                {formData.form_fields.map((field, index) => (
                  <div key={field.id} className="mb-3 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Form.Label className="mb-0">
                        {field.label}
                        {field.required && <span className="text-danger"> *</span>}
                      </Form.Label>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemoveField(field.id)}
                      >
                        Remove
                      </Button>
                    </div>
                    {renderFieldPreview(field)}
                  </div>
                ))}

                {formData.form_fields.length === 0 && (
                  <p className="text-muted text-center">No fields added yet</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || !formData.title || !formData.deadline || formData.form_fields.length === 0}
        >
          {loading ? 'Creating...' : 'Create Form'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FormCreationModal; 
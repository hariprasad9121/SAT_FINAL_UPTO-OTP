import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authAPI = {
  sendRegistrationOTP: (data) => api.post('/auth/student/send-otp', data),
  studentRegister: (data) => api.post('/auth/student/register', data),
  studentLogin: (credentials) => api.post('/auth/student/login', credentials),
  adminLogin: (credentials) => api.post('/auth/admin/login', credentials),
  forgotPassword: (data) => api.post('/auth/student/forgot-password', data),
  resetPassword: (data) => api.post('/auth/student/reset-password', data),
};

// Student API
export const studentAPI = {
  getProfile: (studentId) => api.get(`/student/profile?student_id=${studentId}`),
  updateProfile: (data) => api.put('/student/profile', data),
  uploadCertificate: (formData) => {
    return api.post('/student/certificate/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getCertificates: (studentId) => api.get(`/student/certificates?student_id=${studentId}`),
  downloadCertificate: (certificateId) => api.get(`/student/certificate/${certificateId}/download`, {
    responseType: 'blob',
  }),
  viewCertificate: (certificateId) => api.get(`/student/certificate/${certificateId}/view`, {
    responseType: 'blob',
  }),
  // Form Management
  getForms: (studentId) => api.get(`/student/forms?student_id=${studentId}`),
  submitFormResponse: (formId, data) => api.post(`/student/forms/${formId}/submit`, data),
  uploadFormFile: (formId, formData) => {
    return api.post(`/student/forms/${formId}/upload-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getFormNotifications: (studentId) => api.get(`/student/forms/notifications?student_id=${studentId}`),
  getFormResponse: (formId, studentId) => api.get(`/student/forms/${formId}/response?student_id=${studentId}`),
};

// Admin API
export const adminAPI = {
  getDashboard: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/admin/dashboard?${params}`);
  },
  getCertificates: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/admin/certificates?${params}`);
  },
  getStudents: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/admin/students?${params}`);
  },
  downloadStudentsExcel: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/admin/students/download?${params}`, {
      responseType: 'blob',
    });
  },
  updateCertificateStatus: (data) => api.put('/admin/certificate/status', data),
  bulkUpdateStatus: (data) => api.put('/admin/certificate/bulk-status', data),
  getAnalytics: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/admin/analytics?${params}`);
  },
  generateReport: (params) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`/admin/report?${queryParams}`, {
      responseType: 'blob',
    });
  },
  // Form Management
  createForm: (data) => api.post('/admin/forms', data),
  getForms: (adminId) => api.get(`/admin/forms?admin_id=${adminId}`),
  getFormResponses: (formId, adminId) => api.get(`/admin/forms/${formId}/responses?admin_id=${adminId}`),
  downloadFormResponses: (formId, adminId) => api.get(`/admin/forms/${formId}/responses/download?admin_id=${adminId}`, {
    responseType: 'blob',
  }),
  getUnsubmittedStudents: (formId, adminId, params = {}) => {
    const qp = new URLSearchParams({ ...params, admin_id: adminId });
    return api.get(`/admin/forms/${formId}/unsubmitted?${qp.toString()}`);
  },
  downloadUnsubmittedStudents: (formId, adminId, params = {}) => {
    const qp = new URLSearchParams({ ...params, admin_id: adminId });
    return api.get(`/admin/forms/${formId}/unsubmitted/download?${qp.toString()}`, {
      responseType: 'blob',
    });
  },
  sendDeadlineReminders: (adminId) => api.post(`/admin/forms/send-deadline-reminders?admin_id=${adminId}`),
  deleteForm: (formId, adminId) => api.delete(`/admin/forms/${formId}?admin_id=${adminId}`),
  changePassword: (data, adminId) => api.put('/admin/change-password', data, {
    headers: { 'X-Admin-ID': adminId }
  }),
};

// Super Admin API
export const superAdminAPI = {
  listAdmins: () => api.get('/superadmin/admins'),
  changeAdminPassword: (adminId, newPassword) => api.put(`/superadmin/admins/${adminId}/password`, { new_password: newPassword }),
  deleteAdmin: (adminId) => api.delete(`/superadmin/admins/${adminId}`),
  sendMessageToAdmin: (adminId, subject, body) => api.post('/superadmin/messages', { admin_id: adminId, subject, body }),
};

export default api; 
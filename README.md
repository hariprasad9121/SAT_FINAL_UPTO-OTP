# SAT Portal - Student Achievement Tracker

A comprehensive web application for managing student certificates and achievements with department-specific admin access.

## Features

### Student Features
- **Enhanced Registration**: 
  - 10-character alphanumeric roll numbers (e.g., 224G1A3224)
  - Updated branch names with full department names
  - Sections A-H
  - Year of study (I, II, III, IV)
  - Enter key functionality for form submission

- **Student Dashboard**:
  - Edit profile functionality
  - Enhanced certificate upload with certificate name, start date, and end date
  - View certificate details with download option
  - Certificate history display

### Admin Features
- **Department-Specific Access**: Each department has its own admin account
- **Certificate Management**: 
  - Approve/Reject all certificates at once
  - Enhanced filtering options
  - Department-specific certificate viewing
- **Analytics**: 
  - Filtered analytics by year, branch, and event type
  - Color-coded status indicators (Green=Approved, Red=Rejected, Yellow=Pending)
- **Student Data Management**: View all students from respective departments
- **Enhanced Reports**: 
  - PDF reports with SRIT watermark
  - Orange/white color scheme
  - A4 page formatting

## Admin Credentials

| Department | Username | Password |
|------------|----------|----------|
| Computer Science and Engineering | admin@cse | Cse@srit |
| Computer Science and Engineering [DATA SCIENCE] | admin@csd | Csd@srit |
| Computer Science and Engineering [AIML] | admin@csm | Csm@srit |
| Electrical and Electronics of Communication Engineering | admin@ece | Ece@srit |
| Electrical and Electronics Engineering | admin@eee | Eee@srit |
| Civil Engineering | admin@civ | Civ@srit |
| Mechanical Engineering | admin@mech | Mech@srit |

## Installation and Setup

### Prerequisites
- Python 3.7+
- Node.js 14+
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Initialize the database:
   ```bash
   python init_db.py
   ```

4. Run the Flask server:
   ```bash
   python app.py
   ```

The backend will be available at `http://localhost:5000`

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## Usage

### Student Registration
1. Navigate to the registration page
2. Fill in all required fields:
   - Roll number must be exactly 10 alphanumeric characters
   - Select your department and section
   - Choose your year of study (I-IV)
3. Submit the form (Enter key works for submission)

### Student Dashboard
1. Login with your roll number and password
2. View your profile information
3. Click "Edit Profile" to update your details
4. Upload certificates with additional details:
   - Certificate name
   - Start and end dates
   - Event type
5. View your certificate history and download certificates

### Admin Dashboard
1. Login with your department-specific admin credentials
2. Manage certificates for your department only
3. Use bulk actions to approve/reject multiple certificates
4. View analytics filtered by your department
5. Generate reports with department-specific data
6. View all students from your department

## Technical Details

### Database Schema
- **Students**: Enhanced with new branch names and year format
- **Certificates**: Added certificate_name, start_date, end_date fields
- **Admins**: Department-specific admin accounts

### API Endpoints
- Enhanced certificate upload with additional fields
- Department-specific filtering
- Bulk certificate status updates
- Enhanced analytics with filters
- PDF report generation with watermark

### Frontend Features
- Responsive design with Bootstrap
- Real-time form validation
- Enhanced modals for certificate viewing
- Department-specific admin interface
- Color-coded status indicators

## File Structure
```
├── backend/
│   ├── app.py              # Main Flask application
│   ├── init_db.py          # Database initialization
│   ├── requirements.txt    # Python dependencies
│   └── uploads/           # Certificate storage
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── services/      # API services
│   └── package.json       # Node.js dependencies
└── README.md              # This file
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License
This project is licensed under the MIT License. 
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
import bcrypt
import json
from datetime import datetime
import openpyxl
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.pdfgen import canvas
import io

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///sat_portal.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)
CORS(app)

# Database Models
class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    rollnumber = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(15))
    gender = db.Column(db.String(10), db.CheckConstraint("gender IN ('Male', 'Female', 'Other')"))
    branch = db.Column(db.String(100))
    section = db.Column(db.String(10))
    year = db.Column(db.String(10))
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Admin(db.Model):
    __tablename__ = 'admins'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    employee_id = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(15))
    gender = db.Column(db.String(10), db.CheckConstraint("gender IN ('Male', 'Female', 'Other')"))
    branch = db.Column(db.String(100))
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Certificate(db.Model):
    __tablename__ = 'certificates'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    certificate_name = db.Column(db.String(200))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    name = db.Column(db.String(100))
    email = db.Column(db.String(120))
    branch = db.Column(db.String(100))
    year = db.Column(db.String(10))
    event_type = db.Column(db.String(100))
    file_path = db.Column(db.String(255))
    status = db.Column(db.String(20), db.CheckConstraint("status IN ('Pending', 'Approved', 'Rejected')"), default='Pending')
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

# Utility functions
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def validate_email(email):
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    # At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    return True, "Password is valid"

def validate_rollnumber(rollnumber):
    # 10 alphanumeric characters
    import re
    pattern = r'^[A-Za-z0-9]{10}$'
    return re.match(pattern, rollnumber) is not None

# Admin credentials
ADMIN_CREDENTIALS = {
    'admin@cse': {'password': 'Cse@srit', 'branch': 'COMPUTER SCIENCE AND ENGINEERING'},
    'admin@csd': {'password': 'Csd@srit', 'branch': 'COMPUTER SCIENCE AND ENGINEERING [DATA SCIENCE]'},
    'admin@csm': {'password': 'Csm@srit', 'branch': 'COMPUTER SCIENCE AND ENGINEERING [AIML]'},
    'admin@ece': {'password': 'Ece@srit', 'branch': 'ELECTRICAL AND ELECTRONICS OF COMMUNICATION ENGINEERING'},
    'admin@eee': {'password': 'Eee@srit', 'branch': 'ELECTRICAL AND ELECTRONICS ENGINEERING'},
    'admin@civ': {'password': 'Civ@srit', 'branch': 'CIVIL ENGINEERING'},
    'admin@mech': {'password': 'Mech@srit', 'branch': 'MECHANICAL ENGINEERING'}
}

# Routes
@app.route('/api/auth/student/register', methods=['POST'])
def student_register():
    try:
        data = request.get_json()
        
        # Validation
        if not all(key in data for key in ['name', 'rollnumber', 'email', 'password', 'phone', 'gender', 'branch', 'section', 'year']):
            return jsonify({'error': 'All fields are required'}), 400
        
        # Email validation
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Roll number validation
        if not validate_rollnumber(data['rollnumber']):
            return jsonify({'error': 'Roll number must be exactly 10 alphanumeric characters'}), 400
        
        # Password validation
        is_valid, message = validate_password(data['password'])
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Check if student already exists
        if Student.query.filter_by(rollnumber=data['rollnumber']).first():
            return jsonify({'error': 'Roll number already registered'}), 400
        
        if Student.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new student
        hashed_password = hash_password(data['password'])
        new_student = Student(
            name=data['name'],
            rollnumber=data['rollnumber'],
            email=data['email'],
            phone=data['phone'],
            gender=data['gender'],
            branch=data['branch'],
            section=data['section'],
            year=data['year'],
            password=hashed_password
        )
        
        db.session.add(new_student)
        db.session.commit()
        
        return jsonify({'message': 'Student registered successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/student/login', methods=['POST'])
def student_login():
    try:
        data = request.get_json()
        
        if not all(key in data for key in ['rollnumber', 'password']):
            return jsonify({'error': 'Roll number and password are required'}), 400
        
        student = Student.query.filter_by(rollnumber=data['rollnumber']).first()
        
        if not student or not check_password(data['password'], student.password):
            return jsonify({'error': 'Invalid roll number or password'}), 401
        
        return jsonify({
            'message': 'Login successful',
            'student': {
                'id': student.id,
                'name': student.name,
                'rollnumber': student.rollnumber,
                'email': student.email,
                'phone': student.phone,
                'gender': student.gender,
                'branch': student.branch,
                'section': student.section,
                'year': student.year
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        
        if not all(key in data for key in ['employee_id', 'password']):
            return jsonify({'error': 'Employee ID and password are required'}), 400
        
        # Check admin credentials
        if data['employee_id'] in ADMIN_CREDENTIALS:
            admin_cred = ADMIN_CREDENTIALS[data['employee_id']]
            if data['password'] == admin_cred['password']:
                # Create or get admin record
                admin = Admin.query.filter_by(employee_id=data['employee_id']).first()
                if not admin:
                    admin = Admin(
                        name=f"Admin - {admin_cred['branch']}",
                        employee_id=data['employee_id'],
                        email=f"{data['employee_id']}@srit.ac.in",
                        branch=admin_cred['branch'],
                        password=hash_password(data['password'])
                    )
                    db.session.add(admin)
                    db.session.commit()
                
                return jsonify({
                    'message': 'Login successful',
                    'admin': {
                        'id': admin.id,
                        'name': admin.name,
                        'employee_id': admin.employee_id,
                        'email': admin.email,
                        'phone': admin.phone,
                        'gender': admin.gender,
                        'branch': admin.branch
                    }
                }), 200
            else:
                return jsonify({'error': 'Invalid password'}), 401
        else:
            return jsonify({'error': 'Invalid employee ID'}), 401
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/student/profile', methods=['GET'])
def get_student_profile():
    try:
        student_id = request.args.get('student_id')
        if not student_id:
            return jsonify({'error': 'Student ID is required'}), 400
        
        student = db.session.get(Student, student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        return jsonify({
            'id': student.id,
            'name': student.name,
            'rollnumber': student.rollnumber,
            'email': student.email,
            'phone': student.phone,
            'gender': student.gender,
            'branch': student.branch,
            'section': student.section,
            'year': student.year
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/student/profile', methods=['PUT'])
def update_student_profile():
    try:
        data = request.get_json()
        student_id = data.get('student_id')
        
        if not student_id:
            return jsonify({'error': 'Student ID is required'}), 400
        
        student = db.session.get(Student, student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        # Update fields
        if 'name' in data:
            student.name = data['name']
        if 'email' in data:
            if not validate_email(data['email']):
                return jsonify({'error': 'Invalid email format'}), 400
            student.email = data['email']
        if 'phone' in data:
            student.phone = data['phone']
        if 'gender' in data:
            student.gender = data['gender']
        if 'branch' in data:
            student.branch = data['branch']
        if 'section' in data:
            student.section = data['section']
        if 'year' in data:
            student.year = data['year']
        
        db.session.commit()
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/student/certificate/upload', methods=['POST'])
def upload_certificate():
    try:
        student_id = request.form.get('student_id')
        event_type = request.form.get('event_type')
        certificate_name = request.form.get('certificate_name', '')
        start_date = request.form.get('start_date', '')
        end_date = request.form.get('end_date', '')
        
        if not all([student_id, event_type]):
            return jsonify({'error': 'Student ID and event type are required'}), 400
        
        student = db.session.get(Student, student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        if 'certificate' not in request.files:
            return jsonify({'error': 'Certificate file is required'}), 400
        
        file = request.files['certificate']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save file
        filename = f"{student.rollnumber}_{event_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Parse dates
        start_date_obj = None
        end_date_obj = None
        if start_date:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Create certificate record
        certificate = Certificate(
            student_id=student.id,
            certificate_name=certificate_name,
            start_date=start_date_obj,
            end_date=end_date_obj,
            name=student.name,
            email=student.email,
            branch=student.branch,
            year=student.year,
            event_type=event_type,
            file_path=file_path,
            status='Pending'
        )
        
        db.session.add(certificate)
        db.session.commit()
        
        return jsonify({'message': 'Certificate uploaded successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/student/certificates', methods=['GET'])
def get_student_certificates():
    try:
        student_id = request.args.get('student_id')
        if not student_id:
            return jsonify({'error': 'Student ID is required'}), 400
        
        certificates = Certificate.query.filter_by(student_id=student_id).all()
        
        certificate_list = []
        for cert in certificates:
            certificate_list.append({
                'id': cert.id,
                'certificate_name': cert.certificate_name,
                'event_type': cert.event_type,
                'start_date': cert.start_date.strftime('%Y-%m-%d') if cert.start_date else None,
                'end_date': cert.end_date.strftime('%Y-%m-%d') if cert.end_date else None,
                'status': cert.status,
                'uploaded_at': cert.uploaded_at.strftime('%Y-%m-%d %H:%M:%S'),
                'file_path': cert.file_path
            })
        
        return jsonify({'certificates': certificate_list}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/student/certificate/<int:certificate_id>/download', methods=['GET'])
def download_certificate(certificate_id):
    try:
        certificate = db.session.get(Certificate, certificate_id)
        if not certificate:
            return jsonify({'error': 'Certificate not found'}), 404
        
        if not os.path.exists(certificate.file_path):
            return jsonify({'error': 'Certificate file not found'}), 404
        
        return send_file(
            certificate.file_path,
            as_attachment=True,
            download_name=os.path.basename(certificate.file_path),
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/dashboard', methods=['GET'])
def admin_dashboard():
    try:
        # Get statistics
        total_certificates = Certificate.query.count()
        pending_certificates = Certificate.query.filter_by(status='Pending').count()
        approved_certificates = Certificate.query.filter_by(status='Approved').count()
        rejected_certificates = Certificate.query.filter_by(status='Rejected').count()
        
        # Get recent certificates
        recent_certificates = Certificate.query.order_by(Certificate.uploaded_at.desc()).limit(10).all()
        
        recent_list = []
        for cert in recent_certificates:
            student = Student.query.get(cert.student_id)
            recent_list.append({
                'id': cert.id,
                'student_name': cert.name,
                'rollnumber': student.rollnumber if student else 'N/A',
                'event_type': cert.event_type,
                'status': cert.status,
                'uploaded_at': cert.uploaded_at.strftime('%Y-%m-%d %H:%M:%S')
            })
        
        return jsonify({
            'statistics': {
                'total_certificates': total_certificates,
                'pending_certificates': pending_certificates,
                'approved_certificates': approved_certificates,
                'rejected_certificates': rejected_certificates
            },
            'recent_certificates': recent_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/certificates', methods=['GET'])
def get_admin_certificates():
    try:
        # Get filter parameters
        year = request.args.get('year')
        branch = request.args.get('branch')
        section = request.args.get('section')
        event_type = request.args.get('event_type')
        status = request.args.get('status')
        
        query = Certificate.query
        
        if year:
            query = query.filter_by(year=year)
        if branch:
            query = query.filter_by(branch=branch)
        if event_type:
            query = query.filter_by(event_type=event_type)
        if status:
            query = query.filter_by(status=status)
        
        certificates = query.order_by(Certificate.uploaded_at.desc()).all()
        
        certificate_list = []
        for cert in certificates:
            student = Student.query.get(cert.student_id)
            certificate_list.append({
                'id': cert.id,
                'student_name': cert.name,
                'rollnumber': student.rollnumber if student else 'N/A',
                'email': cert.email,
                'branch': cert.branch,
                'section': student.section if student else 'N/A',
                'year': cert.year,
                'certificate_name': cert.certificate_name,
                'event_type': cert.event_type,
                'start_date': cert.start_date.strftime('%Y-%m-%d') if cert.start_date else None,
                'end_date': cert.end_date.strftime('%Y-%m-%d') if cert.end_date else None,
                'status': cert.status,
                'uploaded_at': cert.uploaded_at.strftime('%Y-%m-%d %H:%M:%S'),
                'file_path': cert.file_path
            })
        
        return jsonify({'certificates': certificate_list}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/students', methods=['GET'])
def get_admin_students():
    try:
        branch = request.args.get('branch')
        year = request.args.get('year')
        section = request.args.get('section')
        
        query = Student.query
        if branch:
            query = query.filter_by(branch=branch)
        if year:
            query = query.filter_by(year=year)
        if section:
            query = query.filter_by(section=section)
        
        students = query.all()
        
        student_list = []
        for student in students:
            student_list.append({
                'id': student.id,
                'name': student.name,
                'rollnumber': student.rollnumber,
                'email': student.email,
                'phone': student.phone,
                'gender': student.gender,
                'branch': student.branch,
                'section': student.section,
                'year': student.year
            })
        
        return jsonify({'students': student_list}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/students/download', methods=['GET'])
def download_students_excel():
    try:
        branch = request.args.get('branch')
        year = request.args.get('year')
        section = request.args.get('section')
        
        query = Student.query
        if branch:
            query = query.filter_by(branch=branch)
        if year:
            query = query.filter_by(year=year)
        if section:
            query = query.filter_by(section=section)
        
        students = query.all()
        
        # Create Excel workbook
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Students Report"
        
        # Headers
        headers = ['ID', 'Name', 'Roll Number', 'Email', 'Phone', 'Gender', 'Branch', 'Section', 'Year', 'Created At']
        ws.append(headers)
        
        # Data
        for student in students:
            ws.append([
                student.id,
                student.name,
                student.rollnumber,
                student.email,
                student.phone or 'N/A',
                student.gender or 'N/A',
                student.branch or 'N/A',
                student.section or 'N/A',
                student.year or 'N/A',
                student.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        # Save to bytes
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='students_report.xlsx'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/certificate/status', methods=['PUT'])
def update_certificate_status():
    try:
        data = request.get_json()
        certificate_id = data.get('certificate_id')
        status = data.get('status')
        
        if not all([certificate_id, status]):
            return jsonify({'error': 'Certificate ID and status are required'}), 400
        
        if status not in ['Pending', 'Approved', 'Rejected']:
            return jsonify({'error': 'Invalid status'}), 400
        
        certificate = db.session.get(Certificate, certificate_id)
        if not certificate:
            return jsonify({'error': 'Certificate not found'}), 404
        
        certificate.status = status
        db.session.commit()
        
        return jsonify({'message': 'Certificate status updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/certificate/bulk-status', methods=['PUT'])
def bulk_update_certificate_status():
    try:
        data = request.get_json()
        certificate_ids = data.get('certificate_ids', [])
        status = data.get('status')
        
        if not certificate_ids or not status:
            return jsonify({'error': 'Certificate IDs and status are required'}), 400
        
        if status not in ['Pending', 'Approved', 'Rejected']:
            return jsonify({'error': 'Invalid status'}), 400
        
        certificates = Certificate.query.filter(Certificate.id.in_(certificate_ids)).all()
        for certificate in certificates:
            certificate.status = status
        
        db.session.commit()
        
        return jsonify({'message': f'Updated {len(certificates)} certificates successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/analytics', methods=['GET'])
def get_analytics():
    try:
        # Get filter parameters
        year = request.args.get('year')
        branch = request.args.get('branch')
        event_type = request.args.get('event_type')
        
        query = Certificate.query
        
        if year:
            query = query.filter_by(year=year)
        if branch:
            query = query.filter_by(branch=branch)
        if event_type:
            query = query.filter_by(event_type=event_type)
        
        # Branch-wise statistics
        branch_stats = db.session.query(
            Certificate.branch,
            db.func.count(Certificate.id).label('count')
        ).group_by(Certificate.branch).all()
        
        # Year-wise statistics
        year_stats = db.session.query(
            Certificate.year,
            db.func.count(Certificate.id).label('count')
        ).group_by(Certificate.year).all()
        
        # Event type statistics
        event_stats = db.session.query(
            Certificate.event_type,
            db.func.count(Certificate.id).label('count')
        ).group_by(Certificate.event_type).all()
        
        # Status statistics
        status_stats = db.session.query(
            Certificate.status,
            db.func.count(Certificate.id).label('count')
        ).group_by(Certificate.status).all()
        
        return jsonify({
            'branch_stats': [{'branch': stat[0], 'count': stat[1]} for stat in branch_stats],
            'year_stats': [{'year': stat[0], 'count': stat[1]} for stat in year_stats],
            'event_stats': [{'event_type': stat[0], 'count': stat[1]} for stat in event_stats],
            'status_stats': [{'status': stat[0], 'count': stat[1]} for stat in status_stats]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/report', methods=['GET'])
def generate_report():
    try:
        report_type = request.args.get('type', 'excel')  # excel or pdf
        year = request.args.get('year')
        branch = request.args.get('branch')
        status = request.args.get('status')
        
        query = Certificate.query
        
        if year:
            query = query.filter_by(year=year)
        if branch:
            query = query.filter_by(branch=branch)
        if status:
            query = query.filter_by(status=status)
        
        certificates = query.all()
        
        if report_type == 'excel':
            return generate_excel_report(certificates)
        else:
            return generate_pdf_report(certificates)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_excel_report(certificates):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Certificates Report"
    
    # Headers
    headers = ['ID', 'Student Name', 'Roll Number', 'Email', 'Branch', 'Year', 'Certificate Name', 'Event Type', 'Start Date', 'End Date', 'Status', 'Uploaded At', 'Certificate PDF']
    ws.append(headers)
    
    # Data
    for cert in certificates:
        student = Student.query.get(cert.student_id)
        # Create a proper download link that will work when the Excel file is opened
        certificate_pdf_link = f"=HYPERLINK(\"http://localhost:5000/api/student/certificate/{cert.id}/download\", \"Download Certificate\")" if cert.file_path else "N/A"
        ws.append([
            cert.id,
            cert.name,
            student.rollnumber if student else 'N/A',
            cert.email,
            cert.branch,
            cert.year,
            cert.certificate_name or cert.event_type,
            cert.event_type,
            cert.start_date.strftime('%Y-%m-%d') if cert.start_date else 'N/A',
            cert.end_date.strftime('%Y-%m-%d') if cert.end_date else 'N/A',
            cert.status,
            cert.uploaded_at.strftime('%Y-%m-%d %H:%M:%S'),
            certificate_pdf_link
        ])
    
    # Save to bytes
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='certificates_report.xlsx'
    )

def generate_pdf_report(certificates):
    buffer = io.BytesIO()
    
    # Create PDF with watermark in landscape mode
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
    elements = []
    
    # Title
    styles = getSampleStyleSheet()
    title = Paragraph("Certificate Reports", styles['Title'])
    elements.append(title)
    
    # Data
    data = [['ID', 'Student Name', 'Roll Number', 'Email', 'Branch', 'Year', 'Certificate Name', 'Event Type', 'Start Date', 'End Date', 'Status', 'Uploaded At', 'Certificate PDF']]
    
    for cert in certificates:
        student = Student.query.get(cert.student_id)
        # Create a clickable download link for PDF
        certificate_pdf_link = f"Download Certificate (ID: {cert.id})" if cert.file_path else "N/A"
        data.append([
            str(cert.id),
            cert.name,
            student.rollnumber if student else 'N/A',
            cert.email,
            cert.branch,
            str(cert.year),
            cert.certificate_name or cert.event_type,
            cert.event_type,
            cert.start_date.strftime('%Y-%m-%d') if cert.start_date else 'N/A',
            cert.end_date.strftime('%Y-%m-%d') if cert.end_date else 'N/A',
            cert.status,
            cert.uploaded_at.strftime('%Y-%m-%d %H:%M:%S'),
            certificate_pdf_link
        ])
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.orange),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.orange])
    ]))
    
    elements.append(table)
    
    # Build PDF with watermark
    def add_watermark(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica-Bold', 60)
        canvas.setFillColor(colors.orange)
        canvas.setFillAlpha(0.3)
        canvas.rotate(45)
        canvas.drawString(200, 0, "SRIT")
        canvas.restoreState()
    
    doc.build(elements, onFirstPage=add_watermark, onLaterPages=add_watermark)
    buffer.seek(0)
    
    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name='certificates_report.pdf'
    )



if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000) 
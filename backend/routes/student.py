from flask import Blueprint, request, jsonify
from utils import validate_email, format_datetime
import os
from datetime import datetime

student_bp = Blueprint('student', __name__)

# Import models after blueprint creation to avoid circular import
def get_models():
    from app import db, Student, Certificate
    return db, Student, Certificate

@student_bp.route('/profile', methods=['GET'])
def get_student_profile():
    try:
        db, Student, Certificate = get_models()
        student_id = request.args.get('student_id')
        if not student_id:
            return jsonify({'error': 'Student ID is required'}), 400
        
        student = Student.query.get(student_id)
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

@student_bp.route('/profile', methods=['PUT'])
def update_student_profile():
    try:
        db, Student, Certificate = get_models()
        data = request.get_json()
        student_id = data.get('student_id')
        
        if not student_id:
            return jsonify({'error': 'Student ID is required'}), 400
        
        student = Student.query.get(student_id)
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

@student_bp.route('/certificate/upload', methods=['POST'])
def upload_certificate():
    try:
        db, Student, Certificate = get_models()
        student_id = request.form.get('student_id')
        event_type = request.form.get('event_type')
        
        if not all([student_id, event_type]):
            return jsonify({'error': 'Student ID and event type are required'}), 400
        
        student = Student.query.get(student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        if 'certificate' not in request.files:
            return jsonify({'error': 'Certificate file is required'}), 400
        
        file = request.files['certificate']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save file
        filename = f"{student.rollnumber}_{event_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        file_path = os.path.join('uploads', filename)
        file.save(file_path)
        
        # Create certificate record
        certificate = Certificate(
            student_id=student.id,
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

@student_bp.route('/certificates', methods=['GET'])
def get_student_certificates():
    try:
        db, Student, Certificate = get_models()
        student_id = request.args.get('student_id')
        if not student_id:
            return jsonify({'error': 'Student ID is required'}), 400
        
        certificates = Certificate.query.filter_by(student_id=student_id).all()
        
        certificate_list = []
        for cert in certificates:
            certificate_list.append({
                'id': cert.id,
                'event_type': cert.event_type,
                'status': cert.status,
                'uploaded_at': format_datetime(cert.uploaded_at),
                'file_path': cert.file_path
            })
        
        return jsonify({'certificates': certificate_list}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 
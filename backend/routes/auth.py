from flask import Blueprint, request, jsonify
from utils import hash_password, check_password, validate_email, validate_password

auth_bp = Blueprint('auth', __name__)

# Import models after blueprint creation to avoid circular import
def get_models():
    from app import db, Student, Admin
    return db, Student, Admin

@auth_bp.route('/student/register', methods=['POST'])
def student_register():
    try:
        db, Student, Admin = get_models()
        data = request.get_json()
        
        # Validation
        required_fields = ['name', 'rollnumber', 'email', 'password', 'phone', 'gender', 'branch', 'section', 'year']
        if not all(key in data for key in required_fields):
            return jsonify({'error': 'All fields are required'}), 400
        
        # Email validation
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
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

@auth_bp.route('/student/login', methods=['POST'])
def student_login():
    try:
        db, Student, Admin = get_models()
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

@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    try:
        db, Student, Admin = get_models()
        data = request.get_json()
        
        if not all(key in data for key in ['employee_id', 'password']):
            return jsonify({'error': 'Employee ID and password are required'}), 400
        
        admin = Admin.query.filter_by(employee_id=data['employee_id']).first()
        
        if not admin or not check_password(data['password'], admin.password):
            return jsonify({'error': 'Invalid employee ID or password'}), 401
        
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
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 
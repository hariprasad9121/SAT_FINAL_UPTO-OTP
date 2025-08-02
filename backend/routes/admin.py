from flask import Blueprint, request, jsonify, send_file
from utils import format_datetime
import openpyxl
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import io

admin_bp = Blueprint('admin', __name__)

# Import models after blueprint creation to avoid circular import
def get_models():
    from app import db, Student, Certificate
    return db, Student, Certificate

@admin_bp.route('/dashboard', methods=['GET'])
def admin_dashboard():
    try:
        db, Student, Certificate = get_models()
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
                'uploaded_at': format_datetime(cert.uploaded_at)
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

@admin_bp.route('/certificates', methods=['GET'])
def get_admin_certificates():
    try:
        db, Student, Certificate = get_models()
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
                'start_date': cert.start_date,
                'end_date': cert.end_date,
                'status': cert.status,
                'uploaded_at': format_datetime(cert.uploaded_at),
                'file_path': cert.file_path
            })
        
        return jsonify({'certificates': certificate_list}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/certificate/status', methods=['PUT'])
def update_certificate_status():
    try:
        db, Student, Certificate = get_models()
        data = request.get_json()
        certificate_id = data.get('certificate_id')
        status = data.get('status')
        
        if not all([certificate_id, status]):
            return jsonify({'error': 'Certificate ID and status are required'}), 400
        
        if status not in ['Pending', 'Approved', 'Rejected']:
            return jsonify({'error': 'Invalid status'}), 400
        
        certificate = Certificate.query.get(certificate_id)
        if not certificate:
            return jsonify({'error': 'Certificate not found'}), 404
        
        certificate.status = status
        db.session.commit()
        
        return jsonify({'message': 'Certificate status updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/analytics', methods=['GET'])
def get_analytics():
    try:
        db, Student, Certificate = get_models()
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

@admin_bp.route('/report', methods=['GET'])
def generate_report():
    try:
        db, Student, Certificate = get_models()
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
    db, Student, Certificate = get_models()
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Certificates Report"
    
    # Headers
    headers = ['ID', 'Student Name', 'Roll Number', 'Email', 'Branch', 'Year', 'Event Type', 'Certificate Name', 'Start Date', 'End Date', 'Status', 'Uploaded At', 'Certificate PDF']
    ws.append(headers)
    
    # Data
    for cert in certificates:
        student = Student.query.get(cert.student_id)
        certificate_pdf_link = f"http://localhost:5000/api/student/certificate/{cert.id}/download" if cert.file_path else "N/A"
        ws.append([
            cert.id,
            cert.name,
            student.rollnumber if student else 'N/A',
            cert.email,
            cert.branch,
            cert.year,
            cert.event_type,
            cert.certificate_name or 'N/A',
            cert.start_date or 'N/A',
            cert.end_date or 'N/A',
            cert.status,
            format_datetime(cert.uploaded_at),
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
    db, Student, Certificate = get_models()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
    elements = []
    
    # Title
    styles = getSampleStyleSheet()
    title = Paragraph("Certificates Report", styles['Title'])
    elements.append(title)
    
    # Data
    data = [['ID', 'Student Name', 'Roll Number', 'Email', 'Branch', 'Year', 'Event Type', 'Certificate Name', 'Start Date', 'End Date', 'Status', 'Uploaded At', 'Certificate PDF']]
    
    for cert in certificates:
        student = Student.query.get(cert.student_id)
        certificate_pdf_link = f"http://localhost:5000/api/student/certificate/{cert.id}/download" if cert.file_path else "N/A"
        data.append([
            str(cert.id),
            cert.name,
            student.rollnumber if student else 'N/A',
            cert.email,
            cert.branch,
            str(cert.year),
            cert.event_type,
            cert.certificate_name or 'N/A',
            cert.start_date or 'N/A',
            cert.end_date or 'N/A',
            cert.status,
            format_datetime(cert.uploaded_at),
            certificate_pdf_link
        ])
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    
    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name='certificates_report.pdf'
    ) 
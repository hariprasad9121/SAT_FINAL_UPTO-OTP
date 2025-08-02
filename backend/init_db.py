from app import app, db, Admin, Student, Certificate
from app import hash_password
from datetime import datetime

def init_database():
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Admin credentials
        admin_credentials = [
            {
                'name': 'CSE Admin',
                'employee_id': 'admin@cse',
                'email': 'admin@cse@srit.ac.in',
                'branch': 'COMPUTER SCIENCE AND ENGINEERING',
                'password': 'Cse@srit'
            },
            {
                'name': 'CSD Admin',
                'employee_id': 'admin@csd',
                'email': 'admin@csd@srit.ac.in',
                'branch': 'COMPUTER SCIENCE AND ENGINEERING [DATA SCIENCE]',
                'password': 'Csd@srit'
            },
            {
                'name': 'CSM Admin',
                'employee_id': 'admin@csm',
                'email': 'admin@csm@srit.ac.in',
                'branch': 'COMPUTER SCIENCE AND ENGINEERING [AIML]',
                'password': 'Csm@srit'
            },
            {
                'name': 'ECE Admin',
                'employee_id': 'admin@ece',
                'email': 'admin@ece@srit.ac.in',
                'branch': 'ELECTRICAL AND ELECTRONICS OF COMMUNICATION ENGINEERING',
                'password': 'Ece@srit'
            },
            {
                'name': 'EEE Admin',
                'employee_id': 'admin@eee',
                'email': 'admin@eee@srit.ac.in',
                'branch': 'ELECTRICAL AND ELECTRONICS ENGINEERING',
                'password': 'Eee@srit'
            },
            {
                'name': 'CIV Admin',
                'employee_id': 'admin@civ',
                'email': 'admin@civ@srit.ac.in',
                'branch': 'CIVIL ENGINEERING',
                'password': 'Civ@srit'
            },
            {
                'name': 'MECH Admin',
                'employee_id': 'admin@mech',
                'email': 'admin@mech@srit.ac.in',
                'branch': 'MECHANICAL ENGINEERING',
                'password': 'Mech@srit'
            }
        ]
        
        # Create admin accounts
        for admin_data in admin_credentials:
            existing_admin = Admin.query.filter_by(employee_id=admin_data['employee_id']).first()
            if not existing_admin:
                admin = Admin(
                    name=admin_data['name'],
                    employee_id=admin_data['employee_id'],
                    email=admin_data['email'],
                    branch=admin_data['branch'],
                    password=hash_password(admin_data['password'])
                )
                db.session.add(admin)
                print(f"Created admin: {admin_data['employee_id']}")
        
        # Commit changes
        db.session.commit()
        print("Database initialized successfully!")

if __name__ == '__main__':
    init_database() 
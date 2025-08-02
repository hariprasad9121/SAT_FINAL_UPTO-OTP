#!/usr/bin/env python3
"""
Email Setup Script for SAT Portal
This script helps you configure email settings for OTP functionality.
"""

import os
import getpass

def create_env_file():
    """Create .env file with email configuration"""
    
    print("=" * 60)
    print("🎓 SAT Portal - Email Configuration Setup")
    print("=" * 60)
    print()
    print("This setup will configure email settings for OTP functionality.")
    print("You'll need a Gmail account with 2-Factor Authentication enabled.")
    print()
    print("📧 Email Setup Instructions:")
    print()
    print("For Gmail:")
    print("1. Go to your Google Account settings")
    print("2. Enable 2-Step Verification")
    print("3. Generate an App Password:")
    print("   - Go to Security > 2-Step Verification > App passwords")
    print("   - Select 'Mail' and generate a password")
    print()
    print("For Outlook/Hotmail:")
    print("1. Go to Account settings")
    print("2. Enable 2-Factor Authentication")
    print("3. Generate an App Password")
    print()
    print("For Institutional Email (like @srit.ac.in):")
    print("1. Contact your IT department for SMTP settings")
    print("2. Use your regular email password or app-specific password")
    print()
    
    # Get email credentials
    email = input("Enter your email address: ").strip()
    if not email or '@' not in email:
        print("❌ Please enter a valid email address")
        return False
    
    print()
    print("🔐 Enter your email password or app password:")
    password = getpass.getpass("Password: ").strip()
    
    if not password:
        print("❌ App Password is required")
        return False
    
    # Create .env file
    env_content = f"""# Email Configuration for SAT Portal
MAIL_USERNAME={email}
MAIL_PASSWORD={password}

# Note: This file contains sensitive information
# Keep it secure and don't commit it to version control
"""
    
    try:
        with open('.env', 'w') as f:
            f.write(env_content)
        
        print()
        print("✅ Email configuration saved successfully!")
        print("📁 Created .env file in backend directory")
        print()
        print("🚀 You can now run the application:")
        print("   python app.py")
        print()
        print("⚠️  Important:")
        print("- Keep your .env file secure")
        print("- Don't commit it to version control")
        print("- If you change your app password, update this file")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating .env file: {e}")
        return False

def test_email_config():
    """Test the email configuration"""
    print()
    print("🧪 Testing email configuration...")
    
    try:
        from config import Config
        from flask_mail import Mail
        from flask import Flask
        
        # Create test app
        test_app = Flask(__name__)
        test_app.config.from_object(Config)
        mail = Mail(test_app)
        
        with test_app.app_context():
            from flask_mail import Message
            msg = Message(
                'SAT Portal - Email Test',
                sender=Config.MAIL_USERNAME,
                recipients=[Config.MAIL_USERNAME]
            )
            msg.body = 'This is a test email from SAT Portal. If you receive this, your email configuration is working correctly!'
            
            mail.send(msg)
            print("✅ Email test successful! Check your inbox.")
            return True
            
    except Exception as e:
        print(f"❌ Email test failed: {e}")
        print("Please check your credentials and try again.")
        return False

if __name__ == "__main__":
    if create_env_file():
        test_choice = input("\nWould you like to test the email configuration? (y/n): ").strip().lower()
        if test_choice in ['y', 'yes']:
            test_email_config() 
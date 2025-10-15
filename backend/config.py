import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Email configuration
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', 'hp319611@gmail.com')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', 'hgmh gcgo lepc qqrk')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', MAIL_USERNAME)
    
    # Auto-detect email provider and configure SMTP settings
    email_domain = MAIL_USERNAME.split('@')[-1].lower() if '@' in MAIL_USERNAME else 'gmail.com'
    
    if 'gmail.com' in email_domain:
        MAIL_SERVER = 'smtp.gmail.com'
        MAIL_PORT = 587
        MAIL_USE_TLS = True
        MAIL_USE_SSL = False
    elif 'outlook.com' in email_domain or 'hotmail.com' in email_domain:
        MAIL_SERVER = 'smtp-mail.outlook.com'
        MAIL_PORT = 587
        MAIL_USE_TLS = True
        MAIL_USE_SSL = False
    elif 'yahoo.com' in email_domain:
        MAIL_SERVER = 'smtp.mail.yahoo.com'
        MAIL_PORT = 587
        MAIL_USE_TLS = True
        MAIL_USE_SSL = False
    else:
        # For institutional emails, use Gmail SMTP as default
        # You may need to update these settings based on your institution's SMTP server
        MAIL_SERVER = 'smtp.gmail.com'
        MAIL_PORT = 587
        MAIL_USE_TLS = True
        MAIL_USE_SSL = False
    
    # Database configuration
    SQLALCHEMY_DATABASE_URI = 'sqlite:///sat_portal.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Secret key
    SECRET_KEY = 'your-secret-key-here'
    
    # Upload folder
    UPLOAD_FOLDER = 'uploads' 
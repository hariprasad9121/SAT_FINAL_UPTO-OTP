# Email Setup Guide

To enable OTP functionality for student registration and password reset, you need to configure email settings.

## Gmail Setup

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Navigate to Security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to Google Account settings
   - Navigate to Security
   - Under "2-Step Verification", click on "App passwords"
   - Select "Mail" and generate a password

3. **Configure Environment Variables**
   Create a `.env` file in the backend directory with:
   ```
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-app-password
   ```

## Alternative Email Providers

You can use other email providers by modifying the `config.py` file:

### Outlook/Hotmail
```python
MAIL_SERVER = 'smtp-mail.outlook.com'
MAIL_PORT = 587
MAIL_USE_TLS = True
```

### Yahoo
```python
MAIL_SERVER = 'smtp.mail.yahoo.com'
MAIL_PORT = 587
MAIL_USE_TLS = True
```

## Testing Email Configuration

After setup, you can test the email functionality by:
1. Starting the backend server
2. Attempting to register a new student
3. Checking if the OTP email is received

## Troubleshooting

- **Authentication Error**: Make sure you're using an app password, not your regular Gmail password
- **Connection Error**: Check your internet connection and firewall settings
- **Email Not Received**: Check spam folder and verify email address is correct 
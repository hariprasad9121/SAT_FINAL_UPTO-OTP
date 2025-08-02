#!/usr/bin/env python3
"""
SAT Portal Setup Script
This script helps you set up the Student Achievement Tracker Portal
"""

import os
import sys
import subprocess
import platform

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True

def check_node_version():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js {result.stdout.strip()} detected")
            return True
    except FileNotFoundError:
        pass
    
    print("❌ Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/")
    return False

def setup_backend():
    """Set up the Flask backend"""
    print("\n🐍 Setting up Python backend...")
    
    # Create virtual environment
    if not run_command("python -m venv venv", "Creating virtual environment"):
        return False
    
    # Activate virtual environment and install dependencies
    if platform.system() == "Windows":
        activate_cmd = "venv\\Scripts\\activate"
    else:
        activate_cmd = "source venv/bin/activate"
    
    if not run_command(f"{activate_cmd} && pip install -r backend/requirements.txt", 
                      "Installing Python dependencies"):
        return False
    
    # Initialize database
    if not run_command(f"{activate_cmd} && cd backend && python init_db.py", 
                      "Initializing database"):
        return False
    
    return True

def setup_frontend():
    """Set up the React frontend"""
    print("\n⚛️ Setting up React frontend...")
    
    if not run_command("cd frontend && npm install", "Installing Node.js dependencies"):
        return False
    
    return True

def main():
    """Main setup function"""
    print("🎓 SAT Portal Setup")
    print("=" * 50)
    
    # Check prerequisites
    if not check_python_version():
        return False
    
    if not check_node_version():
        return False
    
    # Create necessary directories
    os.makedirs("backend/uploads", exist_ok=True)
    
    # Setup backend
    if not setup_backend():
        print("\n❌ Backend setup failed")
        return False
    
    # Setup frontend
    if not setup_frontend():
        print("\n❌ Frontend setup failed")
        return False
    
    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Start the backend: cd backend && python app.py")
    print("2. Start the frontend: cd frontend && npm start")
    print("3. Open http://localhost:3000 in your browser")
    print("\n🔐 Demo credentials:")
    print("Student: 2021001 / student123")
    print("Admin: admin001 / admin123")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 
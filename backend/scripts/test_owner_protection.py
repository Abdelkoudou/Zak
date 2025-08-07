#!/usr/bin/env python3
"""
Test script to verify owner protection is working correctly.
This script tests that admins cannot modify or delete owner users.
"""
import sys
import os
import requests
import json

# Add the parent directory to the Python path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app import models, crud
from app.models import UserType
from app.auth import get_password_hash

# Test server URL
BASE_URL = "http://localhost:8000"

def setup_test_users():
    """Create test users for our tests"""
    db = SessionLocal()
    
    try:
        # Create owner user if doesn't exist
        owner = db.query(models.User).filter(
            models.User.email == "doudous6666@gmail.com"
        ).first()
        
        if not owner:
            owner = models.User(
                email="doudous6666@gmail.com",
                username="owner",
                hashed_password=get_password_hash("123456789"),
                user_type=UserType.OWNER,
                is_paid=True
            )
            db.add(owner)
            db.commit()
            db.refresh(owner)
        
        # Create admin user if doesn't exist
        admin = db.query(models.User).filter(
            models.User.email == "admin@test.com"
        ).first()
        
        if not admin:
            admin = models.User(
                email="admin@test.com",
                username="test_admin",
                hashed_password=get_password_hash("admin123"),
                user_type=UserType.ADMIN,
                is_paid=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
        
        print("✅ Test users created/verified")
        return owner, admin
        
    except Exception as e:
        print(f"❌ Error setting up test users: {e}")
        return None, None
    finally:
        db.close()

def login_user(email, password):
    """Login user and get access token"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/token",
            data={"username": email, "password": password},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get("access_token")
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except requests.ConnectionError:
        print("❌ Cannot connect to server. Make sure it's running: python run.py")
        return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_admin_cannot_modify_owner(admin_token, owner_id):
    """Test that admin cannot modify owner user"""
    print("\n🧪 Testing: Admin trying to modify owner user...")
    
    # Try to change owner's user type (using query parameter)
    try:
        response = requests.put(
            f"{BASE_URL}/admin/users/{owner_id}/role?user_type=student",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if response.status_code == 403:
            print("✅ PASS: Admin correctly blocked from changing owner role")
            return True
        else:
            print(f"❌ FAIL: Admin was able to change owner (Status: {response.status_code})")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing owner modification: {e}")
        return False

def test_admin_cannot_delete_owner(admin_token, owner_id):
    """Test that admin cannot delete owner user"""
    print("\n🧪 Testing: Admin trying to delete owner user...")
    
    try:
        response = requests.delete(
            f"{BASE_URL}/admin/users/{owner_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if response.status_code == 403:
            print("✅ PASS: Admin correctly blocked from deleting owner")
            return True
        else:
            print(f"❌ FAIL: Admin was able to delete owner (Status: {response.status_code})")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing owner deletion: {e}")
        return False

def test_owner_can_modify_themselves(owner_token, owner_id):
    """Test that owner can modify their own account"""
    print("\n🧪 Testing: Owner trying to modify their own account...")
    
    try:
        # Owner should be able to change their payment status (using query parameter)
        response = requests.put(
            f"{BASE_URL}/admin/users/{owner_id}/payment?is_paid=false",
            headers={"Authorization": f"Bearer {owner_token}"}
        )
        
        if response.status_code == 200:
            print("✅ PASS: Owner can modify their own account")
            
            # Revert the change
            requests.put(
                f"{BASE_URL}/admin/users/{owner_id}/payment?is_paid=true",
                headers={"Authorization": f"Bearer {owner_token}"}
            )
            return True
        else:
            print(f"❌ FAIL: Owner cannot modify themselves (Status: {response.status_code})")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing owner self-modification: {e}")
        return False

def test_owner_has_admin_privileges(owner_token):
    """Test that owner can access admin endpoints"""
    print("\n🧪 Testing: Owner accessing admin dashboard...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/admin/dashboard",
            headers={"Authorization": f"Bearer {owner_token}"}
        )
        
        if response.status_code == 200:
            print("✅ PASS: Owner can access admin dashboard")
            return True
        else:
            print(f"❌ FAIL: Owner cannot access admin dashboard (Status: {response.status_code})")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing owner admin privileges: {e}")
        return False

def get_owner_id():
    """Get the owner user ID from database"""
    db = SessionLocal()
    try:
        owner = db.query(models.User).filter(
            models.User.user_type == UserType.OWNER
        ).first()
        return owner.id if owner else None
    finally:
        db.close()

def main():
    """Run all owner protection tests"""
    print("🧪 OWNER PROTECTION TESTS")
    print("=" * 40)
    
    # Setup test users
    print("📋 Setting up test users...")
    owner, admin = setup_test_users()
    
    if not owner or not admin:
        print("❌ Failed to setup test users")
        return
    
    # Get owner ID
    owner_id = get_owner_id()
    if not owner_id:
        print("❌ Could not find owner user")
        return
    
    # Login as admin
    print("\n🔐 Logging in as admin...")
    admin_token = login_user("test_admin", "admin123")
    if not admin_token:
        print("❌ Could not login as admin")
        return
    
    # Login as owner  
    print("\n🔐 Logging in as owner...")
    owner_token = login_user("owner", "123456789")
    if not owner_token:
        print("❌ Could not login as owner")
        return
    
    # Run tests
    tests_passed = 0
    total_tests = 4
    
    if test_admin_cannot_modify_owner(admin_token, owner_id):
        tests_passed += 1
    
    if test_admin_cannot_delete_owner(admin_token, owner_id):
        tests_passed += 1
        
    if test_owner_can_modify_themselves(owner_token, owner_id):
        tests_passed += 1
        
    if test_owner_has_admin_privileges(owner_token):
        tests_passed += 1
    
    # Summary
    print("\n📊 TEST RESULTS")
    print("=" * 40)
    print(f"Tests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("✅ ALL TESTS PASSED! Owner protection is working correctly.")
    else:
        print(f"❌ {total_tests - tests_passed} tests failed. Owner protection needs fixing.")
    
    print("\n💡 Next steps:")
    print("1. Make sure the server is running: python run.py")
    print("2. Test manually in a browser or API client")
    print("3. Check the README_DATABASE.md for more information")

if __name__ == "__main__":
    main()
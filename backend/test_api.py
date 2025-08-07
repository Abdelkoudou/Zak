#!/usr/bin/env python3
"""
Simple test script to verify the API endpoints work correctly.
Run this after starting the server to test the basic functionality.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test the health endpoint"""
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_register():
    """Test user registration"""
    print("Testing user registration...")
    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpassword123",
        "user_type": "student"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("User registered successfully!")
    else:
        print(f"Error: {response.json()}")
    print()

def test_login():
    """Test user login"""
    print("Testing user login...")
    login_data = {
        "username": "testuser",
        "password": "testpassword123"
    }
    response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        token_data = response.json()
        print("Login successful!")
        print(f"Token: {token_data['access_token'][:50]}...")
        return token_data['access_token']
    else:
        print(f"Error: {response.json()}")
        return None

def test_get_questions(token):
    """Test getting questions"""
    print("Testing get questions...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/questions/", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        questions = response.json()
        print(f"Found {len(questions)} questions")
        if questions:
            print(f"First question: {questions[0]['question_text'][:50]}...")
    elif response.status_code == 403:
        print("Access denied - user needs to be paid")
    else:
        print(f"Error: {response.json()}")
    print()

def test_get_courses(token):
    """Test getting available courses"""
    print("Testing get courses...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/questions/courses/list", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        courses = response.json()
        print(f"Available courses: {courses['courses']}")
    else:
        print(f"Error: {response.json()}")
    print()

def test_get_years(token):
    """Test getting available years"""
    print("Testing get years...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/questions/years/list", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        years = response.json()
        print(f"Available years: {years['years']}")
    else:
        print(f"Error: {response.json()}")
    print()

def test_filtered_questions(token):
    """Test getting filtered questions"""
    print("Testing filtered questions...")
    headers = {"Authorization": f"Bearer {token}"}
    params = {"course": "Mathematics", "year": 2023}
    response = requests.get(f"{BASE_URL}/questions/", headers=headers, params=params)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        questions = response.json()
        print(f"Found {len(questions)} Mathematics questions from 2023")
    elif response.status_code == 403:
        print("Access denied - user needs to be paid")
    else:
        print(f"Error: {response.json()}")
    print()

def test_admin_login():
    """Test admin login"""
    print("Testing admin login...")
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        token_data = response.json()
        print("Admin login successful!")
        print(f"Token: {token_data['access_token'][:50]}...")
        return token_data['access_token']
    else:
        print(f"Error: {response.json()}")
        return None

def test_admin_dashboard(admin_token):
    """Test admin dashboard"""
    print("Testing admin dashboard...")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BASE_URL}/admin/dashboard", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        stats = response.json()
        print(f"Dashboard stats: {stats['user_stats']['total_users']} total users")
    else:
        print(f"Error: {response.json()}")
    print()

def test_create_question(admin_token):
    """Test creating a question"""
    print("Testing create question...")
    headers = {"Authorization": f"Bearer {admin_token}"}
    question_data = {
        "year": 2024,
        "course": "Test Course",
        "number": 1,
        "question_text": "What is the capital of France?",
        "answers": [
            {"answer_text": "London", "is_correct": False},
            {"answer_text": "Paris", "is_correct": True},
            {"answer_text": "Berlin", "is_correct": False},
            {"answer_text": "Madrid", "is_correct": False}
        ]
    }
    response = requests.post(f"{BASE_URL}/questions/", headers=headers, json=question_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Question created successfully!")
    else:
        print(f"Error: {response.json()}")
    print()

def main():
    """Run all tests"""
    print("Starting API tests...\n")
    
    # Test health endpoint
    test_health()
    
    # Test registration
    test_register()
    
    # Test login
    token = test_login()
    
    if token:
        # Test getting questions
        test_get_questions(token)
        
        # Test getting courses
        test_get_courses(token)
        
        # Test getting years
        test_get_years(token)
        
        # Test filtered questions
        test_filtered_questions(token)
    
    # Test admin functionality
    print("\n--- Testing Admin Functionality ---")
    admin_token = test_admin_login()
    
    if admin_token:
        test_admin_dashboard(admin_token)
        test_create_question(admin_token)
    
    print("API tests completed!")

if __name__ == "__main__":
    main() 
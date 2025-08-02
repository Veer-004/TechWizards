from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from .models import User, Report
import json

class UserModelTest(TestCase):
    def test_create_user(self):
        """Test user creation"""
        user = User.create_user(
            email="test@example.com",
            password="testpass123",
            name="Test User"
        )
        self.assertIsNotNone(user)
        self.assertEqual(user['email'], "test@example.com")
        self.assertEqual(user['name'], "Test User")
        self.assertFalse(user['is_admin'])

class AuthAPITest(APITestCase):
    def test_register_user(self):
        """Test user registration API"""
        data = {
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'name': 'New User'
        }
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('user', response.data)

    def test_login_user(self):
        """Test user login API"""
        # First create a user
        User.create_user(
            email="logintest@example.com",
            password="loginpass123",
            name="Login Test"
        )
        
        # Then try to login
        data = {
            'email': 'logintest@example.com',
            'password': 'loginpass123'
        }
        response = self.client.post('/api/auth/login/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)

class ReportAPITest(APITestCase):
    def setUp(self):
        """Set up test data"""
        self.user = User.create_user(
            email="reporttest@example.com",
            password="reportpass123",
            name="Report Test"
        )
        
        # Login to get token
        login_data = {
            'email': 'reporttest@example.com',
            'password': 'reportpass123'
        }
        response = self.client.post('/api/auth/login/', login_data)
        self.token = response.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_create_report(self):
        """Test report creation"""
        data = {
            'description': 'Test garbage pile near park',
            'latitude': 12.9716,
            'longitude': 77.5946
        }
        response = self.client.post('/api/reports/create/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['status'], 'Pending')

    def test_get_reports(self):
        """Test getting reports"""
        # First create a report
        Report.create_report(
            user_id=str(self.user['_id']),
            description="Test report for getting",
            latitude=12.9716,
            longitude=77.5946
        )
        
        response = self.client.get('/api/reports/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('reports', response.data)
        self.assertGreater(len(response.data['reports']), 0)

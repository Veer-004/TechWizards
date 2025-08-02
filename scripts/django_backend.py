"""
Django Backend for Urban Waste Reporting App
This script sets up the complete Django backend with MongoDB integration
"""

# requirements.txt content:
"""
Django==4.2.7
djangorestframework==3.14.0
django-cors-headers==4.3.1
pymongo==4.6.0
Pillow==10.1.0
python-decouple==3.8
djangorestframework-simplejwt==5.3.0
"""

# settings.py
DJANGO_SETTINGS = """
import os
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='your-secret-key-here')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'waste_reports',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'waste_tracker.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# MongoDB Configuration
MONGODB_SETTINGS = {
    'host': config('MONGODB_URI', default='mongodb://localhost:27017/waste_tracker'),
    'db': config('MONGODB_DB', default='waste_tracker')
}

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# JWT Configuration
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Media Files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Static Files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
"""

# MongoDB Connection
MONGODB_CONNECTION = """
from pymongo import MongoClient
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class MongoDBConnection:
    _instance = None
    _client = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDBConnection, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._client is None:
            try:
                self._client = MongoClient(settings.MONGODB_SETTINGS['host'])
                self._db = self._client[settings.MONGODB_SETTINGS['db']]
                
                # Create indexes
                self.create_indexes()
                logger.info("MongoDB connection established successfully")
            except Exception as e:
                logger.error(f"Failed to connect to MongoDB: {e}")
                raise
    
    def create_indexes(self):
        # Create geospatial index for location-based queries
        self._db.reports.create_index([("location", "2dsphere")])
        self._db.reports.create_index("user_id")
        self._db.reports.create_index("status")
        self._db.reports.create_index("created_at")
        
        # User collection indexes
        self._db.users.create_index("email", unique=True)
    
    @property
    def db(self):
        return self._db
    
    @property
    def client(self):
        return self._client

# Global MongoDB instance
mongodb = MongoDBConnection()
"""

# Models (using pymongo)
MODELS = """
from datetime import datetime
from bson import ObjectId
from django.contrib.auth.hashers import make_password, check_password
from .database import mongodb
import uuid

class User:
    collection = mongodb.db.users
    
    @classmethod
    def create_user(cls, email, password, name, is_admin=False):
        user_data = {
            'email': email,
            'password': make_password(password),
            'name': name,
            'is_admin': is_admin,
            'created_at': datetime.utcnow(),
            'is_active': True
        }
        
        result = cls.collection.insert_one(user_data)
        user_data['_id'] = result.inserted_id
        return user_data
    
    @classmethod
    def get_by_email(cls, email):
        return cls.collection.find_one({'email': email})
    
    @classmethod
    def get_by_id(cls, user_id):
        return cls.collection.find_one({'_id': ObjectId(user_id)})
    
    @classmethod
    def verify_password(cls, user, password):
        return check_password(password, user['password'])

class Report:
    collection = mongodb.db.reports
    
    @classmethod
    def create_report(cls, user_id, description, latitude, longitude, image_url=None):
        report_data = {
            'user_id': user_id,
            'description': description,
            'status': 'Pending',
            'location': {
                'type': 'Point',
                'coordinates': [float(longitude), float(latitude)]
            },
            'image_url': image_url,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'admin_remarks': None
        }
        
        result = cls.collection.insert_one(report_data)
        report_data['_id'] = result.inserted_id
        return report_data
    
    @classmethod
    def get_all_reports(cls, status_filter=None):
        query = {}
        if status_filter:
            query['status'] = status_filter
        
        return list(cls.collection.find(query).sort('created_at', -1))
    
    @classmethod
    def get_user_reports(cls, user_id):
        return list(cls.collection.find({'user_id': user_id}).sort('created_at', -1))
    
    @classmethod
    def get_by_id(cls, report_id):
        return cls.collection.find_one({'_id': ObjectId(report_id)})
    
    @classmethod
    def update_status(cls, report_id, status, admin_remarks=None):
        update_data = {
            'status': status,
            'updated_at': datetime.utcnow()
        }
        if admin_remarks:
            update_data['admin_remarks'] = admin_remarks
        
        return cls.collection.update_one(
            {'_id': ObjectId(report_id)},
            {'$set': update_data}
        )
    
    @classmethod
    def get_reports_near_location(cls, longitude, latitude, max_distance=1000):
        # Find reports within max_distance meters
        return list(cls.collection.find({
            'location': {
                '$near': {
                    '$geometry': {
                        'type': 'Point',
                        'coordinates': [float(longitude), float(latitude)]
                    },
                    '$maxDistance': max_distance
                }
            }
        }))
"""

# Serializers
SERIALIZERS = """
from rest_framework import serializers
from bson import ObjectId

class UserSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    email = serializers.EmailField()
    name = serializers.CharField(max_length=100)
    is_admin = serializers.BooleanField(default=False)
    created_at = serializers.DateTimeField(read_only=True)

class ReportSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.CharField()
    description = serializers.CharField()
    status = serializers.ChoiceField(
        choices=['Pending', 'In Progress', 'Resolved'],
        default='Pending'
    )
    latitude = serializers.FloatField(write_only=True)
    longitude = serializers.FloatField(write_only=True)
    location = serializers.DictField(read_only=True)
    image_url = serializers.URLField(required=False, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    admin_remarks = serializers.CharField(required=False, allow_blank=True)

class ReportCreateSerializer(serializers.Serializer):
    description = serializers.CharField()
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    image = serializers.ImageField(required=False)

class ReportUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['Pending', 'In Progress', 'Resolved'])
    admin_remarks = serializers.CharField(required=False, allow_blank=True)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6)
    name = serializers.CharField(max_length=100)
"""

# Views
VIEWS = """
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from bson import ObjectId
import os
import uuid
from .models import User, Report
from .serializers import (
    UserSerializer, ReportSerializer, ReportCreateSerializer,
    ReportUpdateSerializer, LoginSerializer, RegisterSerializer
)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        try:
            # Check if user already exists
            existing_user = User.get_by_email(serializer.validated_data['email'])
            if existing_user:
                return Response(
                    {'error': 'User with this email already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create new user
            user = User.create_user(
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password'],
                name=serializer.validated_data['name']
            )
            
            # Generate JWT tokens
            refresh = RefreshToken()
            refresh['user_id'] = str(user['_id'])
            
            return Response({
                'message': 'User created successfully',
                'user': {
                    'id': str(user['_id']),
                    'email': user['email'],
                    'name': user['name']
                },
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = User.get_by_email(serializer.validated_data['email'])
            if user and User.verify_password(user, serializer.validated_data['password']):
                # Generate JWT tokens
                refresh = RefreshToken()
                refresh['user_id'] = str(user['_id'])
                
                return Response({
                    'message': 'Login successful',
                    'user': {
                        'id': str(user['_id']),
                        'email': user['email'],
                        'name': user['name'],
                        'is_admin': user.get('is_admin', False)
                    },
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_report(request):
    serializer = ReportCreateSerializer(data=request.data)
    if serializer.is_valid():
        try:
            # Handle image upload
            image_url = None
            if 'image' in request.FILES:
                image = request.FILES['image']
                # Generate unique filename
                filename = f"reports/{uuid.uuid4()}_{image.name}"
                # Save file
                path = default_storage.save(filename, ContentFile(image.read()))
                image_url = request.build_absolute_uri(default_storage.url(path))
            
            # Create report
            report = Report.create_report(
                user_id=str(request.user.id),
                description=serializer.validated_data['description'],
                latitude=serializer.validated_data['latitude'],
                longitude=serializer.validated_data['longitude'],
                image_url=image_url
            )
            
            # Prepare response data
            report_data = {
                'id': str(report['_id']),
                'user_id': report['user_id'],
                'description': report['description'],
                'status': report['status'],
                'location': report['location'],
                'image_url': report.get('image_url'),
                'created_at': report['created_at'],
                'updated_at': report['updated_at']
            }
            
            return Response(report_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_reports(request):
    try:
        status_filter = request.GET.get('status')
        user_only = request.GET.get('user_only', 'false').lower() == 'true'
        
        if user_only:
            reports = Report.get_user_reports(str(request.user.id))
        else:
            reports = Report.get_all_reports(status_filter)
        
        # Convert ObjectId to string and format response
        reports_data = []
        for report in reports:
            report_data = {
                'id': str(report['_id']),
                'user_id': report['user_id'],
                'description': report['description'],
                'status': report['status'],
                'location': report['location'],
                'image_url': report.get('image_url'),
                'created_at': report['created_at'],
                'updated_at': report['updated_at'],
                'admin_remarks': report.get('admin_remarks')
            }
            reports_data.append(report_data)
        
        return Response(reports_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_report_detail(request, report_id):
    try:
        report = Report.get_by_id(report_id)
        if not report:
            return Response(
                {'error': 'Report not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        report_data = {
            'id': str(report['_id']),
            'user_id': report['user_id'],
            'description': report['description'],
            'status': report['status'],
            'location': report['location'],
            'image_url': report.get('image_url'),
            'created_at': report['created_at'],
            'updated_at': report['updated_at'],
            'admin_remarks': report.get('admin_remarks')
        }
        
        return Response(report_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_report_status(request, report_id):
    # Check if user is admin (you can implement admin check logic)
    user = User.get_by_id(str(request.user.id))
    if not user.get('is_admin', False):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = ReportUpdateSerializer(data=request.data)
    if serializer.is_valid():
        try:
            result = Report.update_status(
                report_id=report_id,
                status=serializer.validated_data['status'],
                admin_remarks=serializer.validated_data.get('admin_remarks')
            )
            
            if result.modified_count == 0:
                return Response(
                    {'error': 'Report not found or no changes made'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get updated report
            updated_report = Report.get_by_id(report_id)
            report_data = {
                'id': str(updated_report['_id']),
                'user_id': updated_report['user_id'],
                'description': updated_report['description'],
                'status': updated_report['status'],
                'location': updated_report['location'],
                'image_url': updated_report.get('image_url'),
                'created_at': updated_report['created_at'],
                'updated_at': updated_report['updated_at'],
                'admin_remarks': updated_report.get('admin_remarks')
            }
            
            return Response(report_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_reports_near_location(request):
    try:
        latitude = float(request.GET.get('lat', 0))
        longitude = float(request.GET.get('lng', 0))
        max_distance = int(request.GET.get('distance', 1000))  # meters
        
        reports = Report.get_reports_near_location(longitude, latitude, max_distance)
        
        reports_data = []
        for report in reports:
            report_data = {
                'id': str(report['_id']),
                'description': report['description'],
                'status': report['status'],
                'location': report['location'],
                'image_url': report.get('image_url'),
                'created_at': report['created_at']
            }
            reports_data.append(report_data)
        
        return Response(reports_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_stats(request):
    try:
        # Check if user is admin
        user = User.get_by_id(str(request.user.id))
        if not user.get('is_admin', False):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get statistics
        all_reports = Report.get_all_reports()
        total_reports = len(all_reports)
        pending_reports = len([r for r in all_reports if r['status'] == 'Pending'])
        in_progress_reports = len([r for r in all_reports if r['status'] == 'In Progress'])
        resolved_reports = len([r for r in all_reports if r['status'] == 'Resolved'])
        
        stats = {
            'total_reports': total_reports,
            'pending_reports': pending_reports,
            'in_progress_reports': in_progress_reports,
            'resolved_reports': resolved_reports,
            'resolution_rate': (resolved_reports / total_reports * 100) if total_reports > 0 else 0
        }
        
        return Response(stats, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
"""

# URLs
URLS = """
# waste_tracker/urls.py (main project urls)
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('waste_reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# waste_reports/urls.py (app urls)
from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    
    # Reports
    path('reports/', views.get_reports, name='get_reports'),
    path('reports/create/', views.create_report, name='create_report'),
    path('reports/<str:report_id>/', views.get_report_detail, name='get_report_detail'),
    path('reports/<str:report_id>/update/', views.update_report_status, name='update_report_status'),
    path('reports/near/', views.get_reports_near_location, name='get_reports_near_location'),
    
    # Dashboard
    path('dashboard/stats/', views.get_dashboard_stats, name='get_dashboard_stats'),
]
"""

print("Django Backend Setup Complete!")
print("\nTo set up the Django backend:")
print("1. Create a new Django project: django-admin startproject waste_tracker")
print("2. Create the waste_reports app: python manage.py startapp waste_reports")
print("3. Install requirements: pip install -r requirements.txt")
print("4. Copy the code above into respective files")
print("5. Set up MongoDB connection in .env file")
print("6. Run migrations: python manage.py migrate")
print("7. Create superuser: python manage.py createsuperuser")
print("8. Run server: python manage.py runserver")

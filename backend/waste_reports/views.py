from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from bson import ObjectId
import os
import uuid
import logging
from .models import User, Report
from .serializers import (
    UserSerializer, ReportSerializer, ReportCreateSerializer,
    ReportUpdateSerializer, LoginSerializer, RegisterSerializer,
    StatsSerializer
)

logger = logging.getLogger(__name__)

class CustomJWTAuthentication:
    """Custom JWT authentication to work with MongoDB users"""
    
    @staticmethod
    def get_user_from_token(request):
        from rest_framework_simplejwt.authentication import JWTAuthentication
        from rest_framework_simplejwt.exceptions import InvalidToken
        
        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(
                jwt_auth.get_raw_token(jwt_auth.get_header(request))
            )
            user_id = validated_token.get('user_id')
            if user_id:
                return User.get_by_id(user_id)
            return None
        except (InvalidToken, Exception):
            return None

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user - ONLY regular users, no admin creation via API"""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        try:
            # Create new user - ALWAYS as regular user (is_admin=False)
            user = User.create_user(
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password'],
                name=serializer.validated_data['name'],
                is_admin=False  # Force regular user
            )
            
            # Generate JWT tokens
            refresh = RefreshToken()
            refresh['user_id'] = str(user['_id'])
            
            return Response({
                'message': 'User created successfully',
                'user': {
                    'id': str(user['_id']),
                    'email': user['email'],
                    'name': user['name'],
                    'is_admin': False  # Always false for API registration
                },
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Registration error: {e}")
            return Response(
                {'error': 'Failed to create user'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = User.get_by_email(serializer.validated_data['email'])
            if user and user.get('is_active', True) and User.verify_password(user, serializer.validated_data['password']):
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
                    {'error': 'Invalid credentials or account disabled'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except Exception as e:
            logger.error(f"Login error: {e}")
            return Response(
                {'error': 'Login failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])  # REQUIRE AUTHENTICATION
@parser_classes([MultiPartParser, FormParser])
def create_report(request):
    """Create a new waste report - AUTHENTICATION REQUIRED"""
    # Get user from JWT token
    user = CustomJWTAuthentication.get_user_from_token(request)
    if not user:
        return Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Check if user account is active
    if not user.get('is_active', True):
        return Response(
            {'error': 'Account is disabled'},
            status=status.HTTP_403_FORBIDDEN
        )
    
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
                user_id=str(user['_id']),
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
            logger.error(f"Create report error: {e}")
            return Response(
                {'error': 'Failed to create report'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])  # Now truly public
def get_reports(request):
    """Get reports - NOW PUBLIC"""
    try:
        # Try to fetch user info (but don't block access if missing)
        user = CustomJWTAuthentication.get_user_from_token(request)
        is_admin = user.get('is_admin', False) if user else False
        user_id = str(user['_id']) if user else None

        status_filter = request.GET.get('status')
        user_only = request.GET.get('user_only', 'false').lower() == 'true'
        limit = int(request.GET.get('limit', 100))
        skip = int(request.GET.get('skip', 0))

        if user_only and user_id:
            reports = Report.get_user_reports(user_id, limit, skip)
        else:
            reports = Report.get_all_reports(status_filter, limit, skip)

        reports_data = []
        for report in reports:
            reports_data.append({
                'id': str(report['_id']),
                'user_id': report['user_id'],
                'description': report['description'],
                'status': report['status'],
                'location': report['location'],
                'image_url': report.get('image_url'),
                'created_at': report['created_at'],
                'updated_at': report['updated_at'],
                'admin_remarks': report.get('admin_remarks')
            })

        return Response({
            'reports': reports_data,
            'count': len(reports_data)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Get reports error: {e}")
        return Response(
            {'error': 'Failed to get reports'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

        

@api_view(['GET'])
@permission_classes([AllowAny])  # REQUIRE AUTHENTICATION
def get_report_detail(request, report_id):
    """Get detailed information about a specific report - AUTHENTICATION REQUIRED"""
    user = CustomJWTAuthentication.get_user_from_token(request)
    if not user:
        return Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        report = Report.get_by_id(report_id)
        if not report:
            return Response(
                {'error': 'Report not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user can access this report
        if not user.get('is_admin', False) and report['user_id'] != str(user['_id']):
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
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
        logger.error(f"Get report detail error: {e}")
        return Response(
            {'error': 'Failed to get report details'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT'])
@permission_classes([AllowAny])  # Public access
def update_report_status(request, report_id):
    """Update report status - No authentication required"""

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

            # Get updated report from DB
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
            logger.error(f"Update report status error: {e}")
            return Response(
                {'error': 'Failed to update report'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])  # REQUIRE AUTHENTICATION FOR MAP DATA
def get_reports_near_location(request):
    """Get reports near a specific location - AUTHENTICATION REQUIRED"""
    user = CustomJWTAuthentication.get_user_from_token(request)
    if not user:
        return Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        latitude = float(request.GET.get('lat', 0))
        longitude = float(request.GET.get('lng', 0))
        max_distance = int(request.GET.get('distance', 1000))  # meters
        
        if latitude == 0 or longitude == 0:
            return Response(
                {'error': 'Latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
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
        
        return Response({
            'reports': reports_data,
            'count': len(reports_data)
        }, status=status.HTTP_200_OK)
        
    except ValueError:
        return Response(
            {'error': 'Invalid latitude or longitude'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Get reports near location error: {e}")
        return Response(
            {'error': 'Failed to get nearby reports'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])  # REQUIRE AUTHENTICATION
def get_dashboard_stats(request):
    """Get dashboard statistics - ADMIN ONLY"""
    user = CustomJWTAuthentication.get_user_from_token(request)
    if not user:
        return Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # STRICT admin check
    if not user.get('is_admin', False):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        stats = Report.get_stats()
        
        # Calculate resolution rate
        resolution_rate = 0
        if stats['total'] > 0:
            resolution_rate = (stats['resolved'] / stats['total']) * 100
        
        response_data = {
            'total_reports': stats['total'],
            'pending_reports': stats['pending'],
            'in_progress_reports': stats['in_progress'],
            'resolved_reports': stats['resolved'],
            'resolution_rate': round(resolution_rate, 2)
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get dashboard stats error: {e}")
        return Response(
            {'error': 'Failed to get statistics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])  # REQUIRE AUTHENTICATION
def search_reports(request):
    """Search reports by text - AUTHENTICATION REQUIRED"""
    user = CustomJWTAuthentication.get_user_from_token(request)
    if not user:
        return Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        search_term = request.GET.get('q', '').strip()
        if not search_term:
            return Response(
                {'error': 'Search term is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        limit = int(request.GET.get('limit', 50))
        reports = Report.search_reports(search_term, limit)
        
        # Filter reports based on user permissions
        if not user.get('is_admin', False):
            reports = [r for r in reports if r['user_id'] == str(user['_id'])]
        
        reports_data = []
        for report in reports:
            report_data = {
                'id': str(report['_id']),
                'description': report['description'],
                'status': report['status'],
                'location': report['location'],
                'image_url': report.get('image_url'),
                'created_at': report['created_at'],
                'admin_remarks': report.get('admin_remarks')
            }
            reports_data.append(report_data)
        
        return Response({
            'reports': reports_data,
            'count': len(reports_data),
            'search_term': search_term
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Search reports error: {e}")
        return Response(
            {'error': 'Search failed'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint"""
    from datetime import datetime
    try:
        # Test MongoDB connection
        from .database import mongodb
        mongodb.client.admin.command('ping')
        return Response({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.utcnow().isoformat()
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

# Admin creation endpoint - ONLY for initial setup, should be disabled in production
@api_view(['POST'])
@permission_classes([AllowAny])
def create_admin(request):
    """Create admin user - ONLY for initial setup, disable in production"""
    # This should be disabled in production or require special authentication
    if not request.data.get('admin_secret') == 'SUPER_SECRET_ADMIN_KEY_2024':
        return Response(
            {'error': 'Unauthorized'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        # Check if admin already exists
        existing_admin = User.collection.find_one({'is_admin': True})
        if existing_admin:
            return Response(
                {'error': 'Admin user already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        admin_user = User.create_user(
            email=request.data.get('email'),
            password=request.data.get('password'),
            name=request.data.get('name', 'System Administrator'),
            is_admin=True
        )
        
        return Response({
            'message': 'Admin user created successfully',
            'admin_id': str(admin_user['_id'])
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Create admin error: {e}")
        return Response(
            {'error': 'Failed to create admin'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Report
from bson.objectid import ObjectId

@csrf_exempt
def mark_urgent(request, report_id):
    if request.method == "POST":
        try:
            report = Report.collection.find_one({"_id": ObjectId(report_id)})
            if not report:
                return JsonResponse({"error": "Report not found"}, status=404)

            # Increment urgency count
            urgency_count = report.get("urgency_count", 0) + 1

            Report.collection.update_one(
                {"_id": ObjectId(report_id)},
                {"$set": {"urgency_count": urgency_count}}
            )

            return JsonResponse({"message": "Marked as urgent", "urgency_count": urgency_count})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Method not allowed"}, status=405)

from .database import mongodb
from rest_framework.decorators import api_view, permission_classes, authentication_classes
@api_view(["DELETE"])
@authentication_classes([])  # ✅ No auth required
@permission_classes([]) 
def ban_user(request, user_id):
    try:
        users_collection = mongodb.db["users"]
        result = users_collection.delete_one({"_id": ObjectId(user_id)})  # ✅ Cast to ObjectId

        if result.deleted_count == 1:
            return Response({"message": "User banned (deleted) successfully."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
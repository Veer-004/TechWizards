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
    latitude = serializers.FloatField(write_only=True, required=False)
    longitude = serializers.FloatField(write_only=True, required=False)
    location = serializers.DictField(read_only=True)
    image_url = serializers.URLField(required=False, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    admin_remarks = serializers.CharField(required=False, allow_blank=True)

class ReportCreateSerializer(serializers.Serializer):
    description = serializers.CharField(min_length=10, max_length=1000)
    latitude = serializers.FloatField(min_value=-90, max_value=90)
    longitude = serializers.FloatField(min_value=-180, max_value=180)
    image = serializers.ImageField(required=False)

class ReportUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['Pending', 'In Progress', 'Resolved'])
    admin_remarks = serializers.CharField(required=False, allow_blank=True, max_length=500)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6)

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6)
    name = serializers.CharField(max_length=100, min_length=2)
    
    def validate_email(self, value):
        from .models import User
        if User.get_by_email(value):
            raise serializers.ValidationError("User with this email already exists")
        return value

class StatsSerializer(serializers.Serializer):
    total_reports = serializers.IntegerField()
    pending_reports = serializers.IntegerField()
    in_progress_reports = serializers.IntegerField()
    resolved_reports = serializers.IntegerField()
    resolution_rate = serializers.FloatField()

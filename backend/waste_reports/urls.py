from django.urls import path
from . import views

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='health_check'),
    
    # Authentication
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    
    # Admin creation (disable in production)
    path('auth/create-admin/', views.create_admin, name='create_admin'),
    
    # Reports (all require authentication now)
    path('reports/', views.get_reports, name='get_reports'),
    path("users/<str:user_id>/ban/", views.ban_user, name="ban_user"),
    path('reports/create/', views.create_report, name='create_report'),
    path('reports/search/', views.search_reports, name='search_reports'),
    path('reports/near/', views.get_reports_near_location, name='get_reports_near_location'),
    path('reports/<str:report_id>/', views.get_report_detail, name='get_report_detail'),
    path("reports/<str:report_id>/urgency/", views.mark_urgent, name="mark_urgent"),
    path('reports/<str:report_id>/update/', views.update_report_status, name='update_report_status'),
    
    # Dashboard (admin only)
    path('dashboard/stats/', views.get_dashboard_stats, name='get_dashboard_stats'),
]

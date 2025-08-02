# Urban Waste Reporting Backend

Django REST API backend for the Urban Waste Reporting and Tracking App.

## Features

- JWT Authentication
- MongoDB integration with pymongo
- Image upload handling
- Geospatial queries for location-based reports
- Admin dashboard APIs
- RESTful API endpoints

## Setup Instructions

### 1. Prerequisites

- Python 3.8+
- MongoDB (local or MongoDB Atlas)
- pip (Python package manager)

### 2. Installation

\`\`\`bash
# Clone the repository
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
\`\`\`

### 3. Environment Configuration

\`\`\`bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
# Set your MongoDB connection string
# Set a secure SECRET_KEY for production
\`\`\`

### 4. Database Setup

\`\`\`bash
# Run Django migrations (for admin interface)
python manage.py migrate

# Create Django superuser (optional, for admin interface)
python manage.py createsuperuser
\`\`\`

### 5. MongoDB Setup

Make sure MongoDB is running and accessible. The app will automatically:
- Create necessary collections
- Set up indexes for optimal performance
- Create geospatial indexes for location queries

### 6. Run the Server

\`\`\`bash
# Development server
python manage.py runserver

# The API will be available at http://localhost:8000/api/
\`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login user

### Reports
- `GET /api/reports/` - Get reports (user's own or all for admin)
- `POST /api/reports/create/` - Create new report
- `GET /api/reports/<id>/` - Get report details
- `PUT /api/reports/<id>/update/` - Update report status (admin only)
- `GET /api/reports/near/` - Get reports near location
- `GET /api/reports/search/` - Search reports

### Dashboard
- `GET /api/dashboard/stats/` - Get dashboard statistics (admin only)

### Utility
- `GET /api/health/` - Health check endpoint

## API Usage Examples

### Register User
\`\`\`bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
\`\`\`

### Create Report
\`\`\`bash
curl -X POST http://localhost:8000/api/reports/create/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "description=Garbage pile near park" \
  -F "latitude=12.9716" \
  -F "longitude=77.5946" \
  -F "image=@/path/to/image.jpg"
\`\`\`

### Get Reports Near Location
\`\`\`bash
curl "http://localhost:8000/api/reports/near/?lat=12.9716&lng=77.5946&distance=1000"
\`\`\`

## Testing

\`\`\`bash
# Run tests
python manage.py test

# Run specific test
python manage.py test waste_reports.tests.AuthAPITest
\`\`\`

## Production Deployment

1. Set `DEBUG=False` in settings
2. Configure proper MongoDB connection (MongoDB Atlas recommended)
3. Set up proper static file serving
4. Configure CORS settings for your frontend domain
5. Use environment variables for sensitive settings
6. Set up proper logging
7. Use a production WSGI server like Gunicorn

## Project Structure

\`\`\`
backend/
├── waste_tracker/          # Django project settings
│   ├── __init__.py
│   ├── settings.py         # Main settings
│   ├── urls.py            # URL routing
│   ├── wsgi.py            # WSGI config
│   └── asgi.py            # ASGI config
├── waste_reports/          # Main app
│   ├── __init__.py
│   ├── apps.py            # App configuration
│   ├── database.py        # MongoDB connection
│   ├── models.py          # Data models
│   ├── serializers.py     # API serializers
│   ├── views.py           # API views
│   ├── urls.py            # App URLs
│   ├── admin.py           # Django admin
│   └── tests.py           # Unit tests
├── media/                  # Uploaded files
├── requirements.txt        # Python dependencies
├── manage.py              # Django management
├── .env.example           # Environment template
└── README.md              # This file
\`\`\`

## MongoDB Collections

### users
- `_id`: ObjectId
- `email`: String (unique)
- `password`: String (hashed)
- `name`: String
- `is_admin`: Boolean
- `is_active`: Boolean
- `created_at`: DateTime

### reports
- `_id`: ObjectId
- `user_id`: String
- `description`: String
- `status`: String (Pending/In Progress/Resolved)
- `location`: GeoJSON Point
- `image_url`: String (optional)
- `admin_remarks`: String (optional)
- `created_at`: DateTime
- `updated_at`: DateTime

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests to ensure they pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

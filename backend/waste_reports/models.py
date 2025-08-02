from datetime import datetime
from bson import ObjectId
from django.contrib.auth.hashers import make_password, check_password
from .database import mongodb
import logging
from pymongo import ASCENDING
from datetime import timedelta
logger = logging.getLogger(__name__)

class User:
    collection = mongodb.db.users
    
    @classmethod
    def create_user(cls, email, password, name, is_admin=False):
        try:
            user_data = {
                'email': email.lower(),
                'password': make_password(password),
                'name': name,
                'is_admin': is_admin,
                'created_at': datetime.utcnow(),
                'is_active': True
            }
            
            result = cls.collection.insert_one(user_data)
            user_data['_id'] = result.inserted_id
            logger.info(f"User created successfully: {email}")
            return user_data
        except Exception as e:
            logger.error(f"Failed to create user {email}: {e}")
            raise
    
    @classmethod
    def get_by_email(cls, email):
        try:
            return cls.collection.find_one({'email': email.lower()})
        except Exception as e:
            logger.error(f"Failed to get user by email {email}: {e}")
            return None
    
    @classmethod
    def get_by_id(cls, user_id):
        try:
            return cls.collection.find_one({'_id': ObjectId(user_id)})
        except Exception as e:
            logger.error(f"Failed to get user by ID {user_id}: {e}")
            return None
    
    @classmethod
    def verify_password(cls, user, password):
        try:
            return check_password(password, user['password'])
        except Exception as e:
            logger.error(f"Failed to verify password: {e}")
            return False

class Report:
    collection = mongodb.db.reports
    deleted_collection = mongodb.db.deleted_data
    
    @classmethod
    def archive_old_resolved(cls):
        try:
            ten_days_ago = datetime.utcnow() - timedelta(days=10)
            old_resolved = cls.collection.find({
                'status': 'Resolved',
                'updated_at': {'$lt': ten_days_ago}
            })

            for report in old_resolved:
                cls.deleted_collection.insert_one(report)
                cls.collection.delete_one({'_id': report['_id']})
                logger.info(f"Archived report: {report['_id']}")

        except Exception as e:
            logger.error(f"Failed to archive old resolved reports: {e}")
    @classmethod
    def create_report(cls, user_id, description, latitude, longitude, image_url=None):
        try:
            report_data = {
                'user_id': user_id,
                'description': description,
                'status': 'Pending',
                'location': {
                    'type': 'Point',
                    'coordinates': [float(longitude), float(latitude)]
                },
                'image_url': image_url,
                'urgency_count': 0,  # Add this when creating the report
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'admin_remarks': None
            }
            
            result = cls.collection.insert_one(report_data)
            report_data['_id'] = result.inserted_id
            logger.info(f"Report created successfully: {result.inserted_id}")
            return report_data
        except Exception as e:
            logger.error(f"Failed to create report: {e}")
            raise
    
    @classmethod
    def get_all_reports(cls, status_filter=None, limit=100, skip=0):
        try:
            query = {}
            if status_filter:
                query['status'] = status_filter
            
            return list(cls.collection.find(query)
                       .sort('created_at', -1)
                       .limit(limit)
                       .skip(skip))
        except Exception as e:
            logger.error(f"Failed to get all reports: {e}")
            return []
    
    @classmethod
    def get_user_reports(cls, user_id, limit=100, skip=0):
        try:
            return list(cls.collection.find({'user_id': user_id})
                       .sort('created_at', -1)
                       .limit(limit)
                       .skip(skip))
        except Exception as e:
            logger.error(f"Failed to get user reports for {user_id}: {e}")
            return []
    
    @classmethod
    def get_by_id(cls, report_id):
        try:
            return cls.collection.find_one({'_id': ObjectId(report_id)})
        except Exception as e:
            logger.error(f"Failed to get report by ID {report_id}: {e}")
            return None
    
    @classmethod
    def update_status(cls, report_id, status, admin_remarks=None):
        try:
            update_data = {
                'status': status,
                'updated_at': datetime.utcnow()
            }
            if admin_remarks:
                update_data['admin_remarks'] = admin_remarks
            
            result = cls.collection.update_one(
                {'_id': ObjectId(report_id)},
                {'$set': update_data}
            )
            logger.info(f"Report {report_id} status updated to {status}")
            return result
        except Exception as e:
            logger.error(f"Failed to update report {report_id}: {e}")
            raise
    
    @classmethod
    def get_reports_near_location(cls, longitude, latitude, max_distance=1000):
        try:
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
        except Exception as e:
            logger.error(f"Failed to get reports near location: {e}")
            return []
    
    @classmethod
    def search_reports(cls, search_term, limit=50):
        try:
            return list(cls.collection.find({
                '$text': {'$search': search_term}
            }).limit(limit))
        except Exception as e:
            logger.error(f"Failed to search reports: {e}")
            return []
    
    @classmethod
    def get_stats(cls):
        try:
            pipeline = [
                {
                    '$group': {
                        '_id': '$status',
                        'count': {'$sum': 1}
                    }
                }
            ]
            
            result = list(cls.collection.aggregate(pipeline))
            stats = {'total': 0, 'pending': 0, 'in_progress': 0, 'resolved': 0}
            
            for item in result:
                status = item['_id'].lower().replace(' ', '_')
                stats[status] = item['count']
                stats['total'] += item['count']
            
            return stats
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {'total': 0, 'pending': 0, 'in_progress': 0, 'resolved': 0}

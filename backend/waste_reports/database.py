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
                
                # Test connection
                self._client.admin.command('ping')
                
                # Create indexes
                self.create_indexes()
                logger.info("MongoDB connection established successfully")
            except Exception as e:
                logger.error(f"Failed to connect to MongoDB: {e}")
                raise
    
    def create_indexes(self):
        try:
            # Create geospatial index for location-based queries
            self._db.reports.create_index([("location", "2dsphere")])
            self._db.reports.create_index("user_id")
            self._db.reports.create_index("status")
            self._db.reports.create_index("created_at")
            self._db.reports.create_index([("user_id", 1), ("status", 1)])
            self._db.reports.create_index([("status", 1), ("created_at", -1)])
            
            # User collection indexes
            self._db.users.create_index("email", unique=True)
            self._db.users.create_index("created_at")
            
            # Text index for search
            self._db.reports.create_index([
                ("description", "text"),
                ("admin_remarks", "text")
            ])
            
            logger.info("MongoDB indexes created successfully")
        except Exception as e:
            logger.error(f"Failed to create MongoDB indexes: {e}")
    
    @property
    def db(self):
        return self._db
    
    @property
    def client(self):
        return self._client

# Global MongoDB instance
mongodb = MongoDBConnection()

-- MongoDB Setup Script for Urban Waste Reporting App
-- This script contains MongoDB commands to set up the database

-- Note: MongoDB uses JavaScript-like syntax, not SQL
-- Run these commands in MongoDB shell or MongoDB Compass

-- Switch to waste_tracker database
use waste_tracker;

-- Create users collection with validation schema
db.createCollection("users", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["email", "password", "name", "created_at"],
         properties: {
            email: {
               bsonType: "string",
               pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
               description: "must be a valid email address"
            },
            password: {
               bsonType: "string",
               minLength: 6,
               description: "must be a string with at least 6 characters"
            },
            name: {
               bsonType: "string",
               minLength: 1,
               description: "must be a non-empty string"
            },
            is_admin: {
               bsonType: "bool",
               description: "must be a boolean"
            },
            is_active: {
               bsonType: "bool",
               description: "must be a boolean"
            },
            created_at: {
               bsonType: "date",
               description: "must be a date"
            }
         }
      }
   }
});

-- Create reports collection with validation schema
db.createCollection("reports", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["user_id", "description", "status", "location", "created_at"],
         properties: {
            user_id: {
               bsonType: "string",
               description: "must be a string representing user ID"
            },
            description: {
               bsonType: "string",
               minLength: 10,
               description: "must be a string with at least 10 characters"
            },
            status: {
               enum: ["Pending", "In Progress", "Resolved"],
               description: "must be one of the allowed status values"
            },
            location: {
               bsonType: "object",
               required: ["type", "coordinates"],
               properties: {
                  type: {
                     enum: ["Point"],
                     description: "must be 'Point'"
                  },
                  coordinates: {
                     bsonType: "array",
                     minItems: 2,
                     maxItems: 2,
                     items: {
                        bsonType: "double"
                     },
                     description: "must be an array of two numbers [longitude, latitude]"
                  }
               }
            },
            image_url: {
               bsonType: ["string", "null"],
               description: "must be a string or null"
            },
            admin_remarks: {
               bsonType: ["string", "null"],
               description: "must be a string or null"
            },
            created_at: {
               bsonType: "date",
               description: "must be a date"
            },
            updated_at: {
               bsonType: "date",
               description: "must be a date"
            }
         }
      }
   }
});

-- Create indexes for better performance

-- Users collection indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "created_at": -1 });
db.users.createIndex({ "is_admin": 1 });

-- Reports collection indexes
db.reports.createIndex({ "location": "2dsphere" }); -- Geospatial index
db.reports.createIndex({ "user_id": 1 });
db.reports.createIndex({ "status": 1 });
db.reports.createIndex({ "created_at": -1 });
db.reports.createIndex({ "updated_at": -1 });
db.reports.createIndex({ "user_id": 1, "status": 1 });
db.reports.createIndex({ "status": 1, "created_at": -1 });

-- Insert sample admin user (password: admin123)
db.users.insertOne({
   email: "admin@wastetracker.com",
   password: "pbkdf2_sha256$600000$sample_hash_here", // This should be properly hashed
   name: "System Administrator",
   is_admin: true,
   is_active: true,
   created_at: new Date()
});

-- Insert sample regular user (password: user123)
db.users.insertOne({
   email: "user@example.com",
   password: "pbkdf2_sha256$600000$sample_hash_here", // This should be properly hashed
   name: "John Doe",
   is_admin: false,
   is_active: true,
   created_at: new Date()
});

-- Insert sample reports
db.reports.insertMany([
   {
      user_id: "sample_user_id_1",
      description: "Large garbage pile near the park entrance blocking pedestrian access. The waste includes plastic bags, food containers, and other household waste.",
      status: "Pending",
      location: {
         type: "Point",
         coordinates: [77.5946, 12.9716] // Bangalore coordinates
      },
      image_url: "https://example.com/images/report1.jpg",
      admin_remarks: null,
      created_at: new Date("2024-01-15T10:30:00Z"),
      updated_at: new Date("2024-01-15T10:30:00Z")
   },
   {
      user_id: "sample_user_id_1",
      description: "Overflowing dustbin on main street causing bad smell and attracting stray animals. Immediate attention required.",
      status: "In Progress",
      location: {
         type: "Point",
         coordinates: [77.6099, 12.9343]
      },
      image_url: "https://example.com/images/report2.jpg",
      admin_remarks: "Cleaning crew has been dispatched to the location",
      created_at: new Date("2024-01-14T14:20:00Z"),
      updated_at: new Date("2024-01-15T09:00:00Z")
   },
   {
      user_id: "sample_user_id_2",
      description: "Illegal dumping behind shopping complex. Construction debris and household waste dumped illegally.",
      status: "Resolved",
      location: {
         type: "Point",
         coordinates: [77.5773, 12.9698]
      },
      image_url: "https://example.com/images/report3.jpg",
      admin_remarks: "Area has been cleaned and warning signs have been installed to prevent future dumping",
      created_at: new Date("2024-01-13T09:15:00Z"),
      updated_at: new Date("2024-01-14T16:30:00Z")
   },
   {
      user_id: "sample_user_id_2",
      description: "Broken glass and debris scattered on sidewalk near bus stop. Safety hazard for pedestrians.",
      status: "Pending",
      location: {
         type: "Point",
         coordinates: [77.5850, 12.9550]
      },
      image_url: "https://example.com/images/report4.jpg",
      admin_remarks: null,
      created_at: new Date("2024-01-16T08:45:00Z"),
      updated_at: new Date("2024-01-16T08:45:00Z")
   }
]);

-- Create text index for search functionality
db.reports.createIndex({ 
   "description": "text",
   "admin_remarks": "text"
});

-- Verify collections and indexes
print("Collections created:");
db.getCollectionNames();

print("\nUsers collection indexes:");
db.users.getIndexes();

print("\nReports collection indexes:");
db.reports.getIndexes();

print("\nSample data inserted:");
print("Users count: " + db.users.countDocuments({}));
print("Reports count: " + db.reports.countDocuments({}));

-- Query examples for testing

-- Find all pending reports
print("\nPending reports:");
db.reports.find({ status: "Pending" }).pretty();

-- Find reports near a location (within 1km)
print("\nReports near Bangalore center:");
db.reports.find({
   location: {
      $near: {
         $geometry: {
            type: "Point",
            coordinates: [77.5946, 12.9716]
         },
         $maxDistance: 1000
      }
   }
}).pretty();

-- Aggregate reports by status
print("\nReports by status:");
db.reports.aggregate([
   {
      $group: {
         _id: "$status",
         count: { $sum: 1 }
      }
   }
]);

-- Find reports created in the last 7 days
print("\nRecent reports (last 7 days):");
var sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

db.reports.find({
   created_at: { $gte: sevenDaysAgo }
}).sort({ created_at: -1 }).pretty();

print("\nMongoDB setup completed successfully!");

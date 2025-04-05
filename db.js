const { MongoClient } = require("mongodb");

// Database connection state
const connection = {
  client: null,
  db: null,
  isConnecting: false,
};

async function connectToDatabase() {
  // Return existing connection if available
  if (connection.db) return connection.db;

  // Prevent multiple connection attempts
  if (connection.isConnecting) {
    throw new Error("Connection already in progress");
  }

  connection.isConnecting = true;

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;

  try {
    connection.client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      tls: true,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
    });

    console.log("Connecting to MongoDB Atlas...");
    await connection.client.connect();
    connection.db = connection.client.db(dbName);

    // Verify connection
    await connection.db.command({ ping: 1 });
    console.log("Connected to MongoDB Atlas successfully");
    return connection.db;
  } catch (err) {
    console.error("Atlas connection failed:", err);
    throw new Error(`Database connection failed: ${err.message}`);
  } finally {
    connection.isConnecting = false;
  }
}

async function closeConnection() {
  if (connection.client) {
    await connection.client.close();
    connection.client = null;
    connection.db = null;
    console.log("MongoDB connection closed");
  }
}

// Explicit exports
module.exports = {
  connectToDatabase,
  closeConnection,
};

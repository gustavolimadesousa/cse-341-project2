// testConnection.js
const { MongoClient } = require("mongodb");
require("dotenv").config();

async function testConnection() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const dbName = process.env.DB_NAME || "transaction_api";

  console.log("Testing connection to:", uri);

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });

  try {
    await client.connect();
    console.log("✅ Successfully connected to MongoDB server");

    const db = client.db(dbName);
    console.log(`✅ Successfully accessed database: ${dbName}`);

    // Test a simple collection operation
    const testCollection = db.collection("connection_test");
    await testCollection.insertOne({ test: new Date() });
    console.log("✅ Successfully inserted test document");

    const docs = await testCollection.find().toArray();
    console.log("✅ Found documents:", docs);

    await testCollection.deleteMany({});
    console.log("✅ Cleaned up test documents");
  } catch (err) {
    console.error("❌ Connection test failed:", err.message);

    if (err.name === "MongoServerSelectionError") {
      console.log("Please ensure MongoDB is running and accessible");
      console.log("For local MongoDB, try running: mongod");
    }
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

testConnection();

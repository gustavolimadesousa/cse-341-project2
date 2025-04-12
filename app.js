require("dotenv").config(); // Add this at the very top
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const YAML = require("yamljs");
const { connectToDatabase, closeConnection } = require("./db");
const mongoose = require("mongoose");
const cors = require("cors"); // Add this line

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: [
    "https://cse-341-project2-74cg.onrender.com",
    "http://localhost:3000",
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};
app.use(cors(corsOptions)); // Enable CORS with options

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }
  next();
});

// Routes
const userRoutes = require("./routes/users");
const transactionRoutes = require("./routes/transactions");

app.use("/api/users", userRoutes);
app.use("/api/users", transactionRoutes); // Register transaction routes under /api

// Swagger setup
const swaggerDefinition = YAML.load("./swagger.yaml");
const options = {
  swaggerDefinition,
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Enhanced server startup
async function startServer() {
  try {
    console.log("Starting server initialization...");

    // First connect to database
    const db = await connectToDatabase();
    console.log(`Connected to database: ${db.databaseName}`);

    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;

    mongoose
      .connect(mongoUri, { dbName })
      .then(() => console.log("Connected to MongoDB"))
      .catch((err) => console.error("MongoDB connection error:", err));

    // Then start Express server
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
      console.log(`Health check at http://localhost:${PORT}/health`);
    });

    // Graceful shutdown handlers
    const shutdown = async () => {
      console.log("Shutting down gracefully...");
      await closeConnection();
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    // Handle uncaught exceptions
    process.on("uncaughtException", (err) => {
      console.error("Uncaught Exception:", err);
      shutdown();
    });

    process.on("unhandledRejection", (err) => {
      console.error("Unhandled Rejection:", err);
      shutdown();
    });
  } catch (err) {
    console.error("Server startup failed:", err);
    await closeConnection().catch((e) =>
      console.error("Error during cleanup:", e)
    );
    process.exit(1);
  }
}

startServer();

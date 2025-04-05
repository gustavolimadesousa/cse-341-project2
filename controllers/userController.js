const { connectToDatabase } = require("../db");
const { ObjectId } = require("mongodb");

async function getAllUsers(req, res) {
  try {
    const db = await connectToDatabase();
    const users = await db.collection("users").find().toArray();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({
      message: "Failed to fetch users",
      error: err.message,
    });
  }
}

async function getUserById(req, res) {
  const { userId } = req.params;


  // Validate ObjectId format
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    const db = await connectToDatabase();
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({
      message: "Failed to fetch user",
      error: err.message,
    });
  }
}

async function createUser(req, res) {
  if (!req.body.name || !req.body.email) {
    return res.status(400).json({
      message: "Name and email are required",
    });
  }

  const session = (await connectToDatabase()).client.startSession();
  try {
    let createdUser;

    await session.withTransaction(async () => {
      const db = session.client.db();

      const userData = {
        name: req.body.name,
        email: req.body.email,
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("users").insertOne(userData, { session });

      createdUser = {
        ...userData,
        _id: result.insertedId,
      };
    });

    res.status(201).json(createdUser);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({
      message: "Failed to create user",
      error: err.message,
    });
  } finally {
    await session.endSession();
  }
}

async function updateUser(req, res) {
  const { userId } = req.params;

  // Validate ObjectId format
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  if (!req.body.name || !req.body.email) {
    return res.status(400).json({
      message: "Name and email are required",
    });
  }

  const session = (await connectToDatabase()).client.startSession();
  try {
    let updatedUser;

    await session.withTransaction(async () => {
      const db = session.client.db();

      // Check if user exists
      const existingUser = await db.collection("users").findOne(
        { _id: new ObjectId(userId) },
        { session }
      );

      if (!existingUser) {
        throw new Error("User not found");
      }

      // Update user
      const result = await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            updatedAt: new Date(),
          },
        },
        { session }
      );

      updatedUser = {
        _id: userId,
        name: req.body.name,
        email: req.body.email,
        updatedAt: new Date(),
      };
    });

    res.json({
      message: "User updated successfully",
      updatedUser,
    });
  } catch (err) {
    console.error("Error updating user:", err);
    const status = err.message === "User not found" ? 404 : 500;
    res.status(status).json({
      message: "Failed to update user",
      error: err.message,
    });
  } finally {
    await session.endSession();
  }
}

async function deleteUser(req, res) {
  const { userId } = req.params;

  // Validate ObjectId format
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  const session = (await connectToDatabase()).client.startSession();
  try {
    await session.withTransaction(async () => {
      const db = session.client.db();

      // Check if user exists
      const user = await db.collection("users").findOne(
        { _id: new ObjectId(userId) },
        { session }
      );

      if (!user) {
        throw new Error("User not found");
      }

      // Delete user
      await db.collection("users").deleteOne({ _id: new ObjectId(userId) }, { session });

      // Delete all transactions for this user
      await db.collection("transactions").deleteMany({ userId: userId }, { session });
    });

    res.json({ message: "User and related transactions deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    const status = err.message === "User not found" ? 404 : 500;
    res.status(status).json({
      message: "Failed to delete user",
      error: err.message,
    });
  } finally {
    await session.endSession();
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};

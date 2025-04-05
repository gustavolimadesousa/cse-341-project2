// controllers/transactionController.js
const { connectToDatabase } = require("../db");
const { ObjectId } = require("mongodb");

async function getTransactionsByUser(req, res) {
  try {
    const db = await connectToDatabase();
    const transactions = await db
      .collection("transactions")
      .find({ userId: req.params.userId })
      .sort({ date: -1 }) // Sort by most recent first
      .toArray();

    res.json(transactions);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({
      message: "Failed to fetch transactions",
      error: err.message,
    });
  }
}

async function getTransactionById(req, res) {
  try {
    if (!ObjectId.isValid(req.params.transactionId)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const db = await connectToDatabase();
    const transaction = await db.collection("transactions").findOne({
      _id: new ObjectId(req.params.transactionId),
      userId: req.params.userId,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(transaction);
  } catch (err) {
    console.error("Error fetching transaction:", err);
    res.status(500).json({
      message: "Failed to fetch transaction",
      error: err.message,
    });
  }
}

async function createTransaction(req, res) {
  if (!req.body.amount || isNaN(req.body.amount) || !req.body.type) {
    return res.status(400).json({
      message: "Valid amount and type are required",
    });
  }

  const session = (await connectToDatabase()).client.startSession();
  try {
    let createdTransaction;

    await session.withTransaction(async () => {
      const db = session.client.db();

      // Verify user exists
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(req.params.userId) }, { session });

      if (!user) {
        throw new Error("User not found");
      }

      // Create transaction
      const transactionData = {
        userId: req.params.userId,
        amount: parseFloat(req.body.amount),
        type: req.body.type,
        description: req.body.description || "",
        date: new Date(),
        createdAt: new Date(),
      };

      const result = await db
        .collection("transactions")
        .insertOne(transactionData, { session });

      // Update user balance
      await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(req.params.userId) },
          { $inc: { balance: transactionData.amount } },
          { session }
        );

      createdTransaction = {
        ...transactionData,
        _id: result.insertedId,
      };
    });

    res.status(201).json(createdTransaction);
  } catch (err) {
    console.error("Error creating transaction:", err);
    const status = err.message === "User not found" ? 404 : 500;
    res.status(status).json({
      message: "Failed to create transaction",
      error: err.message,
    });
  } finally {
    await session.endSession();
  }
}

async function updateTransaction(req, res) {
  if (!req.body.amount || isNaN(req.body.amount)) {
    return res.status(400).json({ message: "Valid amount is required" });
  }

  const session = (await connectToDatabase()).client.startSession();
  try {
    await session.withTransaction(async () => {
      const db = session.client.db();

      // Get existing transaction
      const existingTx = await db.collection("transactions").findOne(
        {
          _id: new ObjectId(req.params.transactionId),
          userId: req.params.userId,
        },
        { session }
      );

      if (!existingTx) {
        throw new Error("Transaction not found");
      }

      const amountDiff = parseFloat(req.body.amount) - existingTx.amount;

      // Update transaction
      await db.collection("transactions").updateOne(
        { _id: new ObjectId(req.params.transactionId) },
        {
          $set: {
            amount: parseFloat(req.body.amount),
            type: req.body.type || existingTx.type,
            description: req.body.description || existingTx.description,
            updatedAt: new Date(),
          },
        },
        { session }
      );

      // Update user balance if amount changed
      if (amountDiff !== 0) {
        await db
          .collection("users")
          .updateOne(
            { _id: new ObjectId(req.params.userId) },
            { $inc: { balance: amountDiff } },
            { session }
          );
      }
    });

    res.json({ message: "Transaction updated successfully" });
  } catch (err) {
    console.error("Error updating transaction:", err);
    const status = err.message === "Transaction not found" ? 404 : 500;
    res.status(status).json({
      message: "Failed to update transaction",
      error: err.message,
    });
  } finally {
    await session.endSession();
  }
}

async function deleteTransaction(req, res) {
  const { transactionId, userId } = req.params;

  // Validate ObjectId for transactionId
  if (!ObjectId.isValid(transactionId)) {
    return res.status(400).json({ message: "Invalid transaction ID" });
  }

  console.log("Transaction ID:", transactionId);
  console.log("User ID:", userId);

  const session = (await connectToDatabase()).client.startSession();
  try {
    await session.withTransaction(async () => {
      const db = session.client.db();

      // Get and validate transaction
      const transaction = await db.collection("transactions").findOne(
        {
          _id: new ObjectId(transactionId),
          userId: userId, // Use as string if stored as string
        },
        { session }
      );

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      // Delete transaction
      await db
        .collection("transactions")
        .deleteOne({ _id: new ObjectId(transactionId) }, { session });

      // Update user balance
      await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(userId) },
          { $inc: { balance: -transaction.amount } },
          { session }
        );
    });

    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    console.error("Error deleting transaction:", err.message);
    const status = err.message === "Transaction not found" ? 404 : 500;
    res.status(status).json({
      message: "Failed to delete transaction",
      error: err.message,
    });
  } finally {
    await session.endSession();
  }
}

module.exports = {
  getTransactionsByUser,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};

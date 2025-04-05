// routes/transactions.js
const express = require("express");
const router = express.Router();
const {
  getTransactionsByUser,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: User transaction management
 */

/**
 * @swagger
 * /users/{userId}/transactions:
 *   get:
 *     summary: Get all transactions for a user
 *     tags: [Transactions]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: List of user transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid user ID format
 *       404:
 *         description: User not found
 */
router.get("/:userId/transactions", getTransactionsByUser);

/**
 * @swagger
 * /users/{userId}/transactions/{transactionId}:
 *   get:
 *     summary: Get a specific transaction
 *     tags: [Transactions]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/transactionIdParam'
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Transaction not found
 */
router.get("/:userId/transactions/:transactionId", getTransactionById);

/**
 * @swagger
 * /users/{userId}/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionInput'
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Bad request (missing or invalid data)
 *       404:
 *         description: User not found
 */
router.post("/:userId/transactions", createTransaction);

/**
 * @swagger
 * /users/{userId}/transactions/{transactionId}:
 *   put:
 *     summary: Update a transaction
 *     tags: [Transactions]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/transactionIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionInput'
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Bad request (missing or invalid data)
 *       404:
 *         description: Transaction not found
 */
router.put("/:userId/transactions/:transactionId", updateTransaction);

/**
 * @swagger
 * /users/{userId}/transactions/{transactionId}:
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transactions]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/transactionIdParam'
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Transaction not found
 */
router.delete("/:userId/transactions/:transactionId", deleteTransaction);

module.exports = router;

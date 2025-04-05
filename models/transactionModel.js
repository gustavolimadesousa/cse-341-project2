
// models/transactionModel.js
let transactions = [
  {
    id: 1,
    userId: 1,
    amount: 100,
    type: 'deposit',
    description: 'Initial deposit',
    date: '2023-01-01T10:00:00Z'
  },
  {
    id: 2,
    userId: 1,
    amount: -50,
    type: 'withdrawal',
    description: 'ATM withdrawal',
    date: '2023-01-02T14:30:00Z'
  },
  {
    id: 3,
    userId: 2,
    amount: 200,
    type: 'deposit',
    description: 'Paycheck',
    date: '2023-01-03T09:15:00Z'
  }
];

module.exports = {
  transactions
};
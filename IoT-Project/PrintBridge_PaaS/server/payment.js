// Simulated Payment Gateway - Professional Demo Version
// Mimics real payment gateway behavior without requiring registration
// Perfect for demos, presentations, and development

const { v4: uuidv4 } = require('uuid');

const payments = new Map();
const transactions = new Map();

// Simulate payment gateway initialization
const GATEWAY_CONFIG = {
  name: 'PrintBridge-PaaS - PaaS Payment Gateway',
  mode: 'test',
  currency: 'INR',
  processingTime: 800, // milliseconds
  successRate: 100 // 100% for demo
};

// Generate realistic transaction ID
function generateTransactionId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN${timestamp}${random}`;
}

// Generate realistic payment ID
function generatePaymentId() {
  return `PAY-${uuidv4().split('-')[0].toUpperCase()}`;
}

// Simulate payment processing with realistic flow
async function processPayment(amount, currency = 'INR', customerEmail, isColor = false, copies = 1) {
  const transactionId = generateTransactionId();
  const paymentId = generatePaymentId();
  const timestamp = new Date().toISOString();
  
  console.log('🏦 Payment Gateway: Initiating transaction');
  console.log('   Transaction ID:', transactionId);
  console.log('   Amount:', `${currency} ${amount}`);
  console.log('   Customer:', customerEmail);
  console.log('   Copies:', copies);
  
  // Create transaction record
  const transaction = {
    transactionId,
    paymentId,
    amount,
    currency,
    customerEmail,
    isColor,
    copies,
    status: 'processing',
    initiatedAt: timestamp,
    method: 'simulated_gateway'
  };
  
  transactions.set(transactionId, transaction);
  
  // Simulate payment processing delay (realistic timing)
  await new Promise(resolve => setTimeout(resolve, GATEWAY_CONFIG.processingTime));
  
  // Payment always succeeds in demo mode
  const payment = {
    id: paymentId,
    transactionId,
    amount,
    currency,
    customerEmail,
    isColor,
    copies,
    status: 'completed',
    timestamp,
    completedAt: new Date().toISOString(),
    receiptNumber: `RCP-${Date.now()}`,
    method: 'Simulated Payment Gateway',
    verified: true,
    gatewayResponse: {
      code: '200',
      message: 'Payment successful',
      authCode: `AUTH${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      rrn: `RRN${Date.now().toString().slice(-12)}`
    }
  };
  
  payments.set(paymentId, payment);
  transaction.status = 'completed';
  transaction.completedAt = payment.completedAt;
  
  console.log('✅ Payment Gateway: Transaction successful');
  console.log('   Payment ID:', paymentId);
  console.log('   Status:', payment.status);
  console.log('   Auth Code:', payment.gatewayResponse.authCode);
  
  return payment;
}

// Generate detailed payment receipt
function generateReceipt(paymentId) {
  const payment = payments.get(paymentId);
  if (!payment || payment.status !== 'completed') {
    return null;
  }
  
  return {
    receiptNumber: payment.receiptNumber,
    paymentId: payment.id,
    transactionId: payment.transactionId,
    amount: payment.amount,
    currency: payment.currency,
    customerEmail: payment.customerEmail,
    timestamp: payment.timestamp,
    completedAt: payment.completedAt,
    description: 'PrintBridge-PaaS - PaaS | Printer as a Service',
    status: 'PAID',
    verified: true,
    method: payment.method,
    gatewayResponse: payment.gatewayResponse,
    merchant: {
      name: 'PrintBridge-PaaS - PaaS',
      id: 'MERCHANT_VPS_001'
    }
  };
}

// Verify payment (for Arduino verification)
function verifyPayment(paymentId) {
  const payment = payments.get(paymentId);
  
  if (!payment) {
    return {
      verified: false,
      status: 'not_found',
      message: 'Payment not found'
    };
  }
  
  if (payment.status !== 'completed') {
    return {
      verified: false,
      status: payment.status,
      message: 'Payment not completed'
    };
  }
  
  return {
    verified: true,
    status: 'completed',
    paymentId: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    timestamp: payment.timestamp,
    message: 'Payment verified successfully'
  };
}

// Get payment by ID
function getPayment(paymentId) {
  return payments.get(paymentId);
}

// Get transaction by ID
function getTransaction(transactionId) {
  return transactions.get(transactionId);
}

// Get gateway status (for monitoring)
function getGatewayStatus() {
  return {
    name: GATEWAY_CONFIG.name,
    mode: GATEWAY_CONFIG.mode,
    status: 'operational',
    totalTransactions: transactions.size,
    totalPayments: payments.size,
    successRate: `${GATEWAY_CONFIG.successRate}%`
  };
}

module.exports = {
  processPayment,
  generateReceipt,
  verifyPayment,
  getPayment,
  getTransaction,
  getGatewayStatus
};

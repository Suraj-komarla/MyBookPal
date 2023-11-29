const http = require('http');
const url = require('url');
const mysql = require('mysql2');
const cron = require('node-cron');
const { listAvailableBooks, borrowBooks, returnBooks, borrowedBooks } = require('./bookLending.js');
const { checkReservedBooks, newSubscription, cancelSubscription, getSubscriptions, 
  getNotificationPreferences, updateNotificationPreferences } = require('./notificationRequests.js');
const { getAllBooks, searchBooks, orderBooks, filterBooks, getBook,
 newBook, updateBook, deleteBook, deleteAll } = require('./listAllBooks.js');
const { viewUserCart, addBalancetoWallet, purchaseProduct, addToCart, viewPurchaseHistory,
 deleteFromCart} = require('./purchase.js');

//Create a connection to your MySQL database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'heythere',
  database: 'project',
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to the database');
});

const port = 3000;

// Schedule the function to run every 5 minutes
cron.schedule('*/1 * * * *', () => {
  //console.log('Checking for available books and sending notifications...');
  checkReservedBooks(connection);
});

const server = http.createServer((req, res) => {
  const reqUrl = url.parse(req.url, true);

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/books/availableLending')) {
    listAvailableBooks(connection, req, res)
  } else if (req.method === 'POST' && reqUrl.pathname.startsWith('/books/borrow')) {
    const queryParams = new URLSearchParams(reqUrl.query);
    const Title = queryParams.get('Title');
    borrowBooks(connection, req, res, Title);
  } else if (req.method === 'POST' && reqUrl.pathname.startsWith('/books/return')) {
    const queryParams = new URLSearchParams(reqUrl.query);
    const Title = queryParams.get('Title');
    returnBooks(connection, req, res, Title);
  } else if (req.method === 'GET' && reqUrl.pathname === '/books/borrowed'){
    borrowedBooks(connection, req, res);
  } else if (req.method === 'POST' && reqUrl.pathname.startsWith('/books/subscribe')){
    const queryParams = new URLSearchParams(reqUrl.query);
    const Title = queryParams.get('Title');
    const Book_condition = queryParams.get('Book_condition');
    newSubscription(connection, req, res, Title, Book_condition);
  } else if (req.method === 'DELETE' && reqUrl.pathname.startsWith('/books/unsubscribe')) {
    const queryParams = new URLSearchParams(reqUrl.query);
    const Title = queryParams.get('Title');
    const Book_condition = queryParams.get('Book_condition');
    cancelSubscription(connection, req, res, Title, Book_condition);
  } else if (req.method === 'GET' && reqUrl.pathname === '/notifications') {
    getSubscriptions(connection, req, res);
  } else if (req.method === 'GET' && reqUrl.pathname === '/notifications/preferences') {
    getNotificationPreferences(connection, req, res);
  } else if (req.method === 'POST' && reqUrl.pathname === '/notifications/preferences') {
    updateNotificationPreferences(connection, req, res);
  } else if (req.method === 'GET' && req.url === '/books') {
    getAllBooks(connection,req,res);
  } else if (req.method === 'GET' && req.url.startsWith('/books/search')) {
    searchBooks(connection, req, res);
  } else if (req.method === 'GET' && req.url.startsWith('/books/order')) {
    orderBooks(connection, req, res);
  } else if (req.method === 'GET' && req.url.startsWith('/books/filter')) {
    filterBooks(connection, req, res);
  } else if (req.method === 'GET' && req.url.startsWith('/books/')) {
    getBook(connection, req, res);
  } else if (req.method === 'POST' && req.url.startsWith('/books/')) {
    newBook(connection, req, res);
  } else if (req.method === 'PATCH' && req.url.startsWith('/updatebook')) {
    updateBook(connection, req, res);
  } else if (req.method === 'DELETE' && req.url.startsWith('/deletebook')) {
    deleteBook(connection, req, res);
  } else if (req.method === 'DELETE' && req.url.startsWith('/all/')) {
    deleteAll(connection, req, res);
  } else if (req.method === 'GET' && req.url.startsWith('/view_cart')) {
    viewUserCart(connection, req, res);
  } else if (req.method === 'POST' && req.url.startsWith('/add_wallet_amount')) {
    addBalancetoWallet(req, res);
  } else if (req.method === 'POST' && req.url.startsWith('/purchase_product')) {
    purchaseProduct(connection, req, res);
  } else if (req.method === 'POST' && req.url.startsWith('/add_cart')) {
    addToCart(connection, req, res);
  } else if (req.method === 'GET' && req.url.startsWith('/purchase_history')) {
    viewPurchaseHistory(connection, req, res);
  } else if (req.method === 'DELETE' && req.url.startsWith('/delete_from_cart')) {
    deleteFromCart(connection, req, res);
  } 
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

process.on('SIGINT', () => {
  connection.end((err) => {
      if (err) console.error('Error closing the database connection:', err);
      process.exit();
  });
});
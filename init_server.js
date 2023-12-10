const http = require('http');
const url = require('url');
const mysql = require('mysql2');
const fs = require('fs'); // Add this line
const path = require('path'); // Add this line
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
let user_id = 0;

// JWT Secret Key
const JWT_SECRET_KEY = 'TRaKtr75iER4atLU';

// const { listAvailableBooks, borrowBooks, returnBooks, borrowedBooks } = require('./bookLending.js');
// const { checkReservedBooks, newSubscription, cancelSubscription, getSubscriptions, 
//   getNotificationPreferences, updateNotificationPreferences } = require('./notificationRequests.js');
// const { getAllBooks, searchBooks, orderBooks, filterBooks, getBook,
//  newBook, updateBook, deleteBook, deleteAll, sortBooks } = require('./listAllBooksServer.js');
// const { viewUserCart, addBalancetoWallet, purchaseProduct, addToCart, viewPurchaseHistory,
//  deleteFromCart,
//  placeBid} = require('./purchase.js');
const { handleRegister, handleUpdateCustomer, handleGetAllCustomers, 
 handleGetCustomer, handleGetBooks, getUserIDFromDatabase } = require('./user_auth_jwt.js');
// const { createBookListing, GetBookListing, EditListing, handleGetAuctionHistoryRequest, 
//   handleGetFilterAuctionsRequest, handleGetFilterListingsRequest, handlePutEditAuctionRequest,
//   handleDeleteListingRequest, handleDeleteAuctionRequest, handleRelistBookRequest,checkAndNotifyExpiredAuctions} = require('./sellerserver.js');
// const showBookDetails = require("./bookdetails.js");
// const handlers = require('./handler');

//Create a connection to your MySQL database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'admin',
  password: 'password',
  database: 'mybookpal',
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to the database');
});

// async function verifyToken(req, res, next) {
//     const bearerHeader = req.headers['authorization'];
//     console.log('token:', bearerHeader);
//     if (typeof bearerHeader !== 'undefined') {
//         const token = bearerHeader.split(' ')[1];
//         try {
//             const decoded = await jwt.verify(token, JWT_SECRET_KEY);
//             console.log("Decode token:", decoded);
//             const userID = await getUserIDFromDatabase(decoded.emailid);
//             user_id = userID;
//             console.log("User ID:", userID);
//             req.emailid = decoded.emailid;
//             next();
//         } catch (err) {
//             console.log("Error:", err);
//             res.writeHead(err.name === 'JsonWebTokenError' ? 403 : 401);
//             res.end('Invalid or expired token');
//         }
//     } else {
//         res.writeHead(401);
//         res.end('Unauthorized');
//     }
// }

function serveFile(filePath, contentType, res) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            res.writeHead(500);
            res.end('Server Error');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
    }

const port = 3000;

// Schedule the function to run every 5 minutes
// cron.schedule('*/1 * * * *', () => {
//   //console.log('Checking for available books and sending notifications...');
//   checkReservedBooks(connection);
// });
// setInterval(() => {
//   checkAndNotifyExpiredAuctions(connection);
// }, 60 * 1000);

const server = http.createServer((req, res) => {
  const reqUrl = url.parse(req.url, true);
  const {
    pathname
  } = reqUrl;
  const qs = require("qs");
  const myparams = reqUrl.query || {};
  const params = qs.parse(myparams);
  //Shashwenth
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  if (req.method === 'GET' && reqUrl.pathname.startsWith('/books/availableLending')) {
    listAvailableBooks(connection, req, res)
  } else if (reqUrl.pathname.startsWith("/displaybook") && req.method === "GET") {
    showBookDetails(req,res,params, connection);
  } 
  // User Auth //
  else if ( (pathname === '/login') && req.method === 'POST') {
    console.log('Inside login POST');
    handleLogin(req, res);
} else if ( (pathname === '/login' || pathname === '/' ) && req.method === 'GET') {
    console.log('Inside login GET');
    // console.log('res:', res);
    serveFile('login.html', 'text/html', res);
} else if ( (pathname === '/register' ) && req.method === 'GET') {
    console.log('Inside register GET');
    // console.log('res:', res);
    serveFile('createacc.html', 'text/html', res);} 
else if (pathname === '/register' && req.method === 'POST') {
    console.log('Inside register');
    handleRegister(req, res);
} else if (req.method === 'PUT' && pathname.startsWith('/customers/')) {
    verifyToken(req, res, () => handleUpdateCustomer(req, res, pathname));
} else if (req.method === 'GET' && pathname === '/customers') {
    console.log('/customers true');
    verifyToken(req, res, () => handleGetAllCustomers(req, res));
} else if (req.method === 'GET' && pathname.startsWith('/customers/')) {
    console.log("Pathname before verifyToken:", pathname);
    verifyToken(req, res, () => {
        console.log("Inside verifyToken. Pathname:", pathname);
        handleGetCustomer(req, res, pathname);
    });
} else if (req.method === 'GET' && pathname.startsWith('/get-books/')) {
    verifyToken(req, res, () => handleGetBooks(req, res, pathname));}

  
  else if (reqUrl.pathname.startsWith("/displaybook") && req.method === "GET") {
    showBookDetails(req,res,params, connection);
  } else if (req.method === 'POST' && reqUrl.pathname.startsWith('/books/borrow')) {
    const queryParams = new URLSearchParams(reqUrl.query);
    const Title = queryParams.get('Title');
    borrowBooks(connection, req, res, Title);
  } else if (req.method === 'POST' && reqUrl.pathname.startsWith('/books/return')) {
    const queryParams = new URLSearchParams(reqUrl.query);
    const Title = queryParams.get('Title');
    returnBooks(connection, req, res, Title);
  } else if (req.method === 'GET' && reqUrl.pathname === '/books/borrowed') {
    borrowedBooks(connection, req, res);
  } else if (req.method === 'POST' && reqUrl.pathname.startsWith('/books/subscribe')) {
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
    getAllBooks(connection, req, res);
  } else if (req.method === 'GET' && req.url.startsWith('/books/search')) {
    searchBooks(connection, req, res);
  } else if (req.method === 'GET' && req.url.startsWith('/books/order')) {
    orderBooks(connection, req, res);
  } else if (req.method === 'GET' && req.url.startsWith('/books/filter')) {
    filterBooks(connection, req, res);
  } else if (req.method === 'GET' && req.url.startsWith('/books/sort')) {
    sortBooks(connection, req, res);
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
  } else if (req.method === 'GET' && pathname.startsWith('/get-books/')) {
    handleGetBooks(connection, req, res, pathname);
  } else if (req.method === "POST" && pathname.startsWith("/book")) {
    createBookListing(req, res, params, body, contentType, connection);
  } else if (req.method === "GET" && pathname.startsWith("/book/listing")) {
    GetBookListing(req, res, params, connection);
  } else if (req.method === "PUT" && pathname.startsWith("/book/editlisting")) {
    EditListing(req, res, params, body, connection);
  } else if (req.method === "GET" && pathname.startsWith("/auctionhistory")) {
    handleGetAuctionHistoryRequest(req, res, params, connection);
  } else if (req.method === "GET" && pathname === "/book/filterauctions") {
    handleGetFilterAuctionsRequest(req, res, params, connection);
  } else if (req.method === "GET" && pathname === "/book/filterlistings") {
    handleGetFilterListingsRequest(req, res, params, connection);
  } else if (req.method === "PUT" && pathname.startsWith("/book/editauction")) {

    handlePutEditAuctionRequest(req, res, params, body,connection);
  } else if (req.method === "POST" && pathname.startsWith("/book/placeBid")) {
    placeBid(connection, req, res);

  } else if (req.method === "DELETE" && pathname.startsWith("/book/deletelisting")) {
    handleDeleteListingRequest(req, res, params, connection);
  } else if (req.method === "DELETE" && pathname.startsWith("/book/deleteauction")) {
    handleDeleteAuctionRequest(req, res, params, connection);
  } else if (req.method === "PUT" && pathname.startsWith("/relist")) {
    handleRelistBookRequest(req, res, params, body, connection);
  } //Shashwenth Code
  else if (req.method === 'GET' && path === '/') {
    handlers.serveIndex(req, res);
  } else if (req.method === 'GET' && path.match('\.html$') || path.match('\.js$')) {
    handlers.serveStaticFiles(req, res, path);
  } else if (req.method === 'GET' && path.startsWith('/assets')) {
    handlers.serveStaticFiles(req, res, path);
  } else if (req.method === 'POST' && req.url === '/queries') {
    handlers.postQueries(req, res);
  } else if (req.method === 'GET' && path === '/notifications-CR') {
    handlers.getNotifications(req, res);
  } else if (req.method === 'GET' && path === '/view_history') {
    handlers.getViewHistory(req, res);
  } else if (req.method === 'POST' && path === '/submit-feedback') {
    console.log("submission");
    handlers.updatefeedback(req, res);
  } else if (req.method === 'POST' && path === '/delete-notifications') {
    console.log("Inside 1");
    handlers.deleteNotifications(req, res);
  } else {
    res.writeHead(404, {
      'Content-Type': 'text/plain'
    });
    res.end('Not Found');
  }
});


async function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    console.log('token:', bearerHeader);
    if (typeof bearerHeader !== 'undefined') {
        const token = bearerHeader.split(' ')[1];
        try {
            const decoded = await jwt.verify(token, JWT_SECRET_KEY);
            console.log("Decode token:", decoded);
            const userID = await getUserIDFromDatabase(decoded.emailid);
            console.log("User ID:", userID);
            req.user_id = userID;
            console.log("CHECK req", req);
            next();
        } catch (err) {
            console.log("Error:", err);
            res.writeHead(err.name === 'JsonWebTokenError' ? 403 : 401);
            res.end('Invalid or expired token');
        }
    } else {
        res.writeHead(401);
        res.end('Unauthorized');
    }
}


function handleLogin(req, res) {
    let body = '';
 
 
    req.on('data', chunk => {
        body += chunk.toString();
    });
 
 
    req.on('end', () => {
        const { emailid, password } = JSON.parse(body);
        
        console.log(emailid, password);
        const query = 'SELECT * FROM CUSTOMER WHERE Email = ? AND UserPassword = ?';
        connection.query(query, [emailid, password], (err, results) => {
            if (err || results.length === 0) {
                console.log("Error",err);
                res.writeHead(401);
                res.end('Login failed');
                return;
            }
            // console.log("CHECK::",err);
            const token = jwt.sign({ emailid }, JWT_SECRET_KEY, { expiresIn: '48h' });
            console.log("token :", token);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ token }));
        });
    });
 }









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

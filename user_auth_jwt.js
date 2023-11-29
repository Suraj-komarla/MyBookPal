const http = require('http');
const mysql = require('mysql2');
const url = require('url');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Create a MySQL database connection
const db = mysql.createConnection({
    // ... [database configuration]
    host: 'localhost',
    user: 'admin',
    password: 'password',
    database: 'mybookpal',
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('MySQL Connection Error: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL database');
});

// JWT Secret Key
const JWT_SECRET_KEY = 'yourSecretKey'; // Replace with your actual secret key

// Function to verify JWT Token
function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        jwt.verify(bearerToken, JWT_SECRET_KEY, (err, authData) => {
            if (err) {
                res.writeHead(403, { 'Content-Type': 'text/plain' });
                res.end('Forbidden');
            } else {
                req.authData = authData;
                next();
            }
        });
    } else {
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Unauthorized');
    }
}

// Create an HTTP server
const server = http.createServer((req, res) => {
    const reqUrl = url.parse(req.url, true);
    const { pathname } = reqUrl;

    if (pathname === '/login' && req.method === 'POST') {
        handleLogin(req, res);
    } else if (pathname === '/register' && req.method === 'POST') {
        handleRegister(req, res);
    } else if (req.method === 'PUT' && pathname.startsWith('/customers/')) {
        verifyToken(req, res, () => handleUpdateCustomer(req, res, pathname));
    } else if (req.method === 'GET' && pathname === '/customers') {
        verifyToken(req, res, () => handleGetAllCustomers(req, res));
    } else if (req.method === 'GET' && pathname.startsWith('/customers/')) {
        verifyToken(req, res, () => handleGetCustomer(req, res, pathname));
    } else if (req.method === 'GET' && pathname.startsWith('/get-books/')) {
        verifyToken(req, res, () => handleGetBooks(req, res, pathname));
    } else {
        handleDefaultGet(req, res);
    }
});

// ... [Other functions: handleLogin, handleRegister, handleUpdateCustomer, handleGetAllCustomers, handleGetCustomer, handleGetBooks, handleDefaultGet]

// Function to handle login - Modified to include JWT
function handleLogin(req, res) {
    // ... [existing login logic]

    req.on('end', () => {
        const formData = JSON.parse(data);
        // ... [existing login logic]
        db.query(query, [username, password], (err, results) => {
            // ... [existing error handling]

            if (results.length > 0) {
                // User found, create JWT token
                const token = jwt.sign(
                    { username: username },
                    JWT_SECRET_KEY,
                    { expiresIn: '1h' } // Token expires in 1 hour
                );

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Login Successful', token: token }));
            } else {
                // ... [existing login failure logic]
            }
        });
    });
}

// ... [Other functions: handleRegister, handleUpdateCustomer, handleGetAllCustomers, handleGetCustomer, handleGetBooks, handleDefaultGet]

// Start the server
const port = 3000;
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

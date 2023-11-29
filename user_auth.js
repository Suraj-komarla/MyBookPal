const http = require('http');
const mysql = require('mysql2');
const url = require('url');
const fs = require('fs');

// Function to handle login
function handleLogin(db, req, res) {
    // ... [login logic]
    let data = '';
    req.on('data', (chunk) => {
        data += chunk;
    });

    req.on('end', () => {
        const formData = JSON.parse(data);
        const username = formData.username;
        const password = formData.password;
        console.log('login', username, password);

        // Check username and password against the database
        const query = 'SELECT * FROM CUSTOMER WHERE UserID = ? AND UserPassword = ?';
        db.query(query, [username, password], (err, results) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            } else {
                console.log('login', err);
                if (results.length > 0) {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('Login Successful');
                } else {
                    res.writeHead(401, { 'Content-Type': 'text/plain' });
                    res.end('Login Failed');
                }
            }
        });
    });
}

// Function to handle registration
function handleRegister(db, req, res) {
    // ... [registration logic]
    let data = '';
    req.on('data', (chunk) => {
        data += chunk;
    });

    req.on('end', () => {
        const formData = JSON.parse(data);
        const username = formData.username;
        const password = formData.password;
        const firstName = formData.first_name;
        const lastName = formData.last_name;
        const usertype = formData.user_type;
        const email = formData.email;
        const address = formData.address;
        const phone = formData.phone;

        // Validate phone number length
        const maxPhoneLength = 20; // This should match the length defined in your DB
        if (phone.length > maxPhoneLength) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Phone number is too long');
            return;
        }

        // Check if the username already exists in the database
        const usernameCheckQuery = 'SELECT UserID FROM CUSTOMER WHERE UserID = ?';
        db.query(usernameCheckQuery, [username], (err, results) => {
            if (err) {
                console.log("Error checking username", err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Registration Failed');
            } else if (results.length > 0) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Username already exists');
            } else {
                // Insert the new user into the database
                const insertQuery = 'INSERT INTO CUSTOMER (UserID, FirstName, LastName, PhoneNumber, Email, UserAddress, UserPassword, UserType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                db.query(insertQuery, [username, firstName, lastName, phone, email, address, password, usertype], (err) => {
                    if (err) {
                        console.log("Error inserting new user", err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Registration Failed');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('Registration Successful');
                    }
                });
            }
        });
    });
}

// Function to handle updating a customer
function handleUpdateCustomer(db, req, res, pathname) {
    // ... [update customer logic]
    const Username = pathname.split('/')[2];
    let data = '';
    req.on('data', (chunk) => {
        data += chunk;
    });

    req.on('end', () => {
        try {
            const customer = JSON.parse(data);
            let update_customer = customer;
            db.query('UPDATE Customer SET FirstName = ?, LastName = ?, PhoneNumber = ?, Email = ?, UserAddress = ?, UserPassword = ?, UserType = ? WHERE UserID = ?', 
                     [update_customer.first_name, update_customer.last_name, update_customer.phone, update_customer.email, update_customer.address, update_customer.password, update_customer.user_type, Username], 
                     (err) => {
                if (err) {
                    res.statusCode = 500;
                    res.end('Internal Server Error');
                } else {
                    res.statusCode = 200;
                    res.end('Customer updated');
                }
            });
        } catch (err) {
            res.statusCode = 400;
            res.end('Invalid request');
        }
    });
}

// Function to handle getting all customers
function handleGetAllCustomers(db, req, res) {
    // ... [get all customers logic]
    db.query('SELECT UserID, FirstName, LastName, PhoneNumber, Email, UserAddress, UserType FROM Customer', (err, rows) => {
        if (err) {
            res.statusCode = 500;
            res.end('Internal Server Error');
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(rows));
        }
    });
}

// Function to handle getting a specific customer
function handleGetCustomer(db, req, res, pathname) {
    // ... [get specific customer logic]
    const Username = pathname.split('/')[2];
    db.query('SELECT UserID, FirstName, LastName, PhoneNumber, Email, UserAddress, UserType FROM Customer WHERE UserID = ?', [Username], (err, row) => {
        if (err) {
            res.statusCode = 500;
            res.end('Internal Server Error');
        } else if (!row) {
            res.statusCode = 404;
            res.end('Customer not found');
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(row));
        }
    });
}

// Function to handle getting books based on filter criteria
function handleGetBooks(db, req, res, pathname) {
    // ... [get books logic]
    const queryParams = pathname.split('/')[2];
    try {
        const filterCriteria = JSON.parse(queryParams.filter);

        if (Object.keys(filterCriteria).length === 0) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Filter criteria cannot be empty');
            return;
        }
        const conditions = [];
        for (const key in filterCriteria) {
            if (filterCriteria.hasOwnProperty(key)) {
                const value = filterCriteria[key];
                conditions.push(`${key} = ${db.escape(value)}`);
            }
        }
        const whereClause = conditions.join(' AND ');
        const query = `SELECT * FROM BookListing WHERE ${whereClause}`;

        db.query(query, (err, results) => {
            if (err) {
                console.error('Database error: ' + err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            } else {
                if (results.length > 0) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('No books found with the specified criteria');
                }
            }
        });
    } catch (error) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid JSON request');
    }
}

// Function to handle default GET requests
function handleDefaultGet(db, req, res) {
    fs.readFile('login.html', (err, data) => {
        // ... [default GET logic]
        fs.readFile('login.html', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    });
}

// Function to check password strength (if needed)
function isStrongPassword(password) {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[a-zA-Z0-9]).{8,}$/;
    return regex.test(password);
}

// Function to send SMS notification
function sendSMSNotification(phoneNumber, message) {
    twilioClient.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: phoneNumber,
    });
}


module.exports ={
    handleLogin,
    handleRegister,
    handleUpdateCustomer,
    handleGetAllCustomers,
    handleGetCustomer,
    handleGetBooks,
    handleDefaultGet
}
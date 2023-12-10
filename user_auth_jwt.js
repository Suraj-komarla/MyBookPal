const http = require('http');
const mysql = require('mysql2');
const url = require('url');
const fs = require('fs');
const jwt = require('jsonwebtoken');


// Create a MySQL database connection
// const db = mysql.createConnection({
//    // ... [database configuration]
//    host: 'localhost',
//    user: 'admin',
//    password: 'password',
//    database: 'mybookpal',
// });

let user_id = 0;

// Connect to the database
db.connect((err) => {
   if (err) {
       console.error('MySQL Connection Error: ' + err.stack);
       return;
   }
   console.log('Connected to MySQL database');
});


// JWT Secret Key
const JWT_SECRET_KEY = 'TRaKtr75iER4atLU'; // Replace with your actual secret key


// Function to verify JWT Token
// function verifyToken(req, res, next) {
//    const bearerHeader = req.headers['authorization'];
//    console.log('token :', bearerHeader)
//    if (typeof bearerHeader !== 'undefined') {
//        const token = bearerHeader.split(' ')[1];
//        jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
//            if (err) {
//                console.log("Error :", err);
//                res.writeHead(403);
//                res.end('Invalid or expired token');
//                return;
//            }
//         //    const check_decoded = jwt.decode(token);
//             console.log("Decode token :", decoded);
//             const userID = getUserIDFromDatabase(decoded.emailid);
//             console.log("Global variable user_id:", userID);

//           req.emailid = decoded.emailid;
//            next(req, res);
//        });
//    } else {
//        res.writeHead(401);
//        res.end('Unauthorized');
//    }
// }

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
            req.emailid = decoded.emailid;
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




function next(req, res) {
    // Example protected endpoint logic
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Access granted', user: req.user }));
 }
 
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


 // Create an HTTP server
//  const server = http.createServer((req, res) => {
//  const reqUrl = url.parse(req.url, true);
//  const { pathname } = reqUrl;
 
 
//     console.log('Pathname:', pathname);
//     console.log('Method:',req.method);

//     switch (true) {
//         case (pathname === '/login' && req.method === 'POST'):
//             console.log('Inside login POST');
//             handleLogin(req, res);
//             break;
    
//         case ((pathname === '/login' || pathname === '/') && req.method === 'GET'):
//             console.log('Inside login GET');
//             serveFile('login.html', 'text/html', res);
//             break;

//         case ((pathname === '/register') && req.method === 'GET'):
//             console.log('Inside register GET');
//             serveFile('createacc.html', 'text/html', res);
//             break;

//         case (pathname === '/register' && req.method === 'POST'):
//             console.log('Inside register');
//             handleRegister(req, res);
//             break;
    
//         case (req.method === 'PUT' && pathname.startsWith('/customers/')):
//             verifyToken(req, res, () => handleUpdateCustomer(req, res, pathname));
//             break;
    
//         case (req.method === 'GET' && pathname === '/customers'):
//             console.log('/customers true');
//             verifyToken(req, res, () => handleGetAllCustomers(req, res));
//             break;
    
//         case (req.method === 'GET' && pathname.startsWith('/customers/')):
//             console.log("Pathname before verifyToken:", pathname);
//             verifyToken(req, res, () => {
//                 console.log("Inside verifyToken. Pathname:", pathname);
//                 handleGetCustomer(req, res, pathname);
//             });
//             break;
    
//         case (req.method === 'GET' && pathname.startsWith('/get-books/')):
//             verifyToken(req, res, () => handleGetBooks(req, res, pathname));
//             break;
    
//         default:
//             // Handle other cases or invalid requests
//             res.writeHead(404);
//             res.end('Not Found');
//     }
//     // if ( (pathname === '/login') && req.method === 'POST') {
//     //     console.log('Inside login POST');
//     //     handleLogin(req, res);
//     // } else if ( (pathname === '/login' || pathname === '/' ) && req.method === 'GET') {
//     //     console.log('Inside login GET');
//     //     // console.log('res:', res);
//     //     serveFile('login.html', 'text/html', res);
//     // } else if (pathname === '/register' && req.method === 'POST') {
//     //     console.log('Inside register');
//     //     handleRegister(req, res);
//     // } else if (req.method === 'PUT' && pathname.startsWith('/customers/')) {
//     //     verifyToken(req, res, () => handleUpdateCustomer(req, res, pathname));
//     // } else if (req.method === 'GET' && pathname === '/customers') {
//     //     console.log('/customers true');
//     //     verifyToken(req, res, () => handleGetAllCustomers(req, res));
//     // } else if (req.method === 'GET' && pathname.startsWith('/customers/')) {
//     //     console.log("Pathname before verifyToken:", pathname);
//     //     verifyToken(req, res, () => {
//     //         console.log("Inside verifyToken. Pathname:", pathname);
//     //         handleGetCustomer(req, res, pathname);
//     //     });
//     // } else if (req.method === 'GET' && pathname.startsWith('/get-books/')) {
//     //     verifyToken(req, res, () => handleGetBooks(req, res, pathname));}
//     // // } else {
//     //     handleDefaultGet(req, res);
//     // }
//  });
 

 function handleLogin(req, res) {
    let body = '';
 
 
    req.on('data', chunk => {
        body += chunk.toString();
    });
 
 
    req.on('end', () => {
        const { emailid, password } = JSON.parse(body);
        
        console.log(emailid, password);
        const query = 'SELECT * FROM CUSTOMER WHERE Email = ? AND UserPassword = ?';
        db.query(query, [emailid, password], (err, results) => {
            if (err || results.length === 0) {
                console.log("Error",err);
                res.writeHead(401);
                res.end('Login failed');
                return;
            }
            // console.log("CHECK::",err);
            const token = jwt.sign({ emailid }, JWT_SECRET_KEY, { expiresIn: '24h' });
            console.log("token :", token);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ token }));
        });
    });
 }

 function parseUrlEncodedData(data) {
    var pairs = data.split('&');
    var result = {};
    pairs.forEach(function(pair) {
        pair = pair.split('=');
        result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    });
    return JSON.stringify(result, null, 2);
}

 function handleRegister(req, res) {
    // ... [registration logic]
    let data = '';
    req.on('data', (chunk) => {
        data += chunk;
    });
    // console.log('entries :', req, res);
 
    req.on('end', () => {
        console.log("CHECK::",data);
        const formData = parseUrlEncodedData(data);
        // const formData = JSON.parse(data);
        console.log("Data :",formData);
        // const username = formData.userid;
        const password = formData.password;
        const firstName = formData.first_name;
        const lastName = formData.last_name;
        const usertype = formData.user_type;
        const email = formData.email;
        const address = formData.address;
        const phone = formData.phone;
 
        console.log("phone datatype: ",phone);
        // Validate phone number length
        // const maxPhoneLength = 20; // This should match the length defined in your DB
        // if (phone.length > maxPhoneLength) {
        //     res.writeHead(400, { 'Content-Type': 'text/plain' });
        //     res.end('Phone number is too long');
        //     return;
        // }
 
 
        // Check if the username already exists in the database
        const usernameCheckQuery = 'SELECT UserID FROM CUSTOMER WHERE UserID = ?';
        db.query(usernameCheckQuery, [email], (err, results) => {
            if (err) {
                console.log("Error checking username", err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Registration Failed');
            } else if (results.length > 0) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('User already exists');
            } else {
                // Insert the new user into the database
                const insertQuery = 'INSERT INTO CUSTOMER (FirstName, LastName, PhoneNumber, Email, UserAddress, UserPassword, UserType) VALUES (?, ?, ?, ?, ?, ?, ?)';
                console.log("check query :", insertQuery);
                db.query(insertQuery, [firstName, lastName, phone, email, address, password, usertype], (err) => {
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
 
function getUserIDFromDatabase(userIdentifier) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT UserID FROM Customer WHERE Email = ?'; // Adjust the SQL query based on your schema

        db.query(query, [userIdentifier], (error, results) => {
            if (error) {
                reject(error);
            } else if (results.length > 0) {
                const userID = results[0].UserID; // Adjust according to your result structure
                user_id = userID;
                console.log("User ID::", userID);
                resolve(userID);
            } else {
                reject(new Error('User not found'));
            }
        });
    });
}


 // Function to handle updating a customer
 function handleUpdateCustomer(req, res, pathname) {
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
 function handleGetAllCustomers(req, res) {
    // ... [get all customers logic]
    db.query('SELECT UserID, FirstName, LastName, PhoneNumber, Email, UserAddress, UserType FROM CUSTOMER', (err, rows) => {
        if (err) {
            console.log("Error:",err);
            res.statusCode = 500;
            res.end('Internal Server Error');
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(rows));
        }
    });
 }
 
 
 // Function to handle getting a specific customer
 function handleGetCustomer(req, res, pathname) {
    // ... [get specific customer logic]
    console.log("Print all:",res);
    console.log("username check:", pathname);
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
 function handleGetBooks(req, res, pathname) {
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
    getUserIDFromDatabase,
    verifyToken
    // handleDefaultGet
 }
 
//  // Start the server
//  const port = 3000;
//  server.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
//  });
 

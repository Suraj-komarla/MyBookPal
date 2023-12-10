// const http = require('http');
// const fs = require('fs');
// const path = require('path');
// const querystring = require('querystring');
// const mysql = require('mysql');

// const port = 3000;

// // Database connection setup
// const connection = mysql.createConnection({
//     multipleStatements: true,
//     host: 'localhost',
//     user: 'root',
//     password: 'sasumithu',
//     database: 'mybook',
//   });
  

// connection.connect(err => {
//   if (err) {
//     console.error('Error connecting to the database: ' + err.stack);
//     return;
//   }
//   console.log('Connected to the database');
// });

// const server = http.createServer((req, res) => {
//   // Serve static files
//   if (req.method === 'GET' && (req.url === '/' || req.url.match('\.html$') || req.url.match('\.js$'))) {
//     const filePath = req.url === '/' ? '/index.html' : req.url;
//     const fullPath = `./public${filePath}`;
//     console.log('Trying to serve:', fullPath); // Log the file path being accessed

//     const extname = String(path.extname(filePath)).toLowerCase();
//     const mimeTypes = {
//       '.html': 'text/html',
//       '.js': 'text/javascript',
//     };

//     const contentType = mimeTypes[extname] || 'application/octet-stream';

//     fs.readFile(fullPath, (error, content) => {
//       if (error) {
//         console.error('Error serving file:', error); // Log any file serving error
//         if (error.code == 'ENOENT') {
//           res.writeHead(404, { 'Content-Type': 'text/html' });
//           res.end('404 Not Found');
//         } else {
//           res.writeHead(500);
//           res.end('Internal Server Error: ' + error.code);
//         }
//       } else {
//         res.writeHead(200, { 'Content-Type': contentType });
//         res.end(content, 'utf-8');
//       }
//     });
//  }
//   else if (req.method === 'POST' && req.url === '/queries') {
//     // Handle POST request to '/queries'
//     let body = '';
//     req.on('data', chunk => {
//       body += chunk.toString();
//     });
//     req.on('end', () => {
//       const formData = querystring.parse(body);
//       const insertQuerySql = `INSERT INTO queries (userid, question) VALUES (${formData.userId}, "${formData.question}");`;
  
//       // First, insert into 'queries'
//       connection.query(insertQuerySql, (err, result) => {
//         if (err) {
//           res.writeHead(500, { 'Content-Type': 'text/plain' });
//           res.end('Error inserting data into the queries table');
//           console.error('Error inserting data into the queries table: ' + err);
//         } else {
//           // Get the last insert id
//           const lastId = result.insertId;
//           const insertHistorySql = `INSERT INTO query_history (query_id, userid, question, status) VALUES (${lastId}, ${formData.userId}, "${formData.question}", "In Progress");`;
  
//           // Then, insert into 'query_history'
//           connection.query(insertHistorySql, (err, result) => {
//             if (err) {
//               res.writeHead(500, { 'Content-Type': 'text/plain' });
//               res.end('Error inserting data into the query_history table');
//               console.error('Error inserting data into the query_history table: ' + err);
//             } else {
//               res.writeHead(200, { 'Content-Type': 'text/plain' });
//               res.end('Query submitted successfully');
//             }
//           });
//         }
//       });
//     });
//   }
//   else if (req.method === 'GET' && req.url === '/queries') {
//     // Handle GET request to '/queries'
//     const sql = 'SELECT * FROM queries';
//     connection.query(sql, (err, results) => {
//         console.log(results);
//       if (err) {
//         res.writeHead(500, { 'Content-Type': 'text/plain' });
//         res.end('Error fetching data from the database');
//         console.error('Error fetching data from the database: ' + err);
//       } else {
//         res.writeHead(200, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify(results));
//       }
//     });
//   }else if (req.method === 'GET' && req.url === '/notifications') {
//     let body = '';
//     req.on('data', (chunk) => {
//       body += chunk;
//     });

//     req.on('end', () => {
     
//       const sql = 'select * from notifications';
//       connection.query(sql, (err, result) => {
//         if (err) {
//           res.writeHead(500, { 'Content-Type': 'text/plain' });
//           res.end('Error fetching data from the database');
//           console.error('Error fetching data from the database: ' + err);
//         } else {
//           res.writeHead(200, { 'Content-Type': 'application/json' });
//           res.end(JSON.stringify(result));
//         }
//       });
//     });
//   }
//   else if (req.method === 'POST' && req.url === '/notifications') {
//     let body = '';
//     req.on('data', (chunk) => {
//       body += chunk;
//     });

//     req.on('end', () => {
//       const formData = querystring.parse(body);
//       const userId = formData.userId; 
//       const question = formData.question;
//       const answer = formData.answer;
//       const query_id = formData.query_id;
//       console.log(userId);
//       console.log(question);
//       if (!userId || !question) {
//         res.writeHead(400, { 'Content-Type': 'text/plain' });
//         res.end('Missing parameters');
//         return;
//       }

//       const faqData = {
//         id: userId,
//         question: question,
//       };

//       const sql = `
//   INSERT INTO notifications (userid, question, answer) VALUES (${userId}, "${question}", "${answer}");
//   update query_history set answer="${answer}",status="Resolved" where query_id=${query_id};
//   DELETE FROM queries WHERE query_id=${query_id}; insert into wait_approval(question, answer) values ("${question}","${answer}");
// `;
// console.log(sql);
// connection.query(sql, (err, result) => {
//         if (err) {
//           res.writeHead(500, { 'Content-Type': 'text/plain' });
//           res.end('Error inserting data into the database');
//           console.error('Error inserting data into the database: ' + err);
//         } else {
//           res.writeHead(200, { 'Content-Type': 'text/plain' });
//           res.end('Data inserted and delted from query successfully into notifications');
//         }
//       });
//     });
//   } // Example endpoint in your Node.js server
//   // ...
  
//   else if (req.method === 'DELETE' && req.url === '/delete-notifications') {
//     let body = '';
//     req.on('data', chunk => {
//       body += chunk.toString();
//     });
//     req.on('end', () => {
//       const formData = querystring.parse(body);
//           const notificationIds = formData.n_id;
//           console.log(notificationIds);
//           // Construct SQL query to delete notifications
//           const sql = `DELETE FROM notifications WHERE n_id IN (${notificationIds})`;
//           connection.query(sql, (err, result) => {
//               if (err) {
//                   res.writeHead(500, { 'Content-Type': 'text/plain' });
//                   res.end('Error deleting data from the database');
//                   console.error('Error deleting data from the database: ' + err);
//               } else {
//                   res.writeHead(200, { 'Content-Type': 'text/plain' });
//                   res.end('Notifications deleted successfully');
//               }
//           });
//       });
//   }else if (req.method === 'GET' && req.url === '/view_history') {
//     // Handle GET request to '/queries'
//     const sql = 'SELECT * FROM query_history';
//     connection.query(sql, (err, results) => {
//         console.log(results);
//       if (err) {
//         res.writeHead(500, { 'Content-Type': 'text/plain' });
//         res.end('Error fetching data from the database');
//         console.error('Error fetching data from the database: ' + err);
//       } else {
//         res.writeHead(200, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify(results));
//       }
//     });
//   }
//   else if (req.method === 'GET' && req.url === '/customer_details') {
//     // Handle GET request to '/queries'
//     const sql = 'SELECT * FROM customer';
//     connection.query(sql, (err, results) => {
//         console.log(results);
//       if (err) {
//         res.writeHead(500, { 'Content-Type': 'text/plain' });
//         res.end('Error fetching data from the database');
//         console.error('Error fetching data from the database: ' + err);
//       } else {
//         res.writeHead(200, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify(results));
//       }
//     });
//   }
//   // ... [existing code]

// else if (req.method === 'POST' && req.url === '/update_customer') {
//   let body = '';
//   req.on('data', chunk => {
//       body += chunk.toString();
//   });
//   req.on('end', () => {
//       const formData = JSON.parse(body);
//       const userId = formData.userId;
//       const updates = [];
//       console.log(userId);
//       // Constructing dynamic query based on provided fields
//       for (const key in formData) {
//           if (formData.hasOwnProperty(key) && key !== 'userId') {
//               updates.push(`${key} = ${mysql.escape(formData[key])}`);
//           }
//       }

//       if (updates.length > 0) {
//           const sql = `UPDATE users SET ${updates.join(', ')} WHERE UserID = ${mysql.escape(userId)}`;
//           connection.query(sql, (err, result) => {
//               if (err) {
//                   res.writeHead(500, { 'Content-Type': 'text/plain' });
//                   res.end('Error updating data in the database');
//                   console.error('Error updating data in the database: ' + err);
//               } else {
//                   res.writeHead(200, { 'Content-Type': 'text/plain' });
//                   res.end('User updated successfully');
//               }
//           });
//       } else {
//           res.writeHead(400, { 'Content-Type': 'text/plain' });
//           res.end('No data provided for update');
//       }
//   });
// }
// else if (req.method === 'GET' && req.url === '/get_user_details') {
//   let body = '';
//   req.on('data', chunk => {
//       body += chunk.toString();
//   });
//   req.on('end', () => {
//       const formData = querystring.parse(body);
//       const userId = formData.userId;
//       const sql = `SELECT * FROM customer WHERE UserID = ${userId}`;
//       console.log(sql);
//       connection.query(sql, (err, results) => {
//         console.log(results);
//           if (err) {
//               res.writeHead(500, { 'Content-Type': 'text/plain' });
//               res.end('Error fetching user details from the database');
//           } else {
//               res.writeHead(200, { 'Content-Type': 'application/json' });
//               res.end(JSON.stringify(results[0]));
//           }
//       });
//   });
// }
// else if (req.method === 'PATCH' && req.url === '/update_user_details') {
//   let body = '';
//   req.on('data', chunk => {
//       body += chunk.toString();
//   });
//   req.on('end', () => {
//       const formData = querystring.parse(body);
//       const userId = formData.userId;
//       // Construct the SQL query based on which fields are provided
//       let sql = 'UPDATE customer SET ';
//       const updateFields = [];
//       if (formData.firstName) {
//           updateFields.push(`FirstName = '${formData.firstName}'`);
//       }
//       if (formData.lastName) {
//           updateFields.push(`LastName = '${formData.lastName}'`);
//       }
//       if (formData.phoneNumber) {
//         updateFields.push(`PhoneNumber = ${formData.phoneNumber}`);
//     }
//     if (formData.email) {
//       updateFields.push(`Email = '${formData.email}'`);
//   }
//   if (formData.userAddress) {
//     updateFields.push(`UserAddress = '${formData.userAddress}'`);
// }

      
//       sql += updateFields.join(', ');
//       sql += ` WHERE UserID = ${userId};`;
//       console.log(sql);
//       connection.query(sql, (err, result) => {
//         console.log(result.length);
//         console.log(err);
//           if (err) {
//               res.writeHead(500, { 'Content-Type': 'text/plain' });
//               res.end('Error updating user details in the database');
//           } else {
//               res.writeHead(200, { 'Content-Type': 'text/plain' });
//               res.end('User details updated successfully');
//           }
//       });
//   });
// }

// // ... [existing code]

//   // ...
//   else {
//     // Handle 404 Not Found
//     res.writeHead(404, { 'Content-Type': 'text/plain' });
//     res.end('Not Found');
//   }
// });

// server.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

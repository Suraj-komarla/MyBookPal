// const fs = require('fs');
// const path = require('path');
// const querystring = require('querystring');
// const mysql = require('mysql');

// // Database connection setup
// // const connection = mysql.createConnection({
// //     multipleStatements: true,
// //     host: 'localhost',
// //     user: 'root',
// //     password: 'password',
// //     database: 'libraryManagement',
// // });

// const connection = mysql.createConnection({
//   multipleStatements: true,
//   host: 'localhost',
//   user: 'root',
//   password: 'root',
//   database: 'project',
// });

// connection.connect(err => {
//     if (err) {
//         console.error('Error connecting to the database: ' + err.stack);
//         return;
//     }
//     console.log('Connected to the database');
// });

// // Function to serve index.html
// exports.serveIndex = (req, res) => {

//     const indexPath = path.join(__dirname, 'public', 'index.html');
//     serveFile(res, indexPath, 'text/html');
// };
// exports.serveStaticFiles = (req, res, filePath) => {
//     const fullPath = path.join(__dirname, 'public', filePath);
//     const extname = String(path.extname(filePath)).toLowerCase();
//     const mimeTypes = {
//         '.html': 'text/html',
//         '.css': 'text/css',
//         '.js': 'text/javascript',
//         // Add other mime types as needed
//     };
//     const contentType = mimeTypes[extname] || 'application/octet-stream';
//     serveFile(res, fullPath, contentType);
// };
// function serveFile(res, filePath, contentType) {
//     fs.readFile(filePath, (error, content) => {
//         if (error) {
//             if (error.code == 'ENOENT') {
//                 res.writeHead(404, { 'Content-Type': 'text/html' });
//                 res.end('404 Not Found');
//             } else {
//                 res.writeHead(500);
//                 res.end('Internal Server Error: ' + error.code);
//             }
//         } else {
//             res.writeHead(200, { 'Content-Type': contentType });
//             res.end(content, 'utf-8');
//         }
//     });
// }
// exports.postQueries = (req,res)=>{
//     res.setHeader('Content-Type', 'application/x-www-form-urlencoded');
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//      // Handle POST request to '/queries'
//      let body = '';
//      req.on('data', chunk => {
//        body += chunk.toString();
//      });
//      req.on('end', () => {
//        const formData = querystring.parse(body);
//        const insertQuerySql = `INSERT INTO queries (userid, question) VALUES (${formData.userId}, "${formData.question}");`;
//         console.log(insertQuerySql);
//        // First, insert into 'queries'
//        connection.query(insertQuerySql, (err, result) => {
//          if (err) {
//            res.writeHead(500, { 'Content-Type': 'text/plain' });
//            res.end('Error inserting data into the queries table');
//            console.error('Error inserting data into the queries table: ' + err);
//          } else {
//            // Get the last insert id
//            const lastId = result.insertId;
//            const insertHistorySql = `INSERT INTO query_history (query_id, userid, question, status) VALUES (${lastId}, ${formData.userId}, "${formData.question}", "In Progress");`;
   
//            // Then, insert into 'query_history'
//            connection.query(insertHistorySql, (err, result) => {
//              if (err) {
//                res.writeHead(500, { 'Content-Type': 'text/plain' });
//                res.end('Error inserting data into the query_history table');
//                console.error('Error inserting data into the query_history table: ' + err);
//              } else {
//                res.writeHead(200, { 'Content-Type': 'text/plain' });
//                res.end('Query submitted successfully');
//              }
//            });
//          }
//        });
//      });
// };
// exports.getNotifications = (req, res) => {
//   res.setHeader('Content-Type', 'application/text-plain');
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//     const sql = 'SELECT * FROM notifications';
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
// }
// // Function to view history
// exports.getViewHistory = (req, res) => {
//   res.setHeader('Content-Type', 'application/x-www-form-urlencoded');
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
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
// };
// exports.updatefeedback = (req, res) => {
//   res.setHeader('Content-Type', 'application/json');
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//     let body = '';

//   req.on('data', (chunk) => {
//     body += chunk.toString();
//   });

//   req.on('end', () => {
//     const feedbackData = JSON.parse(body);

//     const queryId = feedbackData.query_ids;
//     const userId = feedbackData.userId;
//     const servRating = feedbackData.servRating;
//     const timeRating = feedbackData.timeRating;
//     const solved = feedbackData.solved;
//     const comment = feedbackData.comment;
//     console.log(queryId);
//     var sql = `INSERT INTO feedback (UserId, serv_rating, time_rating, solved, comment, query_id) VALUES (${feedbackData.userId}, ${feedbackData.servRating}, ${feedbackData.timeRating}, "${feedbackData.solved}", "${feedbackData.comment}", ${feedbackData.query_ids});`;
//     console.log(sql);
//     connection.query(sql, (err, result) => {
//       if (err) {
//         console.error('Error inserting feedback into the database:', err.message);
//         res.writeHead(500, { 'Content-Type': 'text/plain' });
//         res.end('Error submitting feedback');
//       } else {
//         console.log('Feedback submitted successfully');
//         res.writeHead(200, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify({ message: 'Feedback submitted successfully' }));
//       }
//     });
//   });
// };
// exports.deleteNotifications = (req, res) => {
//   res.setHeader('Content-Type', 'application/x-www-form-urlencoded');
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//     let body = '';
//     req.on('data', chunk => {
//       body += chunk.toString();
//     });
//     req.on('end', () => {
//       const formData = querystring.parse(body);
//       const notificationIds = formData.n_id.split(',');
//       console.log(notificationIds); // Make sure to split the IDs
//       const sql = `DELETE FROM notifications WHERE n_id IN (${notificationIds.join(',')});`;
//       connection.query(sql, (err, result) => {
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
//       // Implementation for deleting notifications
//     // Similar to your original DELETE '/delete-notifications' logic
// };

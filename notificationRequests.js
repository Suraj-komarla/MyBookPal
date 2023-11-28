const http = require('http');
const url = require('url');
const mysql = require('mysql2');
const querystring = require('querystring');
const nodemailer = require('nodemailer');
const request = require('request');

const transporter = nodemailer.createTransport({
    service: 'Gmail', 
    auth: {
      user: 'kasuraj98@gmail.com', 
      pass: 'kpfo zlbj mmzz rrtf', 
    },
  });

// Function to send an email notification
function sendBookAvailableEmail(userEmail, bookTitle) {
    const mailOptions = {
      from: 'kasuraj98@gmail.com',
      to: userEmail,
      subject: 'Book Available fors Purchase',
      text: `The book "${bookTitle}" that you reserved is now available for purchase. Get it now!`
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email: ' + error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
}

// Function to send an SMS notification
function sendSMSNotification(to, Title) {
    request.post('https://textbelt.com/text', {
        form: {
            phone: to,
            message: 'The book ' + Title + ' that you reserved is now available for purchase. Get it now!',
            key: 'textbelt',
        },
    }, (err, httpResponse, body) => {
        if(err) {
            console.log(err);
        }
        else{
            console.log(JSON.parse(body));
        }
    });
}

// Function to check and send email notifications for available books
function checkReservedBooks(db) {
    // Query the database to check for reserved books that are now available
    db.query(
    'SELECT n.RequestID, n.UserID, n.BookID, b.Title, u.Email, u.PhoneNumber, np.EmailNotifications, np.SMSNotifications ' +
    'FROM NotificationRequests n ' +
    'JOIN BookListing b ON n.BookID = b.BookID ' +
    'JOIN CUSTOMER u ON n.UserID = u.UserID ' +
    'JOIN NotificationPreferences np ON n.UserID = np.UserID ' + // Join with NotificationPreferences
    'WHERE b.Quantity > 0 ',
      (err, results) => {
        if (err) {
          console.error('Error querying the database: ' + err);
          return;
        }
  
        if (results.length > 0) {
          const { RequestID, UserID, BookID, Title, Email, PhoneNumber, EmailNotifications, SMSNotifications } = results[0];

          if (EmailNotifications) {
            // Send an email notification to the user
            sendBookAvailableEmail(Email, Title);
          }

          if (SMSNotifications) {
            sendSMSNotification(PhoneNumber, Title)
          }
  
          // Remove the reservation entry from the database
          db.query('DELETE FROM NotificationRequests WHERE RequestID = ?', [RequestID], (err) => {
            if (err) {
              console.error('Error deleting the reservation: ' + err);
            }
          });
        }
      }
    );
  }

  function newSubscription(db, req, res, Title, Book_condition) {
  const checkQuery = 'SELECT * FROM BookListing WHERE Title = ? AND Book_condition = ?';
    db.query(checkQuery, [Title, Book_condition], (checkErr, checkResults) => {
    if (checkErr) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database error' }));
    } else {
        if (checkResults.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Book not found' }));
        }
        else if(checkResults[0].Quantity > 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Book is available for purchase or lending' }));
        } else {
        // Insert a new subscription record (replace with your actual logic)
        const authenticatedUserId = 1;
        const subscriptionData = {
            UserID: authenticatedUserId, // Replace with the actual user ID
            BookID: checkResults[0].BookID,
        };

        // Insert a new subscription record
        const insertQuery = 'INSERT INTO NotificationRequests (UserID, BookID, RequestDate) VALUES (?, ?, NOW())';
        db.query(insertQuery, [subscriptionData.UserID, subscriptionData.BookID], (insertErr, insertResults) => {
            if (insertErr) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Subscription failed' }));
            } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Subscription successful. We will notify you when the books is available for purchase/lending' }));
            }
        });
        }
    }
  });
}

function cancelSubscription(db, req, res, Title, Book_condition){
  const authenticatedUserId = 1;
  // Check if the book exists and the user has a subscription
  const checkQuery = 'SELECT * FROM BookListing WHERE Title = ? AND Book_condition = ?';
  db.query(checkQuery, [Title, Book_condition], (checkErr, checkResults) => {
  if (checkErr) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Database error' }));
  } else {
      if (checkResults.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Book not found' }));
      } else {
          const subcribeCheckQuery = 'SELECT * FROM NotificationRequests WHERE BookID = ? AND UserID = ?';
          db.query(subcribeCheckQuery, [checkResults[0].BookID, authenticatedUserId], (subscribeCheckErr, subscribeCheckResults) => {
              if (subscribeCheckErr) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Database error' }));
              } else {
                  if (subscribeCheckResults.length === 0) {
                      res.writeHead(400, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({ error: 'No active subscription on this book' }));
                  }
                  else {
                      // Delete the subscription record
                      const deleteQuery = 'DELETE FROM NotificationRequests WHERE BookID = ? AND UserID = ?';
                      db.query(deleteQuery, [checkResults[0].BookID, authenticatedUserId], (deleteErr, deleteResults) => {
                          if (deleteErr) {
                              res.writeHead(500, { 'Content-Type': 'application/json' });
                              res.end(JSON.stringify({ error: 'Unsubscription failed' }));
                          } else {
                              res.writeHead(200, { 'Content-Type': 'application/json' });
                              res.end(JSON.stringify({ message: 'Unsubscription successful' }));
                          }
                      });
                  }
              }
          });
      }
  }
  });
}

function getSubscriptions(db, req, res){
  const authenticatedUserId = 1
  // Retrieve the user's current subscriptions
  const selectQuery = 'SELECT N.RequestID, B.Title, B.Book_condition FROM NotificationRequests N JOIN BookListing B ON N.BookID = B.BookID WHERE N.UserID = ?';
  db.query(selectQuery, [authenticatedUserId], (selectErr, selectResults) => {
  if (selectErr) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Database error' }));
  } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(selectResults));
  }
  });
}

function getNotificationPreferences(db, req, res){
  // Extract the user ID from the URL or from a token
  const authenticatedUserId = 1; // Replace with the actual user's ID
    
  // Query the database to retrieve the user's notification preferences
  db.query(
    'SELECT n.*, c.Email, c.PhoneNumber FROM NotificationPreferences n INNER JOIN CUSTOMER c ON C.UserId = n.UserID WHERE c.UserID = ?',
    [authenticatedUserId],
    (err, results) => {
      if (err) {
        console.error('Error querying the database: ' + err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
        return;
      }

      if (results.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Notification preferences not found for the user' }));
        return;
      }

      const notificationPreferences = results[0]; // Assuming a single row for the user

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(notificationPreferences));
    }
  );
}

function updateNotificationPreferences(db, req, res){
  let data = '';
    
  req.on('data', (chunk) => {
    data += chunk;
  })

  req.on('end', () => {
      try {
        const requestBody = JSON.parse(data);
        const authenticatedUserId = 1;
        const query = `UPDATE NotificationPreferences SET EmailNotifications = ?, SMSNotifications = ? WHERE UserID = ?`;
        db.query(query, [requestBody.EmailNotifications, requestBody.SMSNotifications, authenticatedUserId], (err, result) => {
              if (err) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Internal Server Error' }));
              } else {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ message: 'Notification preferences updated successfully' }));
              }
          });
      }
      catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request data' }));
      }
  });
}

module.exports = {
  checkReservedBooks,
  newSubscription,
  cancelSubscription,
  getSubscriptions,
  getNotificationPreferences,
  updateNotificationPreferences
};
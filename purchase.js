const http = require('http');
const mysql = require('mysql2');
const port = 3000;
const moment = require('moment');
const stripe = require('stripe')('sk_test_51OHGwhI1Ek63lRaqSVzjrAYXeY7BqNxhGi2VOooMUQ12vFYPCAzaNBpt2ji4xSSR6IL0Y5gYptiTZSP5BLlcUwIV009r1hXMfX');
const success = "http://localhost:3000/success.html"
// const cancel = "https://buy.stripe.com/test_aEU9Bg95L9Ot5c4bIK"


//Function to update the products in the cart - called when user wants to add/delete the products in cart or when the user checksout the cart
function updateCart(connection, book_id, user_id, action) {
  console.log(`Updating cart for book_id: ${book_id}, user_id: ${user_id}, action: ${action}`);
  return new Promise((resolve, reject) => {
    if (!book_id || !user_id || !action || (action !== 'add' && action !== 'remove')) {
      console.error('Invalid parameters for updating cart');
      reject({ statusCode: 400, message: 'Invalid parameters' });
      return;
    }

    if (action === 'add') {
      const updateQuery = `
        INSERT INTO Cart (UserID, BookID, Quantity)
        VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE Quantity = Quantity + 1;
      `;

      connection.query(updateQuery, [user_id, book_id], (err) => {
        if (err) {
          console.error('Error updating the cart: ' + err.stack);
          reject({ statusCode: 500, message: 'Error updating the cart' });
          return;
        }

        console.log('Product added to the cart');
        resolve({ statusCode: 200, message: 'Product added to the cart' });
      });
    } else if (action === 'remove') {
      const updateQuantityQuery = `
        UPDATE Cart
        SET Quantity = Quantity - 1
        WHERE UserID = ? AND BookID = ? AND Quantity > 0;
      `;

      const deleteQuery = `
        DELETE FROM Cart
        WHERE UserID = ? AND BookID = ? AND Quantity = 0;
      `;

      connection.query(updateQuantityQuery, [user_id, book_id], (err, result) => {
        if (err) {
          console.error('Error updating the cart: ' + err.stack);
          reject({ statusCode: 500, message: 'Error updating the cart' });
          return;
        }

        if (result.affectedRows === 0) {
          console.log('Product not in the cart');
          reject({ statusCode: 400, message: 'Product not in the cart' });
          return;
        }

        console.log('Product removed from the cart');
        resolve({ statusCode: 200, message: 'Product removed from the cart' });

        connection.query(deleteQuery, [user_id, book_id], (err) => {
          if (err) {
            console.error('Error deleting from the cart: ' + err.stack);
          }
        });
      });
    }
  });
}

//Function to update the wallet value of the user - called when the user adds the amount or makes a purchase
const userWallets = {}
function updateWallet(connection, user_id, amount, action) {
  console.log(`Updating wallet for user_id: ${user_id}, amount: ${amount}, action: ${action}`);
  return new Promise((resolve, reject) => {
    if (!user_id || !amount || !action || (action !== 'add' && action !== 'sub')) {
      console.error('Invalid parameters for updating wallet');
      reject({ statusCode: 400, message: 'Invalid parameters' });
      return;
    }

    // Fetch the current wallet balance from the database
    connection.query('SELECT WalletBalance FROM Wallet WHERE UserID = ?', [user_id], (err, results) => {
      if (err) {
        console.error('Error fetching wallet balance: ' + err.stack);
        reject({ statusCode: 500, message: 'Error fetching wallet balance' });
        return;
      }

      if (results.length === 0) {
        console.log('User wallet not found');
        reject({ statusCode: 404, message: 'User wallet not found' });
        return;
      }

      let currentBalance = results[0].WalletBalance;
      userWallets[user_id] = currentBalance; 

      if (action === 'add') {
        userWallets[user_id] += amount;
      } else if (action === 'sub') {
        if (amount > userWallets[user_id]) {
          console.log('Insufficient wallet balance, please add balance to the wallet');
          reject({ statusCode: 400, message: 'Insufficient wallet balance, please add balance to the wallet' });
          return;
        }
        userWallets[user_id] -= amount;
      }

      // Update the wallet balance in the database
      connection.query(
        'UPDATE Wallet SET WalletBalance = ? WHERE UserID = ?',
        [userWallets[user_id], user_id],
        (err, result) => {
          if (err) {
            console.error('Error updating wallet: ' + err.stack);
            reject({ statusCode: 500, message: 'Internal Server Error' });
            return;
          }

          if (result.affectedRows === 0) {
            console.log('User wallet not found');
            reject({ statusCode: 404, message: 'User wallet not found' });
            return;
          }

          console.log('Wallet updated successfully');
          resolve({ statusCode: 200, message: 'Updated wallet for user' });
        }
      );
    });
  });
}

//Function to update the book quantity in the inventory table to reduce the quantity after the user's purchase is successful.  
function updateBookQuantity(connection, bookId, quantity) {
  console.log(`Updating book quantity for bookId: ${bookId}, quantity: ${quantity}`);
  return new Promise((resolve, reject) => {
    if (!bookId || !quantity || isNaN(quantity)) {
      console.error('Invalid parameters for updating book quantity');
      reject({ statusCode: 400, message: 'Invalid parameters' });
      return;
    }

    const updateQuery = `
      UPDATE BookListing
      SET Quantity = Quantity - ?
      WHERE BookID = ? AND Quantity >= ?;
    `;

    connection.query(updateQuery, [quantity, bookId, quantity], (err, result) => {
      if (err) {
        console.error('Error updating book quantity: ' + err.stack);
        reject({ statusCode: 500, message: 'Internal Server Error' });
        return;
      }

      if (result.affectedRows === 1) {
        console.log('Book quantity updated successfully');
        resolve({ statusCode: 200, message: 'Book quantity updated' });
      } else {
        console.log('Failed to update book quantity');
        reject({ statusCode: 400, message: 'Failed to update book quantity' });
      }
    });
  });
}

//Function is called after the user's purchase is succesful and it is added to their purchase history.
function addToPurchaseHistory(connection, UserID, BookID, Quantity, totalPrice) {
  return new Promise((resolve, reject) => {
    // Get the current time in the format 'YYYY-MM-DD HH:MM:SS'
    const paymentDateTime = moment().format('YYYY-MM-DD HH:mm:ss');

    const insertQuery = `
      INSERT INTO PurchaseHistory (UserID, Amount, PaymentDateTime, BookID, Quantity)
      VALUES (?, ?, ?, ?, ?)
    `;

    connection.query(
      insertQuery,
      [UserID, totalPrice, paymentDateTime, BookID, Quantity],
      (err, result) => {
        if (err) {
          console.error('Error inserting into PurchaseHistory: ' + err.stack);
          reject({ statusCode: 500, message: 'Internal Server Error' });
          return;
        }

        if (result.affectedRows === 1) {
          resolve({ statusCode: 200, message: 'Product added to PurchaseHistory' });
        } else {
          reject({ statusCode: 500, message: 'Failed to add product to PurchaseHistory' });
        }
      }
    );
  });
}

//Function is called once the user qualifies certain checks and to make his purchase successful.
function performPurchase(connection, UserID, BookID, Quantity, totalPrice) {
  console.log(`Performing purchase for UserID: ${UserID}, BookID: ${BookID}, Quantity: ${Quantity}, totalPrice: ${totalPrice}`);
  return new Promise((resolve, reject) => {
    connection.beginTransaction(err => {
      if (err) {
        console.error('Error starting transaction: ' + err.stack);
        reject({ statusCode: 500, message: 'Error starting transaction', error: err });
        return;
      }

      updateCart(connection, BookID, UserID, 'remove')
        .then(cartResult => {
          console.log('Cart update result:', cartResult);
          return updateWallet(connection, UserID, totalPrice, 'sub');
        })
        .then(walletResult => {
          console.log('Wallet update result:', walletResult);
          return updateBookQuantity(connection, BookID, Quantity);
        })
        .then(bookQuantityResult => {
          console.log('Book quantity update result:', bookQuantityResult);
          return addToPurchaseHistory(connection, UserID, BookID, Quantity, totalPrice);
        })
        .then(purchaseHistoryResult => {
          console.log('Purchase history update result:', purchaseHistoryResult);
          connection.commit(err => {
            if (err) {
              connection.rollback(() => reject({ statusCode: 500, message: 'Error committing transaction', error: err }));
            } else {
              console.log('Purchase completed successfully');
              resolve({
                statusCode: 200,
                message: 'Purchase completed successfully',
                // Additional details if needed
              });
            }
          });
        })
        .catch(error => {
          connection.rollback(() => {
            console.error('Error during purchase: ' + error);
            reject({ statusCode: 500, message: 'Error during purchase', error });
          });
        });
    });
  });
}

//Verify if the inventory has sufficient stock that user intends to make a purchase
function checkQuantity(connection, bookId, quantity) {
  return new Promise((resolve, reject) => {
    console.log('Checking quantity for BookID:', bookId, 'Quantity:', quantity);
    const selectQuery = 'SELECT * from BookListing where BookID = ? AND Quantity >= ?';
    connection.query(selectQuery, [bookId, quantity], (err, results) => {
      if (err) {
        console.error('Error querying the database: ' + err.stack);
        reject({ statusCode: 500, message: 'Internal Server Error' });
        return;
      }
      console.log('Check Quantity results:', results);
      const available = results.length > 0;
      resolve({ available });
      if (!available) {
        console.log(`Insufficient quantity for BookID ${bookId}`);
      }
    });
  });
}

//Computes and returns the final purchase value for the products that are being checked out
function computePrice(connection, bookId, quantity) {
  return new Promise((resolve, reject) => {
    console.log('Computing price for BookID:', bookId, 'Quantity:', quantity);

    const selectQuery = 'SELECT Price, Quantity from BookListing where BookID = ? AND Quantity >= ?';

    connection.query(selectQuery, [bookId, quantity], (err, results) => {
      if (err) {
        console.error('Error querying the database: ' + err.stack);
        reject({ statusCode: 500, message: 'Internal Server Error' });
        return;
      }

      console.log('Compute Price results:', results);

      if (results.length > 0) {
        const price = results[0].Price * quantity;
        console.log('Computed Price:', price);
        resolve({ total_price: price });
      } else {
        console.log(`Product not found or insufficient quantity for BookID ${bookId}`);
        reject({ statusCode: 404, message: 'Product not found or insufficient quantity' });
      }
    });
  });
}

//Function to get the user's wallet amount - Used when user intends to make a purchase
function getWalletBalance(connection, userId) {
  return new Promise((resolve, reject) => {
    console.log('Fetching wallet balance for UserID:', userId);
    const selectQuery = 'SELECT WalletBalance FROM wallet WHERE UserID = ?';
    connection.query(selectQuery, [userId], (err, results) => {
      if (err) {
        console.error('Error querying the database: ' + err.stack);
        reject({ statusCode: 500, message: 'Internal Server Error' });
        return;
      }

      console.log('Wallet balance query results:', results);

      if (results[0]) {
        const walletBalance = results[0].WalletBalance;
        console.log('Wallet balance for UserID', userId, ':', walletBalance);
        resolve({ balance: walletBalance });
      } else {
        console.log(`No wallet balance found for user ${userId}`);
        reject({ statusCode: 404, message: `No wallet balance found for user ${userId}` });
      }
    });
  });
}

//Function called when a http request is initiated to checkout from the cart
function purchaseProduct(connection, req, res) {
  console.log('Received a purchase request');
  let requestBody = '';

  req.on('data', (data) => {
    requestBody += data;
  });

  req.on('end', () => {
    let parsedBody;

    try {
      parsedBody = JSON.parse(requestBody);
      console.log('Request body parsed:', parsedBody);
    } catch (error) {
      console.error('Error parsing request body:', error);
      res.statusCode = 400;
      res.end('Invalid JSON format in request body');
      return;
    }

    // Check if the request body is an array
    if (!Array.isArray(parsedBody)) {
      res.statusCode = 400;
      res.end('Invalid JSON format. Expecting an array of products.');
      return;
    }

    let totalPurchaseValue = 0; // Variable to store the total purchase value

    const purchasePromises = parsedBody.map((product) => {
      const { UserID, BookID, Quantity } = product;

      return checkQuantity(connection, BookID, Quantity)
        .then(() => computePrice(connection, BookID, Quantity))
        .then((result) => {
          totalPurchaseValue += result.total_price; // Accumulate total purchase value
          return { UserID, BookID, Quantity, totalPrice: result.total_price }; // Include totalPrice in the resolved object
        });
    });

    let products; // Define products variable in the outer scope

    Promise.all(purchasePromises)
      .then((resolvedProducts) => {
        products = resolvedProducts; // Assign to outer scope variable
        return getWalletBalance(connection, products[0].UserID, totalPurchaseValue);
      })
      .then((userWalletBalance) => {
        console.log('User wallet balance:', userWalletBalance);
        if (userWalletBalance.balance < totalPurchaseValue) {
          console.log('Insufficient wallet balance');
          throw { statusCode: 400, message: 'Insufficient wallet balance' };
        }

        // Now proceed with the individual product purchases
        const productPurchasePromises = products.map((product) => {
          const { UserID, BookID, Quantity, totalPrice } = product;

          return performPurchase(connection, UserID, BookID, Quantity, totalPrice);
        });

        return Promise.all(productPurchasePromises);
      })
      .then(() => {
        console.log('All purchases successful');
        res.statusCode = 200;
        res.end('All purchases successful');
      })
      .catch((error) => {
        console.error('Error during purchases:', error);
        res.statusCode = error.statusCode || 500;
        res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
      });
  });
}

// Function called when the user wants to check his past purchase history
function viewPurchaseHistory(connection, req, res) {
  if (req.method === 'GET' && req.url.startsWith('/purchase_history')) {
    const queryParameters = new URLSearchParams(req.url.split('?')[1]);
    const userId = queryParameters.get('id');

    if (!userId || isNaN(userId)) {
      res.statusCode = 400; // Bad Request
      res.end('Invalid User ID');
      return;
    }

    const selectQuery = 'SELECT * from PurchaseHistory where UserID = ?';

    new Promise((resolve, reject) => {
      connection.query(selectQuery, [userId], (err, results) => {
        if (err) {
          console.error('Error querying the database: ' + err.stack);
          reject(err);
          return;
        }

        resolve(results);
      });
    })
      .then((results) => {
        if (results.length === 0) {
          res.statusCode = 404; // Not Found
          res.end(`There are no previous orders for user ${userId}`);
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(results));
        }
      })
      .catch((error) => {
        res.statusCode = 500;
        res.end('Internal Server Error');
      });
  }
}

function createCheckoutSession(userId, amount) {
  return new Promise((resolve, reject) => {
    stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Wallet Recharge',
          },
          unit_amount: amount * 100, // Stripe expects amount in cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `http://localhost:3000/success.html`, // success page
      cancel_url: 'http://localhost:3000/cancel.html/', // cancel page
      client_reference_id: userId.toString(), // Add user ID as client reference
    }, (error, session) => {
      if (error) {
        console.error('Error creating Checkout Session:', error);
        reject(error);
      } else {
        resolve(session);
      }
    });
  });
}

// Assuming userBalances is a global variable or defined in the outer scope
const userBalances = {};
function addBalancetoWallet(req, res) {
  console.log('Received a request to add to the wallet');
  let requestBody = '';

  req.on('data', (data) => {
    requestBody += data;
  });

  req.on('end', () => {
    let parsedBody;

    try {
      parsedBody = JSON.parse(requestBody);
      console.log('Request body parsed:', parsedBody);
    } catch (error) {
      console.error('Error parsing request body:', error);
      res.statusCode = 400;
      res.end('Invalid JSON format in request body');
      return;
    }

    const { user_id, amount } = parsedBody;

    if (!user_id || !amount) {
      res.statusCode = 400;
      res.end('Both user_id and amount are required in the request body');
      return;
    }

    const userId = parseInt(user_id);
    if (isNaN(userId)) {
      res.statusCode = 400;
      res.end('Invalid user_id');
      return;
    }

    userBalances[userId] = (userBalances[userId] || 0) + parseFloat(amount);

    // Use the createCheckoutSession function with promises
    createCheckoutSession(userId, amount)
      .then((session) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ checkout_url: session.url }));
      })
      .catch((error) => {
        console.error('Error creating Checkout Session:', error);
        res.statusCode = 500;
        res.end('Internal Server Error');
      });
  });
}

function handleSuccess(req, res) {
  const sessionId = req.query.session_id;

  const updateQuery = `
    UPDATE Wallet 
    SET WalletBalance = WalletBalance + ? 
    WHERE UserID = ?
  `;

  stripe.checkout.sessions
    .retrieve(sessionId)
    .then((session) => {
      if (session.payment_status === 'paid') {
        const userId = parseInt(session.client_reference_id);
        const amount = session.amount_total / 100; 

        if (isNaN(userId)) {
          console.error('Invalid user ID:', session.client_reference_id);
          res.status(400).send('Invalid user ID');
          return;
        }

        console.log(`Updating wallet balance for user ${userId} with amount ${amount}`);

        new Promise((resolve, reject) => {
          connection.query(updateQuery, [amount, userId], (err, updateResult) => {
            if (err) {
              console.error('Error updating wallet balance:', err);
              reject(err);
              return;
            }

            resolve(updateResult);
          });
        })
        .then((updateResult) => {
          console.log('Database update result:', updateResult);
          console.log(`Amount ${amount} added to the wallet for user ${userId}`);
          // Redirect to the full URL of the success page
          res.redirect('http://localhost:3000/success.html');
        })
        .catch((updateError) => {
          console.error('Error updating wallet balance:', updateError);
          res.status(500).send('Internal Server Error');
        });
      } else {
        console.log(`Payment not successful for session ${sessionId}`);
        res.redirect('http://localhost:3000/cancel.html');
      }
    })
    .catch((error) => {
      console.error('Error handling successful payment:', error);
      res.status(500).send('Internal Server Error');
    });
}

// Function to view a user's cart
function viewUserCart(connection, req, res) {
  const queryParameters = new URLSearchParams(req.url.split('?')[1]);
  const userId = queryParameters.get('id');

  if (!userId || isNaN(userId)) {
    res.statusCode = 400; // Bad Request
    res.end('Invalid User ID');
    return;
  }

  const selectQuery = `
    SELECT C.*, BL.Title, BL.Price
    FROM Cart C
    JOIN BookListing BL ON C.BookID = BL.BookID
    WHERE C.UserID = ?
  `;

  new Promise((resolve, reject) => {
    connection.query(selectQuery, [userId], (err, results) => {
      if (err) {
        console.error('Error querying the database: ' + err.stack);
        reject(err);
        return;
      }

      resolve(results);
    });
  })
    .then((results) => {
      if (results.length === 0) {
        res.statusCode = 404; // Not Found
        res.end(`Cart is empty for user_id ${userId}`);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(results));
      }
    })
    .catch((error) => {
      res.statusCode = 500;
      res.end('Internal Server Error');
    });
}

//Function to add the products to the cart
function addToCart(connection, req, res) {
  let requestBody = '';

  req.on('data', (data) => {
    requestBody += data;
  });

  req.on('end', () => {
    let parsedBody;

    try {
      parsedBody = JSON.parse(requestBody);
      console.log('Request body parsed:', parsedBody);

      const { book_id, user_id, quantity } = parsedBody;

      console.log(`Adding to cart for book_id: ${book_id}, user_id: ${user_id}, quantity: ${quantity}`);
      return new Promise((resolve, reject) => {
        if (!book_id || !user_id || !quantity || quantity <= 0) {
          console.error('Invalid parameters for adding to cart');
          reject({ statusCode: 400, message: 'Invalid parameters' });
          return;
        }

        const checkQuantityQuery = 'SELECT Quantity FROM BookListing WHERE BookID = ?';

        connection.query(checkQuantityQuery, [book_id], (err, result) => {
          if (err) {
            console.error('Error checking quantity: ' + err.stack);
            reject({ statusCode: 500, message: 'Error checking quantity' });
            return;
          }

          if (result.length === 0 || result[0].Quantity < quantity) {
            console.log('Insufficient quantity available');
            reject({ statusCode: 422, message: 'Insufficient quantity available' });
            return;
          }

          const updateCartQuery = `
            INSERT INTO Cart (UserID, BookID, Quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE Quantity = Quantity + ?;
          `;

          connection.query(updateCartQuery, [user_id, book_id, quantity, quantity], (err) => {
            if (err) {
              console.error('Error updating the cart: ' + err.stack);
              reject({ statusCode: 500, message: 'Error updating the cart' });
              return;
            }

            console.log('Product added to the cart');
            resolve({ statusCode: 200, message: 'Product added to the cart' });
          });
        });
      })
      .then((result) => {
        // Use writeHead instead of status
        res.writeHead(result.statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: result.message }));
      })
      .catch((error) => {
        res.writeHead(error.statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      });
    } catch (error) {
      console.error('Error parsing request body:', error);
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid JSON format in request body');
      return;
    }
  });
}
// Function to delete all products from the cart for a user
function deleteFromCart(connection, req, res) {
  const queryParameters = new URLSearchParams(req.url.split('?')[1]);
  const userId = queryParameters.get('id');
  if (!userId || isNaN(userId)) {
    res.statusCode = 400; // Bad Request
    res.end('Invalid User ID');
    return;
  }

  const checkQuery = `
    SELECT COUNT(*) AS count
    FROM Cart
    WHERE UserID = ?
  `;

  const deleteQuery = `
    DELETE FROM Cart
    WHERE UserID = ?
  `;

  new Promise((resolve, reject) => {
    // First, check if any records exist
    connection.query(checkQuery, [userId], (error, results) => {
      if (error) {
        console.error('Error querying the cart:', error);
        reject(error);
        return;
      }

      // Check the count of records
      if (results[0].count > 0) {
        // Proceed with deletion
        connection.query(deleteQuery, [userId], (error, result) => {
          if (error) {
            console.error('Error deleting products from the cart:', error);
            reject(error);
            return;
          }

          console.log(`Deleted all products from the cart for user ${userId}`);
          resolve(result);
        });
      } else {
        // No records to delete
        resolve({ message: 'No products found for the user. Nothing to delete.' });
      }
    });
  })
  .then((result) => {
    if (result.message) {
      // No records found case
      res.statusCode = 404;
      res.writeHead(res.statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: result.message }));
    } else {
      // Records deleted successfully
      res.statusCode = 200;
      res.writeHead(res.statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Products deleted successfully' }));
    }
  })
  .catch((error) => {
    res.statusCode = 500;
    res.writeHead(res.statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Internal Server Error' }));
  });
}

//Function for a user to place bid
function placeBid(connection, req, res) {
  let requestBody = '';

  req.on('data', (data) => {
    requestBody += data;
  });

  req.on('end', () => {
    let parsedBody;

    try {
      parsedBody = JSON.parse(requestBody);
      console.log('Request body parsed:', parsedBody);
      const { book_id, user_id, priceList, maxLimit, autoBid } = parsedBody;
      console.log(`Adding to bids for book_id: ${book_id}, user_id: ${user_id}, priceList: ${priceList}`);
      var curr_Wallet;
      var firstBid=true;
      var currentBid, minimumIncrement;
      var previousPriceList, previousAutoBid, previousMaxLimit;
      var newCurrBidVal, newBuyerID, currMaxLimit, currMaxBuyer, maxPriceList;
      var newPriceListVal, deductVal;
      Promise.resolve().then(()=>{
        return new Promise((resolve, reject) => {
          const selectQuery = 'SELECT WalletBalance FROM wallet WHERE UserID = ?';
          connection.query(selectQuery, [user_id], (err, results) => {
            if (err) {
              console.error('Error querying the database: ' + err.stack);
              reject({ statusCode: 500, message: 'Internal Server Error' });
              return;
            }
            console.log('Wallet balance query results:', results);
            if (results[0]) {
              curr_Wallet = results[0].WalletBalance;
              resolve();
            } 
            else {
              console.log(`No wallet balance found for user ${user_id}`);
              reject({ statusCode: 404, message: `No wallet balance found for user ${user_id}` });
              return;
            }
          });
        }).then(() =>{
          return new Promise((resolve, reject) => {
        const selectAuctionQuery= 'SELECT EndDateTime, CurrentBid, MinimumIncrement FROM Auction WHERE BookID= ?';
        var currentTime= new Date();
        connection.query(selectAuctionQuery, [book_id], (err, results) =>{
          if(err){
            console.error('Error querying the database: ' + err.stack);
            reject({statusCode: 400, message: 'Internal Server Error'});
            return;
          }
          console.log('Auction details are: ', results);
          if(results.length>0 & currentTime<results[0].EndDateTime){
            console.log('Auction is Valid');
            currentBid=results[0].CurrentBid;
            minimumIncrement=results[0].MinimumIncrement;
            resolve();
          }
          else{
            console.log(`No auction found for book: ${book_id}`);
            reject({statusCode: 404, message: `No auction found for book ${book_id}`});
            return;
          }
          });
        });
        }).then(() => {
          return new Promise((resolve, reject) => {
            const userBidQuery= 'SELECT * FROM Bids WHERE BookID= ? AND UserID= ?';
            connection.query(userBidQuery, [book_id, user_id], (err, results) =>{
              if(err){
                console.error('Error querying the database: '+ err.stack);
                reject({statusCode: 500, message: 'Internal Server Error'});
                return;
              }
              console.log('Previous bids: ', results);
              console.log(results.length);
              if(results.length > 0){
                firstBid=false;
                previousPriceList=results[0].PriceList;
                previousAutoBid=results[0].AutoBid;
                previousMaxLimit=results[0].MaxLimit;
                resolve();
              }
              resolve();
            });
          });
        }).then(() =>{
          return new Promise((resolve, reject) => {
            if (!book_id || !user_id || !priceList || maxLimit==null) {
              console.error('Invalid parameters for participating in auction');
              reject({ statusCode: 400, message: 'Invalid parameters' });
              return;
            }
            console.log("This is firstBid value "+firstBid);
            if(firstBid){
              if(priceList > curr_Wallet ){
                console.error('Invalid parameters for placing bid. Reason: Insufficient funds in your wallet');
                reject({statusCode: 400, message: 'Invalid parameters: Insufficient funds'});
                return;
              }
              if(priceList<currentBid+minimumIncrement){
                console.error('Invalid parameters for placing bid. Reason: Incorrect bid');
                reject({statusCode: 400, message: 'Invalid parameters: Incorrect bid'});
                return;
              }
              const insertBidQuery = `INSERT INTO Bids (UserID, BookID, PriceList, MaxLimit, AutoBid) VALUES (?, ?, ?, ?, ?);`;
              connection.query(insertBidQuery, [user_id, book_id, priceList, maxLimit, autoBid], (err) => {
                if (err) {
                  console.error('Error adding a new bid: ' + err.stack);
                  reject({ statusCode: 500, message: 'Error adding new bid' });
                  return;
                }
                if(autoBid==true){
                  deductVal=parseInt(curr_Wallet)-parseInt(maxLimit);
                }
                else{
                  console.log(curr_Wallet);
                  console.log(priceList);
                  deductVal=parseInt(curr_Wallet)-parseInt(priceList);
                }
                console.log('Successfully participating in the bid');
                resolve({ statusCode: 200, message: 'Your are in the auction' });
              });
            }
            else{
              if(priceList<currentBid+minimumIncrement){
                console.error('Invalid parameters for placing bid. Reason: Incorrect bid');
                reject({statusCode: 400, message: 'Invalid parameters: Incorrect bid'});
                return;
              }
              let priceArray=previousPriceList.split(';');
              let prevPriceVal=parseInt(priceArray[0]);
              deductVal=curr_Wallet-parseInt(priceList)+prevPriceVal;
              newPriceList= priceList+';'+previousPriceList;
              //console.log("This is previous price list: "+previousPriceList);
              const updateBidQuery = `UPDATE Bids SET PriceList=? WHERE UserID= ? and BookID = ?`;
              connection.query(updateBidQuery, [newPriceList, user_id, book_id], (err) => {
                if(err){
                  console.error('Error updating bid: '+ err.stack);
                  reject({statusCode: 500, message: 'Error updating a bid'});
                  return;
                }
              });
              resolve();
            }
          });
        }).then(()=>{
          return new Promise((resolve, reject) =>{
            //console.log("Starting the deduction");
            const updateWalletQuery=`UPDATE Wallet SET WalletBalance=? WHERE UserID=?`;
            //console.log("Here is the value to be set in wallet: "+ deductVal);
            connection.query(updateWalletQuery, [deductVal, user_id], (err)=>{
              if(err){
                console.error('Error reducing amount from Wallet: '+err.stack);
                reject({statusCode: 500, message: 'Error deducting amount from wallet'});
                return;
              }
              resolve();
            })
          });
        }).then(() =>{
          return new Promise((resolve, reject) =>{
            const pullMaxBid=`SELECT MAX(MaxLimit) as maxLimitVal, UserID, GROUP_CONCAT(PriceList) as PriceList FROM Bids WHERE AutoBid = TRUE AND BookID = ? GROUP BY BookID, UserID;`;
            connection.query(pullMaxBid, [book_id], (err, results) => {
              if(err){
                console.error('Error while getting data from Bids table: '+err.stack);
                reject({statusCode: 500, message: 'Error getting the maxLimit'});
                return;
              }
              // console.log("maxLimit results: "+ results[0].PriceList);
              // console.log(results.length);
              if(results.length ==0){
                currMaxBuyer=user_id;
                currMaxLimit=maxLimit;
                maxPriceList=priceList;
              }
              if(results.length>0){
                currMaxBuyer=results[0].UserID;
                currMaxLimit=results[0].maxLimitVal;
                maxPriceList=results[0].PriceList;
              }
              resolve();
            });
          });
        }).then(() =>{
          return new Promise((resolve, reject) =>{
            if(autoBid==true & currMaxBuyer != user_id & currMaxLimit>maxLimit){
              newBuyerID=currMaxBuyer;
              newCurrBidVal=min(currMaxLimit, maxLimit+minimumIncrement);
              newPriceListVal="";
              newPriceListVal=newCurrBidVal+';'+maxPriceList;
              const updateAutoBid1=`UPDATE Bids SET PriceList=? WHERE BookID= ? AND UserID = ?`;
              connection.query(updateAutoBid1, [newPriceListVal, book_id, newBuyerID], (err)=>{
                if(err){
                  console.error('Error while updating pricelist due to autobid: '+err.stack);
                  reject({statusCode: 500, message: 'Error updating pricelist bid due to autobid'});
                  return;
                }
                resolve();
              });
            }
            else if(currMaxLimit>=priceList+minimumIncrement & currMaxBuyer != user_id){
              newCurrBidVal=priceList+minimumIncrement;
              newBuyerID=currMaxBuyer;
              newPriceListVal="";
              newpiceListval=newCurrBidVal+';'+maxPriceList;
              const updateAutoBid=`UPDATE Bids SET PriceList=? WHERE BookID= ? AND UserID= ?`;
              connection.query(updateAutoBid, [newpiceListval, book_id, currMaxBuyer], (err) => {
                if(err){
                  console.error('Error while updating pricelist due to autobid: '+err.stack);
                  reject({statusCode: 500, message: 'Error updating pricelist bid due to autobid'});
                  return;
                }
                resolve();
              });
            }
            else{
              newBuyerID=user_id;
              newCurrBidVal=priceList;
              resolve();
            }
          });
        }).then(()=>{
          return new Promise((resolve, reject) =>{
            const updateCurrBid= `UPDATE Auction SET CurrentBid=?, BuyerID=? WHERE BookID= ?`;
            connection.query(updateCurrBid, [newCurrBidVal, newBuyerID, book_id], (err) =>{
              if(err){
                console.error('Error updating current bid: '+ err.stack);
                reject({statusCode: 500, message: 'Error updating current bid value'});
                return;
              }
              resolve();
            });
          });
        }).then(()=>{
          return new Promise((resolve, reject)=>{
            if(autoBid==true){
              if(!maxLimit || maxLimit>curr_Wallet){
                console.error('Invalid parameters for participating in auction');
                reject({ statusCode: 400, message: 'Invalid parameters' });
                return;
              }
              else{
                resolve({statusCode: 200, message: 'Success'});
              }
            }
            else{
              resolve({statusCode: 200, message: 'Success'});
            }
          });
        }).then((result) => {
          console.log(result);
          res.writeHead(result.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: result.message }));
        }).catch((error) => {
          res.writeHead(error.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        });
      });
    } catch (error) {
      console.error('Error parsing request body:', error);
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid JSON format in request body');
      return;
    }
  });
}



module.exports = {
    viewUserCart,
    viewPurchaseHistory,
    deleteFromCart,
    addToCart,
    addBalancetoWallet,
    purchaseProduct,
    placeBid
}
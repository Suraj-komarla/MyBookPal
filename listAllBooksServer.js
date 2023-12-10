const http = require('http');
const mysql = require('mysql2');

function getAllBooks(connection, req, res){
    const selectQuery = 'SELECT * FROM BookListing'
    connection.query(selectQuery, (err, results) => {
      if (err) {
        console.error('Error querying the database: ' + err.stack);
        res.statusCode = 500;
        res.end('Internal Server Error');
        return;

      }
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(results));

    });
}

function searchBooks(connection, req, res){
    const userKeyword = req.url.split('?')[1]?.split('=')[1];
    const searchQuery = `
    SELECT * FROM BookListing
    WHERE Title LIKE ? OR Author LIKE ? OR Book_description LIKE ? OR Genre LIKE ?;
  `;
    const keywordParam = `%${userKeyword}%`;
    // console.log(keywordParam)
    connection.query(searchQuery, [keywordParam, keywordParam, keywordParam, keywordParam], (err, results) => {
      if (err) {
        res.statusCode = 500;
        res.end('Internal Server Error');
        return;
      }
      if (results.length === 0) {
        res.statusCode = 404;
        res.end('No matching books found');
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(results));
      }
    });
    
}

function orderBooks(connection, req, res){
    const features = req.url.split('?')[1]?.split(',')
    let priceFeatures = features[0].split('=').pop();
    let orderFeatures = NaN;
    if (features.length > 1) {
      orderFeatures = features[1].split('=')[1]?.split('-');
    }
    let operator = decodeURIComponent(priceFeatures.slice(0, 3));
    let value = parseInt(priceFeatures.slice(3));
    // console.log('operator: ', operator)
    // console.log('value: ', value)
    let selectQuery = 'SELECT * FROM  BookListing WHERE PRICE '
    selectQuery += operator
    selectQuery += ' '
    selectQuery += parseInt(value)
    selectQuery += ' ORDER BY'
    // console.log(selectQuery)

    if (orderFeatures[0] === 'low') {
      selectQuery += ' Price ASC'
    } else {
      selectQuery += ' Price DESC'
    }
    selectQuery += ';'
    console.log(selectQuery)
    connection.query(selectQuery, (err, results) => {
      if (err) {
        console.error('Error querying the database: ' + err.stack);
        res.statusCode = 500
        res.end('Internal Server Error');
        return;
      }
      if (results.length === 0) {
        res.statusCode = 404;
        res.end('No matching books found');
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(results));
      }
    });
}

function filterBooks(connection, req, res){
    let selectQuery;
    if (req.url.includes('&')) {
      let params = req.url.split('?')[1]?.split('&')
      // console.log(params)
      let features = params[0].split('=')[1]?.split(',');
      // console.log(features)

      let sorting = params[1].split(',')
      // console.log(sorting)
      let priceFeatures = sorting[0].split('=').pop();
      let orderFeatures = NaN;
      if (sorting.length > 1) {
        orderFeatures = sorting[1].split('=')[1]?.split('-');
      }
      let operator = decodeURIComponent(priceFeatures.slice(0, 3));
      let value = parseInt(priceFeatures.slice(3));
      // console.log('operator: ', operator)
      // console.log('value: ', value)

      selectQuery = 'SELECT * FROM BookListing WHERE';
      if (features && features.length > 0) {
        selectQuery += ' (';
        features.forEach((feature, index) => {
          if (index > 0) {
            selectQuery += ' OR ';
          }
          selectQuery += `Author = '${feature}' OR Book_condition = '${feature}' OR Genre = '${feature}'`;
        });
        selectQuery += ') AND Price ';
      }

      selectQuery += operator
      selectQuery += ' '
      // if(value = NaN){
      //   console.log('value: ', value);
      // }
      // console.log('value: ', value);
      selectQuery += parseInt(value)

      selectQuery += ' ORDER BY'
      // console.log(selectQuery)

      if (orderFeatures[0] === 'low') {
        selectQuery += ' Price ASC'
      } else {
        selectQuery += ' Price DESC'
      }
      selectQuery += ';'
      // console.log(selectQuery)

    } else {
      let features = req.url.split('=')[1]?.split(',');
      // console.log(features)
      selectQuery = 'SELECT * FROM BookListing WHERE';
      if (features && features.length > 0) {
        selectQuery += ' ';
        features.forEach((feature, index) => {
          if (index > 0) {
            selectQuery += ' OR ';
          }
          selectQuery += `(Author = '${feature}' OR Book_condition = '${feature}' OR Genre = '${feature}')`;
        });
        selectQuery += ';';
      }
    }
    console.log(selectQuery);

    connection.query(selectQuery, (err, results) => {
      if (err) {
        console.error('Error querying the database: ' + err.stack);
        res.statusCode = 500
        res.end('Internal Server Error');
        return;
      }
      if (results.length === 0) {
        res.statusCode = 404;
        res.end('No matching books found');
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(results));
      }
    });
}
//localhost:3000/getbooks?query=adv&filter=fiction,Romance&sort=low-High

// Example usage:
// localhost:3000/getbooks?query=adv&filter=fiction,Romance&sort=low-High
// or localhost:3000/getbooks?query=adv&filter=fiction,Romance
// or localhost:3000/getbooks?query=adv
// searchAndFilterBooks(connection, req, res);


// Example usage:
// searchAndFilterBooks(connection, req, res);


// Example usage:
// searchAndFilterBooks(connection, req, res);


function getBook(connection, req, res){
    const bookId = parseInt(req.url.split('/').pop());
    if (isNaN(bookId)) {
      res.statusCode = 400;
      res.end('Invalid Book ID');
      return;
    }

    const selectQuery = 'SELECT * FROM BookListing WHERE BookID = ?';
    connection.query(selectQuery, [bookId], (err, results) => {
      if (err) {
        console.error('Error querying the database: ' + err.stack);
        res.statusCode = 500;
        res.end('Internal Server Error');
        return;
      }
      if (results.length === 0) {
        res.statusCode = 404;
        res.end('Book not found');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(results[0]));
      }
    });
}
//localhost:3000/books/sort?order=High-low
function sortBooks(connection, req, res){
  const sort_style = req.url.split('order=')[1]?.split('-')[0]
    let selectQuery = 'SELECT * FROM  BookListing ORDER By '
    
    if (sort_style === 'low') {
      selectQuery += ' Price ASC'
    } else {
      selectQuery += ' Price DESC'
    }
    selectQuery += ';'
    connection.query(selectQuery, (err, results) => {
      if (err) {
        console.error('Error querying the database: ' + err.stack);
        res.statusCode = 500
        res.end('Internal Server Error');
        return;
      }
      if (results.length === 0) {
        res.statusCode = 404;
        res.end('No matching books found');
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(results));
      }
    });
}

function newBook(connection, req, res){
    const userId = parseInt(req.url.split('/').pop());
    // console.log(userId);
    const selectQuery = `SELECT is_admin FROM CustomerRepresentative WHERE user_id = ?`;
    connection.query(selectQuery, [userId], (selecterror, results) => {
      if (selecterror) {
        res.writeHead(500, {
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({
          error: 'Database error.'
        }));
      } else if (results.length === 1 && results[0].is_admin === 1) {
        let data = '';

        req.on('data', (chunk) => {
          data += chunk;
        });

        req.on('end', () => {
          try {
            const newBook = JSON.parse(data);
            const insertQuery = 'INSERT INTO BookListing (Title, Author, Book_condition, Price, Genre, Book_description, Quantity, Auction, Photos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

            connection.query(
              insertQuery,
              [
                newBook.Title,
                newBook.Author,
                newBook.Book_condition,
                newBook.Price,
                newBook.Genre,
                newBook.Book_description,
                newBook.Quantity,
                newBook.Auction,
                newBook.Photos,
              ],
              (inserterror) => {
                if (inserterror) {
                  res.writeHead(500, {
                    'Content-Type': 'application/json'
                  });
                  res.end(JSON.stringify({
                    error: 'Book Insertion failed.'
                  }));
                } else {
                  res.writeHead(200, {
                    'Content-Type': 'application/json'
                  });
                  res.end(JSON.stringify({
                    message: 'Book added successfully.'
                  }));
                }
              }
            );
          } catch (e) {
            res.statusCode = 400;
            res.end('Malformed JSON');
          }

        });
      } else {
        res.writeHead(403, {
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({
          error: 'Permission denied. User is not an admin.'
        }));
      }
    });
}

function updateBook(connection, req, res){
    const userDetails = req.url.split('?')[1]?.split('&');
    // console.log(userDetails)
    const bookId = parseInt(userDetails[1].split('=')[1])
    const userId = parseInt(userDetails[0].split('=')[1])
    // console.log(userId)
    // console.log(bookId)
    if (isNaN(bookId)) {
      res.statusCode = 400;
      res.end('Invalid Book ID');
      return;
    }
    const checkQuery = `SELECT * FROM BookListing Where BookId =?`
    connection.query(checkQuery, [bookId], (checkerr, checkresult) => {
      if (checkerr) {
        console.error('Error querying the database: ' + err.stack);
        res.statusCode = 500;
        res.end('Internal Server Error');
        return;
      }
      if (checkresult.length === 0) {
        res.statusCode = 404;
        res.end('Book not found');
      } else {
        const selectQuery = `SELECT is_admin FROM CustomerRepresentative WHERE user_id = ?`;
        connection.query(selectQuery, [userId], (selecterror, results) => {
          if (selecterror) {
            res.writeHead(500, {
              'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({
              error: 'Database error.'
            }));
          } else if (results.length === 1 && results[0].is_admin === 1) {
            let data = '';

            req.on('data', (chunk) => {
              data += chunk;
            });

            req.on('end', () => {
              try {
                const updateData = JSON.parse(data)
                let updateQuery = 'UPDATE BookListing SET ';
                const updateParams = [];

                for (const key in updateData) {
                  updateQuery += `${key} = ?, `;
                  updateParams.push(updateData[key]);
                }

                // Remove the trailing comma and space
                updateQuery = updateQuery.slice(0, -2);

                updateQuery += ' WHERE BookID = ?';
                updateParams.push(bookId);
                connection.query(updateQuery, updateParams, (updateerr) => {
                  if (updateerr) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({
                      error: 'Book update failed.'
                    }));
                  } else {
                    res.statusCode = 200;
                    res.end(JSON.stringify({
                      message: 'Book updated successfully.'
                    }));
                  }
                });
              } catch (e) {
                res.statusCode = 400;
                res.end('Malformed JSON');
              }

            });
          } else {
            res.writeHead(403, {
              'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({
              error: 'Permission denied. User is not an admin.'
            }));
          }
        });
      }
    });
}

function deleteBook(connection, req, res){
    const userDetails = req.url.split('?')[1]?.split('&');
    // console.log(userDetails)
    const bookId = parseInt(userDetails[1].split('=')[1])
    const userId = parseInt(userDetails[0].split('=')[1])
    // console.log(userId)
    // console.log(bookId)

    if (isNaN(bookId)) {
      res.statusCode = 400;
      res.end('Invalid Book ID');
      return;
    }
    const checkQuery = `SELECT * FROM BookListing Where BookId =?`
    connection.query(checkQuery, [bookId], (checkerr, checkresult) => {
      if (checkerr) {
        console.error('Error querying the database: ' + err.stack);
        res.statusCode = 500;
        res.end('Internal Server Error');
        return;
      }
      if (checkresult.length === 0) {
        res.statusCode = 404;
        res.end('Book not found');
      } else {
        const selectQuery = `SELECT is_admin FROM CustomerRepresentative WHERE user_id = ?`;
        connection.query(selectQuery, [userId], (error, results) => {
          if (error) {
            res.writeHead(500, {
              'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({
              error: 'Database error.'
            }));
          } else if (results.length === 1 && results[0].is_admin === 1) {
            const deleteQuery = `DELETE FROM BookListing WHERE BookID = ?`
            connection.query(deleteQuery, [bookId], (error, foundBook) => {
              if (error) {
                res.writeHead(500, {
                  'Content-Type': 'application/json'
                });
                res.end(JSON.stringify({
                  error: 'Book deletion failed.'
                }));
              }
              if (foundBook.length === 0) {
                res.statusCode = 404;
                res.end('Book not found');
              } else {
                res.writeHead(200, {
                  'Content-Type': 'application/json'
                });
                res.end(JSON.stringify({
                  message: 'Book deleted successfully.'
                }));
              }

            });

          } else {
            res.writeHead(403, {
              'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({
              error: 'Permission denied. User is not an admin.'
            }));
          }
        });
      }
    });
}

function deleteAll(connection, req, res) {
    const userId = parseInt(req.url.split('/').pop());
    const selectQuery = `SELECT is_admin FROM CustomerRepresentative WHERE user_id = ?`;
    connection.query(selectQuery, [userId], (error, results) => {
      if (error) {
        res.writeHead(500, {
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({
          error: 'Database error.'
        }));
      } else if (results.length === 1 && results[0].is_admin === 1) {
        const deleteQuery = `DELETE FROM BookListing;`
        connection.query(deleteQuery, (error, results) => {
          if (error) {
            res.statusCode = 500;
            res.end('Internal Server Error');
            return;
          }
          res.statusCode = 200;
          res.end('ALL Books deleted');
        });
      } else {
        res.writeHead(403, {
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({
          error: 'Permission denied. User is not an admin.'
        }));
      }
    });
}

module.exports ={
    searchBooks,
    filterBooks,
    orderBooks,
    getAllBooks,
    getBook,
    newBook,
    updateBook,
    deleteBook,
    deleteAll,
    sortBooks
}
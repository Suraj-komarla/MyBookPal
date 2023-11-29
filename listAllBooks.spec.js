const app = require('./server.js'); 
const axios = require('axios');


// Test GET /books/{id} endpoint
describe('GET /books/{id}', () => {
  it('should return a specific book by ID', async () => {
    const bookId = 2; 
    const response = await axios.get(`http://localhost:3000/books/${bookId}`);

    // Add assertions for the response data
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
  });
  it('should return a 404 status for an invalid book ID', async () => {
    const bookId = 999; // Use an invalid book ID
    try {
      await axios.get(`http://localhost:3000/books/${bookId}`);
    } catch (error) {
      expect(error.response.status).toBe(404);
    }
  });

  it('should handle a 500 error when encountering a malformed SQL query while fetching a book by ID', async () => {
    const bookId = 2;
    try {
      await axios.get(`http://localhost:3000/books/${bookId}?sql=SELECT * FROM books WHERE id = 1'`);
    } catch (error) {
      expect(error.response.status).toBe(500);
    }
  });
});

describe('GET /books', () => {
  it('should return all books', async () => { 
    const response = await axios.get(`http://localhost:3000/books`);

    // Add assertions for the response data
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
  });
  it('should handle a 500 error when encountering a malformed SQL query', async () => {
    try {
      await axios.get(`http://localhost:3000/books`, {
        sqlQuery: "SELECT * FROM Books;"
      });
    } catch (error) {
      expect(error.response.status).toBe(500);
    }
  });

  
});


describe('GET /books/search?', () => {
  it('should return a specific book by ID', async () => {
    const userKeyword = 'adv'; 
    const response = await axios.get(`http://localhost:3000/books/search?keyword=${userKeyword}`);

    // Add assertions for the response data
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
  });
  it('should return a 404 status for no books found', async () => {
    const userKeyword = 'man';
    try {
      await axios.get(`http://localhost:3000/books/search?keyword=${userKeyword}`);
    } catch (error) {
      expect(error.response.status).toBe(404);
    }
  });
  it('should handle a 500 error when encountering a malformed SQL query', async () => {
    const userKeyword = 'adv';
    try {
      await axios.get(`http://localhost:3000/books/search?keyword=${userKeyword}`, {
        sqlQuery: `
        SELECT * FROM Books
        WHERE Title LIKE ${userKeyword} OR Author LIKE ${userKeyword} OR Book_description LIKE ${userKeyword};
      `
      });
    } catch (error) {
      expect(error.response.status).toBe(500);
    }
  });
});

describe('GET /books/order?', () => {
  it('should return books with a given specific price and order', async () => {
    const price_filter = 10; 
    const order_filter = 'low-High';
    const response = await axios.get(`http://localhost:3000/books/order?price=<${price_filter},order=${order_filter}`);

  
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
  });
  it('should return a 404 status for no books found', async () => {
    const price_filter = 3;
    try {
      await axios.get(`http://localhost:3000/books/order?price=<${price_filter}`);
    } catch (error) {
      expect(error.response.status).toBe(404);
    }
  });
  it('should handle a 500 error when encountering a malformed SQL query', async () => {
    const price_filter = 10; 
    const order_filter = 'low-High';

    try {
      await axios.get(`http://localhost:3000/books/order?price=<${price_filter},order=${order_filter}`, {
        sqlQuery: `SELECT * FROM  Books WHERE PRICE < ${price_filter} ORDER BY Price DESC;`
      });
    } catch (error) {
      expect(error.response.status).toBe(500);
    }
  });
});

describe('GET /books/filter?', () => {
  it('should return books with a given specific price and order', async () => {
    const price_filter = 10; 
    const order_filter = 'low-High';
    const user_feature = 'Fiction,Romance';
    const response = await axios.get(`http://localhost:3000/books/filter?feature=${user_feature}&price=<${price_filter},order=${order_filter}`);

  
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
  });
  it('should return a 404 status for no books found', async () => {
    const price_filter = 10; 
    const order_filter = 'low-High';
    const user_feature = 'Fantasy';
    try {
      await axios.get(`http://localhost:3000/books/filter?feature=${user_feature}&price=<${price_filter},order=${order_filter}`);
    } catch (error) {
      expect(error.response.status).toBe(404);
    }
  });
  it('should handle a 500 error when encountering a malformed SQL query', async () => {
    const price_filter = 10; 
    const order_filter = 'low-High';
    const user_feature = 'Fiction';

    try {
      await axios.get(`http://localhost:3000/books/filter?feature=${user_feature}&price=<${price_filter},order=${order_filter}`, {
        sqlQuery: `SELECT * FROM Books WHERE (Author = '${user_feature}' OR Book_condition = '${user_feature}' OR Genre = ${user_feature}') AND Price < ${order_filter} ORDER BY Price ASC;`
      });
    } catch (error) {
      expect(error.response.status).toBe(500);
    }
  });

  
});


describe('PATCH /books/', () => {
  it('should update a specific book by ID', async () => {
    const userID =1;
    const bookId =10;
    const updatebook = { Book_condition: 'Update Condition', Price: ' 25.99' };
    const response = await axios.patch(`http://localhost:3000/updatebook?userId=${userID}&bookId=${bookId}`, updatebook);

    // Add assertions for the response data
    expect(response.status).toBe(200);
  });
  it('should return a 404 status for an invalid book ID', async () => {
    const userID =1;
    const bookId =99;
    const updatebook = { Book_condition: 'Update Condition', Price: ' 25.99' };
    try {
         await axios.patch(`http://localhost:3000/updatebook?userId=${userID}&bookId=${bookId}`, updatebook);
        } catch (error) {
          expect(error.response.status).toBe(404);
        }
  });
  it('should return a 404 status for an invalid book ID', async () => {
    const userID =1;
    const bookId =99;
    const updatebook = { Book_condition: 'Update Condition', Price: ' 25.99' };
    try {
         await axios.patch(`http://localhost:3000/updatebook?userId=${userID}&bookId=${bookId}`, updatebook);
        } catch (error) {
          expect(error.response.status).toBe(404);
        }
  });
  it('should handle malformed json', async () => {
    const userID =1;
    const bookId =2;
    const invalidJSON = 'invalid json';
    try {
         await axios.patch(`http://localhost:3000/updatebook?userId=${userID}&bookId=${bookId}`, invalidJSON);
        } catch (error) {
          expect(error.response.status).toBe(400);
        }
  });

  it('should handle a 500 error when encountering a malformed SQL query while updating a book by ID', async () => {
    const bookId = 8; 
    const userID =1;
    const updatedBook = { Book_condition: 'Update Condition', Price: ' 25.99' };

    try {
      await axios.patch(`http://localhost:3000/updatebook?userId=${userID}&bookId=${bookId}`, {
        updatedBook,
        sqlQuery: "UPDATE BookListing SET Book_condition = 'Update Condition', Price = '25.99' WHERE id = 8; DROP TABLE books;"
      });
    } catch (error) {
      expect(error.response.status).toBe(500);
    }
  });
});




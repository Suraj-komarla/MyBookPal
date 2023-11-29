const http = require('http');
const mysql = require('mysql2');
const url = require('url');
const crypto = require('crypto');
const sinon = require('sinon');
const { listAvailableBooks, borrowBooks, returnBooks, borrowedBooks } = require('./'); 

describe('Library Management System', () => {
  let connection;
  let res;
  let req;

  beforeEach(() => {
    connection = sinon.stub(mysql, 'createConnection');
    res = {
      writeHead: sinon.spy(),
      end: sinon.spy(),
    };
    req = {};
  });

  afterEach(() => {
    connection.restore();
  });

  describe('listAvailableBooks', () => {
    it('should return available books', () => {
      const queryStub = sinon.stub();
      connection.returns({ query: queryStub });

      const expectedResults = [{ title: 'Book1' }, { title: 'Book2' }];
      queryStub.callsArgWith(1, null, expectedResults);

      listAvailableBooks(connection, req, res);

      sinon.assert.calledWith(res.writeHead, 200, { 'Content-Type': 'application/json' });
      sinon.assert.calledWith(res.end, JSON.stringify(expectedResults));
    });

    it('should handle errors and return 500 status code', () => {
      const queryStub = sinon.stub();
      connection.returns({ query: queryStub });

      queryStub.callsArgWith(1, new Error('Database error'));

      listAvailableBooks(connection, req, res);

      sinon.assert.calledWith(res.writeHead, 500, { 'Content-Type': 'application/json' });
      sinon.assert.calledWith(res.end, JSON.stringify({ error: 'Internal Server Error' }));
    });
  });

  // Add similar tests for other functions (borrowBooks, returnBooks, borrowedBooks)
});

const http = require("http");
const mysql = require("mysql2");
const url = require("url");
const qs = require("qs");

function showBookDetails(req,res,params, connection){
    // console.log("identified request");
    const bookId = params.id;
    // Query the database to retrieve a bookID
    connection.query(
      "SELECT * FROM booklisting WHERE bookID = ?",
      [bookId],
      (err, results) => {
        if (err) {
          console.log("some db error");
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ message: "Internal Server Error." }));
          return;
        }

        if (results.length === 0) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              message: "No book found",
            })
          );
          return;
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(results));
      }
    );
}

module.exports = showBookDetails;

INSERT INTO CUSTOMER (UserID, FirstName, LastName, PhoneNumber, Email, UserAddress, UserPassword, UserCreatedAt, LastLogin, LastUpdated)
VALUES
(1, 'John', 'Doe', 123456789, 'johndoe@email.com', '123 Main St', 'password123', '2023-11-02 10:00:00', '2023-11-02 10:30:00', '2023-11-02 10:30:00'),
(2, 'Jane', 'Smith', 987654321, 'janesmith@email.com', '456 Elm St', 'pass456word', '2023-11-02 09:45:00', '2023-11-02 09:45:00', '2023-11-02 09:45:00'),
(3, 'Alice', 'Johnson', 555555555, 'alicejohnson@email.com', '789 Oak St', 'secret789', '2023-11-02 08:30:00', '2023-11-02 08:30:00', '2023-11-02 08:30:00'),
(4, 'Bob', 'Brown', 111111111, 'bobbrown@email.com', '101 Pine St', 'mypass', '2023-11-02 12:15:00', '2023-11-02 12:15:00', '2023-11-02 12:15:00'),
(5, 'Eva', 'Wilson', 999999999, 'evawilson@email.com', '321 Cedar St', 'eva1234', '2023-11-02 11:20:00', '2023-11-02 11:20:00', '2023-11-02 11:20:00');


INSERT INTO Wallet (UserID, WalletBalance)
SELECT UserID, 100.00
FROM CUSTOMER;


INSERT INTO BookListing (BookID, Title, Author, Book_condition, Price, Genre, Book_description, Quantity, Auction, Photos)
VALUES
(1, 'The Great Gatsby', 'F. Scott Fitzgerald', 'New', 12.99, 'Fiction', 'A classic novel about the American Dream.', 5, TRUE, 'great_gatsby.jpg'),
(2, 'To Kill a Mockingbird', 'Harper Lee', 'Used', 9.99, 'Fiction', 'A powerful story about racial injustice.', 3, FALSE, 'mockingbird.jpg'),
(3, '1984', 'George Orwell', 'Like New', 14.99, 'Science Fiction', 'A dystopian novel exploring surveillance.', 7, TRUE, '1984_cover.jpg'),
(4, 'The Catcher in the Rye', 'J.D. Salinger', 'Good', 8.50, 'Fiction', 'A coming-of-age novel.', 2, FALSE, 'catcher_in_the_rye.jpg'),
(5, 'Pride and Prejudice', 'Jane Austen', 'Used', 11.25, 'Romance', 'A classic love story.', 6, TRUE, 'pride_prejudice.jpg'),
(6, 'The Hobbit', 'J.R.R. Tolkien', 'Like New', 19.99, 'Fantasy', 'An epic fantasy adventure.', 4, FALSE, 'the_hobbit.jpg'),
(7, 'The Da Vinci Code', 'Dan Brown', 'Good', 7.99, 'Mystery', 'A thriller with religious undertones.', 1, TRUE, 'da_vinci_code.jpg'),
(8, 'Brave New World', 'Aldous Huxley', 'New', 13.75, 'Science Fiction', 'A dystopian exploration of a future society.', 8, FALSE, 'brave_new_world.jpg'),
(9, 'The Lord of the Rings', 'J.R.R. Tolkien', 'Used', 25.50, 'Fantasy', 'An epic fantasy trilogy.', 10, TRUE, 'lord_of_the_rings.jpg'),
(10, 'The Alchemist', 'Paulo Coelho', 'Good', 6.99, 'Fiction', 'A philosophical novel about pursuing dreams.', 9, TRUE, 'the_alchemist.jpg');

INSERT INTO PurchaseHistory (UserID, Amount, PaymentDateTime, BookID, Quantity)
VALUES
(1, 19.99, '2023-11-02 15:00:00', 1, 1),
(2, 11.50, '2023-11-02 16:30:00', 2, 2),
(3, 14.99, '2023-11-02 14:45:00', 3, 1),
(4, 8.50, '2023-11-02 13:15:00', 4, 1),
(5, 9.99, '2023-11-02 11:30:00', 5, 3);

INSERT INTO Cart (UserID, BookID, Quantity)
SELECT U.UserID, B.BookID, 1
FROM CUSTOMER U
CROSS JOIN BookListing B
WHERE U.UserID IN (1, 2, 3, 4, 5);
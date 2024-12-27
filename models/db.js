const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

connection.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database');

    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('user', 'admin', 'superadmin') NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const createBooksTable = `
        CREATE TABLE IF NOT EXISTS books (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            author VARCHAR(255) NOT NULL,
            description TEXT,
            createdBy INT NOT NULL,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (createdBy) REFERENCES users(id)
        );
    `;

    const createPurchasesTable = `
        CREATE TABLE IF NOT EXISTS purchases (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            bookId INT NOT NULL,
            userDetails JSON NOT NULL,
            purchaseDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users(id),
            FOREIGN KEY (bookId) REFERENCES books(id)
        );
    `;

    const createUserActivityLogTable = `
        CREATE TABLE IF NOT EXISTS user_activity (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            action VARCHAR(255) NOT NULL,
            actionTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users(id)
        );
    `;

    connection.query(createUsersTable, (err) => {
        if (err) {
            console.error('Failed to create "users" table:', err);
            process.exit(1);
        }
        console.log('"users" table is ready.');

        connection.query(createBooksTable, (err) => {
            if (err) {
                console.error('Failed to create "books" table:', err);
                process.exit(1);
            }
            console.log('"books" table is ready.');

            connection.query(createPurchasesTable, (err) => {
                if (err) {
                    console.error('Failed to create "purchases" table:', err);
                    process.exit(1);
                }
                console.log('"purchases" table is ready.');

                connection.query(createUserActivityLogTable, (err) => {
                    if (err) {
                        console.error('Failed to create "user_activity" table:', err);
                        process.exit(1);
                    }
                    console.log('"user_activity" table is ready.');

                });
            });
        });
    });
});

module.exports = connection;

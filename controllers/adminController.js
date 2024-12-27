const db = require('../models/db');
const nodemailer = require('nodemailer');
const { logUserActivity } = require('../services/activityLogger');

exports.createBook = (req, res) => {
    const { title, author, description } = req.body;
    const createdBy = req.user.id;
    const query = 'INSERT INTO books (title, author, description, createdBy, status) VALUES (?, ?, ?, ?, ?)';

    db.query(query, [title, author, description, createdBy, 'pending'], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error creating book', error: err });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: req.user.email,
            to: process.env.SUPERADMIN_EMAIL,
            subject: 'New Book Submission',
            text: `A new book titled "${title}" has been submitted by Admin ID ${createdBy}.`,
        };

        transporter.sendMail(mailOptions, (emailErr, info) => {
            if (emailErr) console.error('Error sending email:', emailErr);
        });

      logUserActivity(req.user.id,`Created Book`)
        res.status(201).json({ message: 'Book created successfully and pending approval' });
    });
};

exports.updateBook = (req, res) => {
    const bookId = req.params.id;
    const { title, author, description } = req.body;
    const query = 'UPDATE books SET title = ?, author = ?, description = ? WHERE id = ?';

    db.query(query, [title, author, description, bookId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error updating book', error: err });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: req.user.email,
            to: process.env.SUPERADMIN_EMAIL,
            subject: 'Book Update Notification',
            text: `The book with ID ${bookId} has been updated by Admin ID ${req.user.id}.`,
        };

        transporter.sendMail(mailOptions, (emailErr, info) => {
            if (emailErr) console.error('Error sending email:', emailErr);
        });
      logUserActivity(req.user.id,`Updated Book`)
        res.status(200).json({ message: 'Book updated successfully' });
    });
};

exports.deleteBook = (req, res) => {
    const bookId = req.params.id;
    const query = 'DELETE FROM books WHERE id = ?';

    db.query(query, [bookId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error deleting book', error: err });
      logUserActivity(req.user.id,`Deleted Book`)
        res.status(200).json({ message: 'Book deleted successfully' });
    });
};

exports.getBooks = (req, res) => {
    const query = 'SELECT * FROM books WHERE createdBy = ?';
    const adminId = req.user.id;

    db.query(query, [adminId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error retrieving books', error: err });
        res.status(200).json(result);
    });
};

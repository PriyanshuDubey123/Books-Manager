const db = require('../models/db');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { logUserActivity } = require('../services/activityLogger');

exports.purchaseBook = (req, res) => {
    const { bookId, userDetails } = req.body;
    const userId = req.user.id;
    const query = 'INSERT INTO purchases (userId, bookId, userDetails) VALUES (?, ?, ?)';

    db.query(query, [userId, bookId, JSON.stringify(userDetails)], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error purchasing book', error: err });

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
            subject: 'New Book Purchase',
            text: `User with ID ${userId} purchased book ID ${bookId}. Details: ${JSON.stringify(userDetails)}`,
        };

        transporter.sendMail(mailOptions, (emailErr, info) => {
            if (emailErr) console.error('Error sending email:', emailErr);
        });
        logUserActivity(req.user.id,`Purchased Book`)
        res.status(201).json({ message: 'Book purchased successfully' });
    });
};


exports.getBooks = (req, res) => {
    const query = 'SELECT * FROM books WHERE status = "approved"';
    
    db.query(query, (err, result) => {
        if (err) return res.status(500).json({ message: 'Error retrieving books', error: err });
        res.status(200).json(result);
    });
};
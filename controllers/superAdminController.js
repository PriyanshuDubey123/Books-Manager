const db = require('../models/db');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

exports.addUser = (req, res) => {
    const { name, email, password, role } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const query = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';

    db.query(query, [name, email, hashedPassword, role], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error adding user', error: err });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to the System',
            text: `Your account has been created with role: ${role}`,
        };

        transporter.sendMail(mailOptions, (emailErr, info) => {
            if (emailErr) console.error('Error sending email:', emailErr);
        });

        res.status(201).json({ message: `${role} added successfully` });
    });
};

exports.approveBook = (req, res) => {
    const bookId = req.params.id;
    const query = 'UPDATE books SET status = ? WHERE id = ?';

    db.query(query, ['approved', bookId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error approving book', error: err });
        res.status(200).json({ message: 'Book approved successfully' });
    });
};

exports.rejectBook = (req, res) => {
    const bookId = req.params.id;
    const { reason } = req.body;
    const query = 'UPDATE books SET status = ? WHERE id = ?';

    db.query(query, ['rejected', bookId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error rejecting book', error: err });

        const queryAdmin = 'SELECT u.email FROM users u JOIN books b ON u.id = b.createdBy WHERE b.id = ?';
        db.query(queryAdmin, [bookId], (adminErr, adminResult) => {
            if (adminErr || adminResult.length === 0) return;
            const adminEmail = adminResult[0].email;

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: adminEmail,
                subject: 'Book Rejection Notice',
                text: `Your book submission was rejected. Reason: ${reason}`,
            };

            transporter.sendMail(mailOptions, (emailErr, info) => {
                if (emailErr) console.error('Error sending email:', emailErr);
            });
        });

        res.status(200).json({ message: 'Book rejected and admin notified' });
    });
};
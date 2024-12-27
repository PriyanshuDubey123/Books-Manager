const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const connection = require('../models/db'); 
const nodemailer = require('nodemailer');
const { logUserActivity } = require('../services/activityLogger');

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  connection.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email:user.email,role:user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    connection.query(
      'UPDATE users SET session_token = ? WHERE id = ?',
      [token, user.id],
      (updateErr) => {
        if (updateErr) return res.status(500).json({ message: 'Failed to update session token' });

        logUserActivity(user.id,`${user.name} [role: ${user.role}] Logged in`)
        res.json({ message: 'Login successful', token });
      }
    );
  });
};


exports.logoutUser = (req, res) => {
    const userId = req.user.id;
  
    connection.query('UPDATE users SET session_token = NULL WHERE id = ?', [userId], (err) => {
      if (err) return res.status(500).json({ message: 'Failed to logout' });
      logUserActivity(userId, 'User Logged out');
      res.json({ message: 'Logout successful' });
    });
  };


  exports.createSuperAdmin = async (req, res) => {
    const name = process.env.SUPERADMIN_NAME;
    const email = process.env.SUPERADMIN_EMAIL;
    const password = process.env.SUPERADMIN_PASSWORD;
    const  role  = 'superadmin';
  
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
  
      connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role],
        (err, results) => {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              return res.status(400).json({ message: 'name or email already exists' });
            }
            return res.status(500).json({ message: 'Database error', error: err });
          }
  
          res.status(201).json({ message: 'Super Admin created successfully', userId: results.insertId });
        }
      );
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };

  exports.forgotPassword = (req, res) => {
    const { email } = req.body;
    const query = 'SELECT id FROM users WHERE email = ?';

    connection.query(query, [email], (err, result) => {
        if (err || result.length === 0) return res.status(404).json({ message: 'User not found' });
        const userId = result[0].id;
        const name = result[0].name;
        const role = result[0].role;
        const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

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
            subject: 'Password Reset Request',
            text: `Use this token to reset your password: ${token}`,
        };

        transporter.sendMail(mailOptions, (emailErr, info) => {
          if (emailErr) console.error('Error sending email:', emailErr);
        });
        logUserActivity(userId,`${name} [role: ${role}] requested for password reset mail`)
        res.json({ message: 'Password Reset Mail Sent', token });
    });
};


exports.resetPassword = (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
          return res.status(400).json({ message: 'Invalid or expired token' });
      }

      const userId = decoded.id;

      bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
          if (hashErr) {
              return res.status(500).json({ message: 'Error hashing password', error: hashErr });
          }

          const query = 'UPDATE users SET password = ? WHERE id = ?';
          connection.query(query, [hashedPassword, userId], (dbErr, result) => {
              if (dbErr) {
                  return res.status(500).json({ message: 'Error updating password', error: dbErr });
              }
        logUserActivity(userId,`User resets the password`)
              res.status(200).json({ message: 'Password updated successfully' });
          });
      });
  });
};
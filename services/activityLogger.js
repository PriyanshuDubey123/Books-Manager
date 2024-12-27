
const connection = require('../models/db'); 

exports.logUserActivity = (userId, action) => {
    const query = 'INSERT INTO user_activity (userId, action) VALUES (?, ?)';
    connection.query(query, [userId, action], (err, result) => {
        if (err) {
            console.error('Error logging user activity:', err);
        } else {
            console.log('User activity logged:', { userId, action });
        }
    });
};



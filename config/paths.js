const path = require('path');

// Anchored to this file's location — always Backend/public/uploads
module.exports = {
    uploadsDir: path.join(__dirname, '..', 'public', 'uploads'),
};
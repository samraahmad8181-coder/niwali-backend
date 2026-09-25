require('dotenv').config();
const app = require('./src/app')
const pool = require('./src/db/db')
pool;
app.listen(3000, () => {
    console.log('server is running on port 3000');

})
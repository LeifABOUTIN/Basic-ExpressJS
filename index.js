const express = require('express');
const app = express();
const port = 4000;
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

//DB connection
mongoose.connect( 
    process.env.DB_CONNECT,
    { useNewUrlParser: true },
    () => console.log('Connection to database completed!'))


//importing Routes
const authRoutes = require('./routes/auth')
//Middleware
app.use(express.json());
//Middlewares Routes
app.use('/api/user', authRoutes)

app.listen(port, () => console.log('Server is up.'))
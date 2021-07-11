const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const fileupload = require('express-fileupload');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const cookieParser = require('cookie-parser');
//load env vars
dotenv.config({path: './config/config.env'});

//Connect to database
connectDB();

//Route files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');

const app = express();

//Body parser
app.use(express.json());

// Cookie Parser
app.use(cookieParser());

// Dev logging middleware
if(process.env.NODE_ENV=='development'){
    app.use(morgan('dev'));
}

//File Uploading middleware
app.use(fileupload());

//Set static folder
app.use(express.static(path.join(__dirname, 'public')));

//Mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`))

//Handle unhandle promise rejections
process.on('unhandledRejection', (err, promise) =>{
    console.log(`Error: ${err.message}`);
    //Close Server & exit process
    server.close(()=> process.exit(1));
})


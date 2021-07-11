const mongoose = require('mongoose');
const fs = require('fs');

const dotenv = require('dotenv');
dotenv.config({path: './config/config.env'});

// Load Model
const Bootcamp  = require('./models/Bootcamp');
const Course  = require('./models/Course');
const User  = require('./models/User');

//Connect to DB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser : true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
});

const bootcamps = JSON.parse(fs.readFileSync(`${__dirname}/_data/bootcamps.json`, 'utf-8'));

const courses = JSON.parse(fs.readFileSync(`${__dirname}/_data/courses.json`, 'utf-8'));

const users = JSON.parse(fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8'));

//Import into DB
const importData = async ()=>{
    try{
        await Bootcamp.create(bootcamps);
        await Course.create(courses);
        await User.create(users);
        console.log('Data imported...');
        process.exit();
    }catch(err){
        console.error(err);
    }
}

//Delete Data in DB
const deleteData = async ()=>{
    try{
        await Bootcamp.deleteMany();
        await Course.deleteMany();
        await User.deleteMany();
        console.log('Data destroyed...');
        process.exit();
    }catch(err){
        console.error(err);
    }
}

if(process.argv[2]=='-i'){
    importData();
}else if(process.argv[2]=='-d'){
    deleteData();
}
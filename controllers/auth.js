const ErrorResponse = require('../utils/errorReponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');

// @desc Register User
// @route POST /api/v1/auth/register
// @access Public
exports.register = asyncHandler(async(req, res, next)=>{

    const {name, email, password, role} = req.body;

    //Create user
    const user = await User.create({
        name, email,password, role 
    });
    
    // Create token
    const token = user.getSignedJwtToken();
    
    res.status(200).json({success: true, user, token})
})

// @desc Login User
// @route POST /api/v1/auth/login
// @access Public
exports.login = asyncHandler(async(req, res, next)=>{

    const {email, password} = req.body;

    // Validate email and password
    if(!email || !password){
        return next(new ErrorResponse('Please provide and email & password', 400))
    }
    
    // Check for user
    const user  = await User.findOne({email: email}).select('+password');
    
    if(!user){
        return next(new ErrorResponse('Email can not registered yet.', 401));
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if(!isMatch){
        return next(new ErrorResponse('Invalid Password.', 401));
    }
    
    // Create token
    const token = user.getSignedJwtToken();
    
    res.status(200).json({success: true, user, token})
})
const ErrorResponse = require('../utils/errorReponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc Register User
// @route POST /api/v1/auth/register
// @access Public
exports.register = asyncHandler(async(req, res, next)=>{

    const {name, email, password, role} = req.body;
    
    //Create user
    const user = await User.create({
        name, email,password, role 
    });
    
    sendTokenResponse(user, 200, res);
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
    
    // res.status(200).json({success: true});
    // Create token
    sendTokenResponse(user, 200, res);
  
});

const sendTokenResponse = (user, statusCode, res) =>{
    const token = user.getSignedJwtToken();
    const options = {
         expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE*24*60*60*1000),
         httpOnly: true
    }

    if(process.env.NODE_ENV=='production'){
        options.secure = true;
    }

    res.status(statusCode).cookie('token', token, options).json({success: true, token});
    
}


// @desc User Info
// @route POST /api/v1/auth/me
// @access Private
exports.getMe = asyncHandler(async(req, res, next)=>{

    const user = await User.findById(req.user.id);

    res.status(200).json({success: true, data: user});

});


// @desc Forgot Password
// @route POST /api/v1/auth/forgotpassword
// @access Public
exports.forgotPassword = asyncHandler(async(req, res, next)=>{

    const user = await User.findOne({email: req.body.email});

    if(!user){
        return next(new ErrorResponse('There is no user with that email', 404));
    }

    //Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({validateBeforeSave: false});

    //Create reset url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. click the link to reset your password \n\n ${resetUrl}`;

    try {
        await sendEmail({email: user.email, subject: 'Password reset token', message});

         res.status(200).json({success: true, data: 'Password reset email has been sent'});
        
    } catch (err) {
        console.log(err);
        user.resetPasswordToken = '';
        user.resetPasswordExpire = '';
    }

    await user.save({validateBeforeSave: false});
    
    return next(new ErrorResponse('Email could not be sent', 500));

});



// @desc Reset Password
// @route POST /api/v1/auth/resetpassword/:resetToken
// @access Public
exports.resetPassword = asyncHandler(async(req, res, next)=>{
    // Get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

    const user = await User.findOne({resetPasswordToken, resetPasswordExpire: {$gt: Date.now()}});

    if(!user){
        return next(new ErrorResponse('Invalid token or link has been expired', 400));
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = '';
    user.resetPasswordExpire = '';

    await user.save();
    
    sendTokenResponse(user, 200, res);

});



// @desc Update user details
// @route PUT /api/v1/auth/updatedetails
// @access Private
exports.updateDetails = asyncHandler(async(req, res, next)=>{

    const fieldsToUpdate = {
        name: req.body.name,
        email: req.body.email
    }  

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {new: true, runValidators: true});

    res.status(200).json({success: true, data: user});

});



// @desc Update Password
// @route PUT /api/v1/auth/updatepassword
// @access Private
exports.updatePassword = asyncHandler(async(req, res, next)=>{

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if(!(await user.matchPassword(req.body.currentPassword))){
        return next(new ErrorResponse('Password is incorrect', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
    
});
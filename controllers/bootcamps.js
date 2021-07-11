const path = require('path');
const ErrorResponse = require('../utils/errorReponse');
const Bootcamp = require('../models/Bootcamp');
const geocoder = require('../utils/geocoder');
const asyncHandler = require('../middleware/async');

// @desc Get all bootcamps
// @route GET /api/v1/bootcamps
// @access Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
});

// @desc Get single bootcamps
// @route GET /api/v1/bootcamps/:id
// @access Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
    
        const bootcamp = await Bootcamp.findById(req.params.id);
        if (!bootcamp) {
            return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({ success: true, data: bootcamp });
});

// @desc Create new bootcamp
// @route POST /api/v1/bootcamps
// @access Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
    //Add user to req,body
        req.body.user = req.user.id;

        //Check for published bootcamp
        const publishedBootcamp = await Bootcamp.findOne({user: req.user.id});

        //If the user is not an admin, they can only add one bootcamp
        if(publishedBootcamp && req.user.role!='admin'){
            return next(new ErrorResponse(`The user with ID ${req.user.id} has already published a bootcamp`, 400));
        }
        
        const bootcamp = await Bootcamp.create(req.body);
        res.status(201).json({ success: true, data: bootcamp })
})

// @desc Update bootcamp
// @route PUT /api/v1/bootcamps/:id
// @access Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
        const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        })
        if (!bootcamp) {
            return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
        }
        res.status(200).json({ success: true, data: bootcamp });
})

// @desc Delete bootcamp
// @route DELETE /api/v1/bootcamps/:id
// @access Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
        const bootcamp = await Bootcamp.findById(req.params.id);
        if (!bootcamp) {
            return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
        }

        bootcamp.remove();

        res.status(200).json({ success: true, data: {} });
});

// @desc Get bootcamp within radius
// @route GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access Public
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
        const {zipcode, distance} = req.params;
        // Get lat/lng from geocoder
        const loc = await geocoder.geocode(zipcode);     
        const lat = loc[0].latitude;
        const lng = loc[0].longitude;

        //Calc radius using radians
        //Divide distance by radius of earth
        //Earth radius 3963 mi/6378 km
        const radius = distance/6378;

        const bootcamps = await Bootcamp.find({
            location: {$geoWithin: {$centerSphere: [[lng, lat], radius]}}
        })

        res.status(200).json({ success: true, data:bootcamps});
        
});

// @desc Upload photo for bootcamp
// @route PUT /api/v1/bootcamps/:id/photo
// @access Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }
    
    if(!req.files){
        return next(new ErrorResponse(`Please upload a file`, 400));
    }
    
    const file = req.files.file;
    if(!file.mimetype.startsWith('image')){
        return next(new ErrorResponse(`Please upload an image file`, 400));
    }
    
    //Check filesize
    if(file.size > process.env.MAX_FILE_UPLOAD){
        return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 400));
    }
    
    // Create custom filename
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;
    
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err=>{
        if(err){
            console.error(err);
            return next(new ErrorResponse(`Problem with file upload`, 500));
        }

        await Bootcamp.findByIdAndUpdate(req.params.id, {photo: file.name});        
        res.status(200).json({ success: true, data: file.name });
    })
    
});
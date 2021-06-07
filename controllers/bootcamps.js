const ErrorResponse = require('../utils/errorReponse');
const Bootcamp = require('../models/Bootcamp');
const geocoder = require('../utils/geocoder');
const asyncHandler = require('../middleware/async');

// @desc Get all bootcamps
// @route GET /api/v1/bootcamps
// @access Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
    let query;

    const reqQuery = {...req.query};

    const removeFields = ['select', 'sort', 'limit', 'page'];
    removeFields.forEach(param => delete reqQuery[param])
    
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match=>  `$${match}`);
    
    query = Bootcamp.find(JSON.parse(queryStr)).populate('courses')
    
    if(req.query.select){
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    if(req.query.sort){
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    }else{
        query = query.sort('createdAt')
    }

    //Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const startIndex = (page-1) * limit;
    const endIndex = page * limit;
    const total = await Bootcamp.countDocuments();

    console.log('total :>> ', total);
    
    query = query.skip(startIndex).limit(limit);
    
    const bootcamps = await query;

    //Pagination result
    const pagination = {};

    if(endIndex<total){
        pagination.next = {
            page: page + 1,
            limit
        };
    }

    if(startIndex>0){
        pagination.prev = {
            page: page - 1,
            limit
        };
    }
    
    res.status(200).json({ success: true, pagination, data: bootcamps, count: bootcamps.length });
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
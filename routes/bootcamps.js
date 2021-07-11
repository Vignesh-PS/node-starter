const express = require('express');
const { getBootcamps, getBootcamp, createBootcamp, updateBootcamp, deleteBootcamp, getBootcampsInRadius, bootcampPhotoUpload } = require('../controllers/bootcamps');

const Bootcamp = require('../models/Bootcamp');
const advancedResults = require('../middleware/advancedResults');

// Include other resource routers
const courseRouter = require('./courses');
const router = express.Router();
const {protect, authorize} = require('../middleware/auth');

//Re-route into other resource routers
router.use('/:bootcampId/courses', courseRouter)

router.route('/')
    .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
    .post(protect, authorize('admin', 'publisher'), createBootcamp);

router.route('/:id')
    .get(getBootcamp)
    .put(protect, authorize('admin', 'publisher'), updateBootcamp)
    .delete(protect, authorize('admin', 'publisher'), deleteBootcamp);

router.route('/radius/:zipcode/:distance')
    .get(getBootcampsInRadius);

router.route('/:id/photo').put(protect, bootcampPhotoUpload)
    
module.exports = router;
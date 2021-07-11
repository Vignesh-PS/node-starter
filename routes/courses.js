const express = require('express');
const { getCourses, getCourse, createCourse, updateCourse,deleteCourse } = require('../controllers/courses');
const {protect, authorize} = require('../middleware/auth');

const Course = require('../models/Course');

const advancedResults = require('../middleware/advancedResults');

const router = express.Router({mergeParams: true});

router.route('/').get(advancedResults(Course, {path: 'bootcamp', select: 'name description'}), getCourses).post(protect, authorize('admin', 'publisher'), createCourse);

router.route('/:id').get(getCourse).put(protect, authorize('admin', 'publisher'), updateCourse).delete(protect, deleteCourse)

module.exports = router;
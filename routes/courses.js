const express = require('express');
const { getCourses, getCourse, createCourse, updateCourse,deleteCourse } = require('../controllers/courses');

const Course = require('../models/Course');

const advancedResults = require('../middleware/advancedResults');

const router = express.Router({mergeParams: true});

router.route('/').get(advancedResults(Course, {path: 'bootcamp', select: 'name description'}), getCourses).post(createCourse);

router.route('/:id').get(getCourse).put(updateCourse).delete(deleteCourse)

module.exports = router;
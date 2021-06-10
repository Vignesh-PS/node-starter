const ErrorHandler = require('../utils/errorReponse');

const errorHandler = (err, req, res, next)=>{
        let error = {...err};
                
        //Mongoose Invalid Id
        if(err.name=='CastError'){
            const message = `Bootcamp not found with id of ${err.value}`;
            error = new ErrorHandler(message, 404);
        }

        //Mongoose duplicate key
        if(err.code===11000){
            const message = `Duplicates fields entered`;
            error = new ErrorHandler(message, 400);
        }

        if(err.name=='ValidationError'){
            const message = Object.values(err.errors).map(val => val.message);
            error = new ErrorHandler(message, 400)
        }
        
        
        res.status(err.statusCode || 500).json({success: false, error: err.message || 'Server error'});
}

module.exports = errorHandler;
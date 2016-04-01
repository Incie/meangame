var Response = {};

Response.success = function(message){
    return {
        success: true,
        message: message
    }
};

Response.ok = function(object){
    return {
        success: true,
        data: object
    }
};

Response.error = function(message){
    return {
        success: false,
        error: message
    }
};

Response.fail = Response.error;

module.exports = Response;

var Response = {};

Response.success = function(message){
    return {
        success: true,
        message: message
    }
};

Response.error = function(message){
    return {
        success: false,
        error: message
    }
};

module.exports = Response;

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

Response.shouldUpdate = function(shouldUpdate) {
    return {update: shouldUpdate};
};

Response.doNotUpdate = Response.shouldUpdate(false);

Response.message = {
    GAMEIDNOTFOUND: 'Game ID not found.',
    INVALIDPLAYERNAME: 'Invalid player name'
};

module.exports = Response;

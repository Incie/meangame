var mongojs = require('mongojs');
var db = mongojs('samuraigame', ['samuraigame']);


var gamedb = {};

gamedb.createGame = function( gameObject, callback ){
    db.samuraigame.insert( gameObject, function(err, docs){
        if( err ){
            callback({success: false, message: err });
            return;
        }

        var gameId = gameObject.gameid;
        var response = {success: true, message: 'game created', gameid: gameId };
        callback(response);
    });
};

module.exports.gamedb = gamedb;
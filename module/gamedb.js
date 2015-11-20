var mongojs = require('mongojs');
var db = mongojs('samuraigame', ['samuraigame']);


var gamedb = {};

gamedb.createGame = function( response, gameObject ){
    db.samuraigame.insert( gameObject, function(docs, err){
        if( err ){
            response.send({success: false, message: err });
            return;
        }

        response.send({success: true, message: 'game created', gameid: gameObject.gameid });
    });
};



module.exports.gamedb = gamedb;
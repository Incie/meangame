var mongojs = require('mongojs');
var db = mongojs('samuraigame', ['samuraigame']);


var gamedb = {};

gamedb.getGameInfoFor = function(gameid, callback){
    db.samuraigame.find({gameid:gameid}, {map:1, roomName: 1, mapName: 1, playerTurn: 1, status: 1, numPlayers: 1, _id: 0}, function(err, docs){
        if( err ){
            callback({success: false, error: err});
            return;
        }

        callback({success: true, game: docs[0] });
    });
};

gamedb.getGameStatus = function(gameid, callback){
    db.samuraigame.find({gameid: gameid}, {map:0, _id:0}, function(err, docs) {
        if (err) {
            callback({success: false, message: err});
            return;
        }

        callback({success: true, gameObject: docs[0]});
    });
};

gamedb.getAllGames = function(callback){
    db.samuraigame.find({}, {roomName:1, numPlayers:1, gameid: 1}, function(err,docs){
        if( err ){
            callback({success: false, message: err});
            return;
        }

        callback({success: true, games: docs});
    });
};

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

gamedb.registerNewPlayer = function( gameId, playerName, callback ){
    db.samuraigame.find({gameid: gameId}, function(err, docs){
        if( err ) {
            callback({success: false, message: err});
            return;
        }

        if( docs.length == 0 ){
            callback({success: false, message: 'invalid gameid'});
            return;
        }

        var gameObject = docs[0];

        var players = gameObject.players;
        var freePlayerIndex = -1;
        for( var i = 0; i < players.length; i += 1 ){
            //TODO: Check Duplicate names

            if( players[i].name === 'unassigned' ){
                freePlayerIndex = i;
                break;
            }
        }

        if( freePlayerIndex === -1 ){
            callback({success: false, message: 'room full'});
            return;
        }

        var updateStatement = { $set: {}};
        updateStatement.$set['players.'+freePlayerIndex+'.name'] = playerName;

        if( (freePlayerIndex+1) == gameObject.numPlayers ) {
            updateStatement.$set['status'] = 'game started';
        }

        db.samuraigame.update({gameid: gameId}, updateStatement, function(err, docs){
            if( err ){
                callback({success:false, message: 'error trying to add player to game, ' + err});
                return;
            }

            if( docs.length === 0 ){
                callback({success: false, message: 'error adding player to game; game not found'})
                return;
            }

            callback({success: true, message: 'game joined'});
        });
    });
};

module.exports.gamedb = gamedb;
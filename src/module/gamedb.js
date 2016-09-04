var response = require('./response');
var mongojs = require('mongojs');
var db = mongojs('samuraigame', ['samuraigame']);


var gamedb = {};

gamedb.getAvailableGames = function( callback ){
    const query = { status: 'waiting for players' };
    const limitFields = {
        numPlayers: 1,
        roomName: 1,
        mapName: 1,
        gameid: 1,
        _id: 0
    };

    db.samuraigame.find(query, limitFields, (err, docs) => {
        if( err ){
            callback( response.fail(err) );
            return;
        }

        callback( response.ok(docs) );
    });
};

gamedb.getMyGames = function( userId, callback ){
    const query = { players: { $elemMatch: { _id: userId }}};
    const limitFields = {
        roomName: 1,
        numPlayers: 1,
        mapName: 1,
        gameid: 1,
        _id: 0
    };

    db.samuraigame.find(query, limitFields, (err, docs) => {
        if( err ){
            callback( response.fail(err));
            return;
        }

        callback( response.ok(docs) );
    });
};

gamedb.getGameInfoFor = function(gameid, userId, callback){
    const limitFields = {map:1, roomName: 1, mapName: 1, playerTurn: 1, status: 1, numPlayers: 1, players: 1, turnCounter: 1, state: 1, moveList: 1, gameid: 1, endGameState: 1, _id: 0};
    db.samuraigame.find({gameid:gameid}, limitFields, function(err, docs){
        if( err ){
            callback({success: false, error: err});
            return;
        }

        var gameObject = docs[0];
        if( gameObject === undefined ){
            callback( {success: false, error: 'gameobject undefined'});
            return;
        }

        var game = {};
        gameObject.players.forEach( function(player) {
            if( player._id === userId ) {
                game['player'] = {};
                game.player.name = player.name;
                game.player.hand = player.hand;
                game.player.color = player.color;
                game.player.turn = player.turn;
            }
        });

        if( game.player === undefined ){
            callback({success: false, error: 'player not found'});
            return;
        }

        game.map = gameObject.map;
        game.roomName = gameObject.roomName;
        game.mapName = gameObject.mapName;
        game.playerTurn = gameObject.playerTurn;
        game.status = gameObject.status;
        game.numPlayers = gameObject.numPlayers;
        game.turnCounter = gameObject.turnCounter;
        game.state = gameObject.state;
        game.moveList = gameObject.moveList;
        game.gameid = gameObject.gameid;

        if( gameObject.endGameState !== undefined )
            game.endGameState = gameObject.endGameState;

        callback({success: true,  game: game});
    });
};

gamedb.importGameObject = function(gameObject, callback){
    db.samuraigame.insert( gameObject, function(err){
        if( err ){
            callback(response.fail(err));
            return;
        }

       callback(response.success("game imported"));
    })
};

gamedb.getGameObject = function(gameid, callback){
    db.samuraigame.find({gameid:gameid}, function(err, docs){
        if( err ) {
            callback({success: false, error: err});
            return;
        }

        if( docs.length === 0 ){
            callback(response.fail('game not found'));
            return;
        }

        callback({success: true, game: docs[0]});
    });
};

gamedb.updateGameObject = function(gameObject, callback){
    db.samuraigame.update({_id: gameObject._id}, gameObject, function(err){
        if( err ){
            callback({success: false, error: err});
            return;
        }

        return callback({success: true, message: 'yay' });
    });
};

gamedb.deleteGameObject = function(gameid, callback){
    if( gameid === undefined ) {
        callback({success: false, error: 'Cant delete'});
        return;
    }

    db.samuraigame.remove({gameid:gameid}, function(err){
        if( err ){
            callback({success: false, error: err});
            return;
        }

        callback({success: true, message: 'deleted game: '+gameid});
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
    db.samuraigame.insert( gameObject, function(err){
        if( err ){
            callback({success: false, message: err });
            return;
        }

        var gameId = gameObject.gameid;
        var response = {success: true, message: 'game created', gameid: gameId };
        callback(response);
    });
};

gamedb.registerNewPlayer = function( gameId, playerName, userId, callback ){
    db.samuraigame.find({gameid: gameId}, function(err, docs){
        if( err ) {
            callback({success: false, message: err});
            return;
        }

        if( docs.length === 0 ){
            callback({success: false, message: 'invalid gameid'});
            return;
        }

        var gameObject = docs[0];

        var players = gameObject.players;
        var freePlayerIndex = -1;
        for( var i = 0; i < players.length; i += 1 ){
            if( players[i]._id === userId ){
                callback({success: false, message: 'You are already in the game'});
                return;
            }

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
        updateStatement.$set['players.'+freePlayerIndex+'._id'] = userId;
        updateStatement.$set['state.'+freePlayerIndex+'.player'] = playerName;

        if( (freePlayerIndex+1) === gameObject.numPlayers ) {
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

            console.log('Player '+playerName+' joined game ' + gameId);
            callback({success: true, message: 'game joined'});
        });
    });
};

module.exports = gamedb;
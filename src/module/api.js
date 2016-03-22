var samurai = require('./samurai').samurai;
var db = require('./database').dbModule;
var gamedb = require('./gamedb').gamedb;
var validate = require('validator');

var API = {};

API.createGame = function(req, res){
    console.log('gamecreate, incoming data: ' + req.body);
    var gameInfo = req.body;

    //Validate
    if( !validate.isInt(gameInfo.numPlayers, {min: 2, max:4}) ){
        res.send({success: false, message: 'Num players must be a number between 2 and 4'});
        return;
    }

    //Validate stringlengths
    validate.escape(gameInfo.roomName);
    validate.escape(gameInfo.ownerName);
    validate.escape(gameInfo.mapName);

    db.getMap(gameInfo.mapName, function(mapObject){
        console.log('getmap');

        if( !mapObject.success ) {
            console.log('getmap failed' + mapObject);
            res.send(mapObject);
            return;
        }

        samurai.createGame(gameInfo, mapObject.mapData, function(gameObject){
            console.log('create game');

            gamedb.createGame(gameObject, function(responseObject){
                console.log('gamedb createGame' + responseObject);
                res.send(responseObject);
            });
        });
    });
};


API.adminGetGameStatus = function(req, res){
    gamedb.getGameStatus(req.params.gameid, function(responseObject){
        res.send(responseObject);
    });
};

API.adminGetGames = function(req,res){
    gamedb.getAllGames( function(gameList){
        console.log(gameList);
        res.send(gameList);
    });
};

API.adminDeleteGame = function(req, res){
    var gameid = req.params.gameid;
    gamedb.deleteGameObject(gameid, function(status){
        res.send(status);
    });
};


API.joinGame = function(req, res){
    var gameId = req.params.gameid;
    var playerName = req.body.playerName;

    console.log( gameId, playerName );

    if( playerName === undefined ){
        //send a join page form?
        res.send({success: false});
        return;
    }

    gamedb.registerNewPlayer(gameId, playerName, function(gameObject){
        res.send(gameObject);
    });
};

//req.body.moves = [ {x,y,suite,size} ... ]
API.gameTurn = function(req, res){
    var gameid = req.cookies['gameid'];
    var player = req.cookies['player-name'];
    var moves = req.body.moves;

    console.log('PROCESS GAME TURN');
    console.log('getting gameid' + gameid);
    gamedb.getGameObject(gameid, function(gameObject){
        if( !gameObject.success ) {
            console.log(gameObject);
            res.send(gameObject);
            return;
        }

        console.log('processing turn');
        samurai.processTurn(gameObject.game, player, moves, function(status){
            if( !status.success ) {
                console.log(status);
                res.send(status);
                return;
            }

            console.log('updating game object');
            gamedb.updateGameObject(status.game, function(update){
                if( !update.success ){
                    console.log('error', update);
                    res.send(update);
                    return;
                }

                console.log(update);
                res.send(update);
            });
        });
        // samurai
    });

    //get game
    // gameid not found?

    //this players turn?
    //validate move?

    //register move
    //check board-state
    // change occupied cities if needed

    //remove used drawn tiles
    //draw new tiles
};

//req.params.gameid
//req.body.refreshData = {true/false}
//req.body.hasTurn = {integer}
API.getGameInfo = function(req, res){
    var gameid = req.cookies['gameid'];
    var player = req.cookies['player-name'];
    gamedb.getGameInfoFor(gameid, player, function(responseObject){
        res.send(responseObject);
    });
};

API.getMapList = function(req, res){
    console.log('/api/maps');
    db.getMapList(function(mapObject){
        res.send(mapObject);
    });
};

API.getMap = function(req, res) {
    var mapName = req.params.name;
    console.log(mapName);

    db.getMap(mapName, function (mapObject) {
        res.send(mapObject);
    });
};


API.saveOrUpdateMap = function(req, res){
    var mapData = req.body;
    db.saveOrUpdateMap(mapData, function(mapObject){
        res.send(mapObject);
    });
};


module.exports.api = API;

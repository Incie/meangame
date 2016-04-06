var samurai = require('./samurai');
var db = require('./database');
var gamedb = require('./gamedb');
var response = require('./response');
var validate = require('validator');

var API = {};

API.gameTick = function(req, res){
    let gameid = req.cookies['gameid'];
    let lastTurn = Number(req.cookies['lastTurn']);

    //TODO: validate

    gamedb.getGameObject(gameid, function(mapObject){
        let shouldUpdate = (mapObject.game.turnCounter != lastTurn);
        res.send({update:shouldUpdate});
    });
};

API.createGame = function(req, res){
    console.log('gamecreate, incoming data: ' + req.body);
    var gameInfo = req.body;

    //Validate
    if( !validate.isInt(gameInfo.numPlayers, {min: 2, max:4}) ){
        res.send( response.error('Num players must be a number between 2 and 4') );
        return;
    }

    gameInfo.roomName = validate.escape(gameInfo.roomName);
    gameInfo.ownerName = validate.escape(gameInfo.ownerName);
    gameInfo.mapName = validate.escape(gameInfo.mapName);

    db.getMap(gameInfo.mapName, function(mapObject){
        if( !mapObject.success ) {
            console.log('getmap failed', mapObject);
            res.send(mapObject);
            return;
        }

        mapObject.mapData.data = db.optimizeMapData(mapObject.mapData.data);

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

    console.log( 'player join game', gameId, playerName );
    if( playerName === undefined ){
        res.send(response.fail('Playername undefined'));
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

    console.log('--PROCESS GAME TURN--');
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
};

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


module.exports = API;

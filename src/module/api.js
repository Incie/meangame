var samurai = require('./samurai').samurai;
var db = require('./database').dbModule;
var gamedb = require('./gamedb').gamedb;
var validate = require('validator');

var API = {};


/**
 * request.body {
 *  gameObject {
 *  roomName
 *  ownerName
 *  mapName
 *  numPlayers
 *  isPrivate
 *  password
 *  }
 * }
 */
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

        var map = {}; //db.getMap
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


API.gameTurn = function(req, res){
    //send move as [ {x, y, type, num} ]

    res.send('abc');

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
    console.log('/api/game/'+req.params.gameid);

    res.send('nothing here yet');

    //look up game i
    //send board
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


API.saveMap = function(req, res){
    console.log('/api/maps/post');

    var mapData = req.body;
    db.saveMap(mapData, function(mapObject){
        res.send(mapObject);
    });
};


module.exports.api = API;

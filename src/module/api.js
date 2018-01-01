let samurai = require('./samurai');
let db = require('./database');
let gamedb = require('./gamedb');
let response = require('./response');
let validate = require('validator');

let API = {};

API.importMapJson = function(req, res){
	console.log('trying to import map');
    if( req.session.user.role !== 'admin' ){
        res.status(401).send({message: 'forbidden'});
        return;
    }

    if( req.body === undefined ){
        res.status(404).send({message:'json not found'});
        return;
    }	

    db.importJson(req.body, function(err){
        res.send({message: err});
    });
};

API.importGameJson = function(req, res){
    if( req.session.user.role !== 'admin' ){
        res.status(401).send({message: 'Not allowed'});
        return;
    }

    let gameObject = req.body;
    gameObject.gameid = "temp" + Math.floor(Math.random() * 1000000000);
    gamedb.importGameObject( gameObject, function(response){
        if( response.success ){
            res.send(response);
            return;
        }

        res.status(400).send(response);
    });
};

API.exportGameJson = function(req, res){
    if( req.session.user.role !== 'admin' ){
        res.status(401).send({message:'I can\'t allow that'});
        return;
    }

    const gameid = req.params['gameid'];
    gamedb.getGameObject(gameid, function(retObject){
        res.send(retObject);
    });
};


API.getAvailableGames = function(req, res){
    gamedb.getAvailableGames(function(availableGames){
        res.send(availableGames);
    });
};

API.getMyGames = function(req, res){
    const userId = req.session.user.id;
    gamedb.getMyGames(userId, function(availableGames){
        res.send(availableGames);
    });
};

API.gameTick = function(req, res){
    const gameid = req.params['gameid'];
    const lastTurn = Number(req.body['lastTurn']);

    //TODO: validate
    if( lastTurn === undefined){
        res.send(response.doNotUpdate);
        return;
    }

    gamedb.getGameObject(gameid, function(mapObject){
        if( !mapObject.success ){
            res.send( response.doNotUpdate );
            return;
        }


        const shouldUpdate = (mapObject.game.turnCounter !== lastTurn);
        res.send( response.shouldUpdate(shouldUpdate));
    });
};

API.createGame = function(req, res){
    //Validate
    if( !validate.isInt(req.body.numPlayers, {min: 2, max:4}) ){
        res.send( response.error('Num players must be a number between 2 and 4') );
        return;
    }
    let gameInfo = {};
    gameInfo.roomName = validate.escape(req.body.roomName);
    gameInfo.mapName = validate.escape(req.body.mapName);
    gameInfo.numPlayers = req.body.numPlayers;
    gameInfo.ownerName = req.session.user.name;
    gameInfo.ownerUserId = req.session.user.id;

    db.getMap(gameInfo.mapName, function(mapObject){
        if( !mapObject.success ) {
            console.log('getmap failed', mapObject);
            res.send(mapObject);
            return;
        }

        mapObject.mapData.data = db.optimizeMapData(mapObject.mapData.data);

        samurai.createGame(gameInfo, mapObject.mapData, function(gameObject){
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
    const gameid = req.params.gameid;
    gamedb.deleteGameObject(gameid, function(status){
        res.send(status);
    });
};


API.joinGame = function(req, res){
    const gameId = req.params.gameid;
    const userId = req.session.user.id;
    const playerName = req.session.user.name;

    if( playerName === undefined ){
        res.send(response.fail('Playername undefined'));
        return;
    }

    gamedb.registerNewPlayer(gameId, playerName, userId, function(gameObject){
        res.send(gameObject);
    });
};

API.gameTurn = function(req, res){
    const gameid = req.cookies['gameid'];
    const userId = req.session.user.id;
    const moves = req.body.moves;

    gamedb.getGameObject(gameid, function(gameObject){
        if( !gameObject.success ) {
            res.send(gameObject);
            return;
        }

        samurai.processTurn(gameObject.game, userId, moves, function(status){
            if( !status.success ) {
                console.log(status);
                res.send(status);
                return;
            }

            gamedb.updateGameObject(status.game, function(update){
                if( !update.success ){
                    res.send(update);
                    return;
                }

                res.send(update);
            });
        });
    });
};

API.getGameInfo = function(req, res){
    const gameid = req.cookies['gameid'];
    const userId = req.session.user.id;
    gamedb.getGameInfoFor(gameid, userId, function(responseObject){
        res.send(responseObject);
    });
};

API.getMapList = function(req, res){
    db.getMapList(function(mapObject){
        res.send(mapObject);
    });
};

API.getMap = function(req, res) {
    const mapName = req.params.name;
    db.getMap(mapName, function (mapObject) {
        res.send(mapObject);
    });
};


API.saveOrUpdateMap = function(req, res){
    if( req.session.user.role === "admin" ){
        res.status(401).send({message: "no"});
        return;
    }

    const mapData = req.body;
    db.saveOrUpdateMap(mapData, function(mapObject){
        res.send(mapObject);
    });
};


API.replayGame = function(req, res){
    const gameid = req.params['gameid'];
    if( gameid === undefined ) {
        res.send( response.fail('invalid gameid') );
        return;
    }

    gamedb.getGameObject(gameid, function(gameObject){
        res.send(gameObject);
    });
};

API.replayGameTo = function(req, res){
    res.send('nyi');
};

module.exports = API;

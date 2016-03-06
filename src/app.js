var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var validate = require('validator');

var samurai = require('./module/samurai').samurai;
var db = require('./module/database').dbModule;
var gamedb = require('./module/gamedb').gamedb;

var app = express();

//app.use(logger('dev'));
app.use(bodyParser.json({limit: '2mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '2mb'}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

var getAbsolutePath = function(relativePath){
    return path.join(__dirname, '/public/', relativePath);
};

var files = {
    index: getAbsolutePath('index.html'),
    editor: getAbsolutePath('editor.html')
};

app.get('/', function(req, res){
    console.log( 'get req on / ' + req.connection.remoteAddress );
    res.sendFile(files.index);
});

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
app.post('/game/create', function(req, res){
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
});

    //game/EKWALa/admin/status
app.get('/game/admin/status/:gameid', function(req, res){
    gamedb.getGameStatus(req.params.gameid, function(responseObject){
        res.send(responseObject);
    });
});

/*
    joinObject {
        playerName
        password
    }
 */
app.post('/game/join/:gameid', function(req, res){
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
});

app.post('/game/:gameid/turn', function(req, res){
    //send move as [ {x, y, type, num} ]


    //get game
    // gameid not found?

    //this players turn?
    //validate move?

    //register move
    //check board-state
    // change occupied cities if needed

    //remove used drawn tiles
    //draw new tiles
});

//req.params.gameid
//req.body.refreshData = {true/false}
//req.body.hasTurn = {integer}
app.get('/game/:gameid', function(req, res){
    console.log('/game/'+req.params.gameid);


    //look up game i
    //send board
});

app.get('/editor', function(req, res){
    console.log( 'get req on /editor ' + req.connection.remoteAddress );
    res.sendFile(files.editor);
});

app.get('/api/maps', function(req, res){
    console.log('/api/maps');
    db.getMapList(function(mapObject){
        res.send(mapObject);
    });
});

app.get('/api/maps/get/:name', function(req, res){
    var mapName = req.params.name;
    console.log(mapName);

    db.getMap(mapName, function(mapObject){
        res.send(mapObject);
    });
});

app.post('/api/maps/post', function(req, res){
    console.log('/api/maps/post');

    var mapData = req.body;
    db.saveMap(mapData, function(mapObject){
        res.send(mapObject);
    });
});

var port = (process.env.PORT || '3000')
app.listen(port, function() {
    console.log('listening on '+port);
});
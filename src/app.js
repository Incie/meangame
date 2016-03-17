var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var api = require('./module/api').api;

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json({limit: '2mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '2mb'}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

var getAbsolutePath = function(relativePath){
    return path.join(__dirname, '/public/', relativePath);
};

var files = {
    index: getAbsolutePath('index.html'),
    editor: getAbsolutePath('editor.html'),
    game: getAbsolutePath('game.html')
};

app.get( '/api/maps',                   api.getMapList);
app.post('/api/maps/post',              api.saveMap);
app.get( '/api/maps/get/:name',         api.getMap);

app.get( '/api/game/:gameid',               api.getGameInfo);
app.post('/api/game/:gameid/turn',          api.gameTurn);
app.post('/api/game/create',                api.createGame);
app.post('/api/game/join/:gameid',          api.joinGame);

app.get( '/api/game/admin/status/:gameid',  api.adminGetGameStatus);
app.get( '/api/game/admin/games',           api.adminGetGames);

app.get('/game/', function(req, res){
    res.sendFile(files.game);
});

app.get('/editor', function(req, res){
    console.log( 'get req on /editor ' + req.connection.remoteAddress );
    res.sendFile(files.editor);
});

app.get('/', function(req, res){
    console.log( 'get req on / ' + req.connection.remoteAddress );
    res.sendFile(files.index);
});


var port = (process.env.PORT || '3000')
app.listen(port, function() {
    console.log('listening on '+port);
});
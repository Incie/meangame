var express = require('express');
var path = require('path');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var api = require('./module/api');

var app = express();

app.use(morgan(':date[iso] - (HTTP :http-version :status :method) [ip] :remote-addr [time] :response-time[3] ms [response-size] :res[content-length] [url] :url'));
// app.use(morgan('dev'));
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

/**
app.all('*', api.Athenticate() )
 **/

app.get( '/api/maps',                   api.getMapList);
app.post('/api/maps/',                  api.saveOrUpdateMap);
app.get( '/api/maps/:name',             api.getMap);
app.delete('api/maps/:name',            function(res,req){res.send('NYI');});

app.post('/api/game/',                  api.createGame);
app.get('/api/game/tick',              api.gameTick);
app.get( '/api/game/:gameid',           api.getGameInfo);
app.put( '/api/game/:gameid',           api.gameTurn);
app.post('/api/game/:gameid',           api.joinGame);

app.get( '/api/game/admin/games',       api.adminGetGames);
app.delete('/api/game/admin/:gameid',   api.adminDeleteGame);
app.get( '/api/game/admin/:gameid',     api.adminGetGameStatus);

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


var port = (process.env.PORT || 3000);
app.listen(port, function() {
    console.log('Node Server ('+process.version+')');
    console.log('Listening on '+port);
    console.log('Platform: '+process.platform + ' '+process.arch+'('+process.pid+')');
    console.log('cwd: '+process.cwd() );
});
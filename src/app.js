var express = require('express');
var path = require('path');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var users = require('./module/users');

var api = require('./module/api');

var app = express();

app.use(morgan(':date[iso] - (HTTP :http-version :status :method) [ip] :remote-addr [time] :response-time[3] ms [response-size] :res[content-length] [url] :url'));

app.use(bodyParser.json({limit: '2mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '2mb'}));
app.use(cookieParser());
app.use( session({
    secret: process.env.SECRET,
    resave: true,
    maxAge: 2 * 60 * 60 * 1000,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, 'public')));

var getAbsolutePath = function(relativePath){
    return path.join(__dirname, '/public/', relativePath);
};

var files = {
    index: getAbsolutePath('samurai.html'),
    editor: getAbsolutePath('editor.html'),
    game: getAbsolutePath('game.html'),
    replay: getAbsolutePath('gamereplay.html'),
    login: getAbsolutePath('login.html'),
    signup: getAbsolutePath('signup.html')
};

app.get('/', function(req, res){
    console.log( 'get req on / ' + req.connection.remoteAddress );
    req.session.slash = (req.session.slash || 0) + 1;
    console.log(req.session);
    console.log(req.cookies['gameid']);
    res.sendFile(files.index);
});

app.get('/game/', function(req, res){
    res.sendFile(files.game);
});

app.get('/editor', function(req, res){
    console.log( 'get req on /editor ' + req.connection.remoteAddress );
    res.sendFile(files.editor);
});

app.get('/replay', function(req, res){
    res.sendFile(files.replay);
});

app.get('/login', function(req, res){
    res.sendFile(files.login);
});

app.get('/signup', function(req, res){
    res.sendFile(files.signup);
});

app.post('/api/login', function(req, res){
    users.login( req.body )
        .then( function(userObject){
            console.log('authenticated user', userObject.user);
            req.session.authenticated = true;
            req.session.user = {
                id: userObject.id,
                name: userObject.name
            };
            req.session.save( function(err){
                res.send( {ok:'ok'});
            });
        })
        .catch(function(message){
            req.session.destroy( function(err){
                res.status(401).send( {message:"incorrect"} );
            });
        });
});

app.post('/api/signup', function(req, res){
    let user = req.body.user;
    let password = req.body.pass;
    let name = req.body.name;

    //validate, escape

    users.registerUser(user, password, name)
        .then( msg => {
            if( msg ){
                res.status(400).send({message: msg });
                return;
            }

            res.status(200).send();
        })
        .catch( msg => {
            res.status(400).send({message:msg});
        });
});


app.all('*', function(req, res, next){
    if( req.session.authenticated ){
        next();
        return;
    }

    res.status(401).send({message:'forbidden'});
});

/**
app.all('*', api.Athenticate() )
 **/

app.get( '/api/maps',                   api.getMapList);
app.post('/api/maps/',                  api.saveOrUpdateMap);
app.get( '/api/maps/:name',             api.getMap);
app.delete('api/maps/:name',            (req,res) => {res.send('NYI');});

app.get('/api/lobby/available',          api.getAvailableGames );
app.post('/api/lobby/mygames',            api.getMyGames );

app.post('/api/game/',                  api.createGame);
app.post('/api/game/:gameid/tick',       api.gameTick);
app.get( '/api/game/:gameid',           api.getGameInfo);
app.put( '/api/game/:gameid',           api.gameTurn);
app.post('/api/game/:gameid',           api.joinGame);

app.get('/api/game-replay/:gameid',         api.replayGame);
app.put('/api/game-replay/:gameid/:turnid', api.replayGameTo);

app.get(   '/api/game/admin/games',     api.adminGetGames);
app.delete('/api/game/:gameid/admin',   api.adminDeleteGame);
app.get(   '/api/game/:gameid/admin',   api.adminGetGameStatus);

app.get('/whoami', function(req, res){
    res.status(200).send({name:req.session.user.name});
});

app.all('*', function(req, res){
    res.status(404).send({message:'The hamster did not find this route in the registry'});
});

var port = (process.env.PORT || 3001);
app.listen(port, function() {
    console.log('Node Server ('+process.version+')');
    console.log('Listening on '+port);
    console.log('Platform: '+process.platform + ' '+process.arch+'('+process.pid+')');
    console.log('cwd: '+process.cwd() );
});

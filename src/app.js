var express = require('express');
var path = require('path');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');

var apiRouter = require('./route/api.js');

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

app.get('/', function(req, res){res.sendFile(files.index);});
app.get('/game/', function(req, res){res.sendFile(files.game);});
app.get('/editor', function(req, res){res.sendFile(files.editor);});
app.get('/replay', function(req, res){res.sendFile(files.replay);});
app.get('/login', function(req, res){res.sendFile(files.login);});
app.get('/signup', function(req, res){res.sendFile(files.signup);});

app.use( '/api', apiRouter );

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

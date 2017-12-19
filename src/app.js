let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let session = require('express-session');
let bodyParser = require('body-parser');
let logging = require('./module/logging');

let apiRouter = require('./route/api.js');

let app = express();

logging.setupLogging(app);
app.use(logging.ipFilterMiddleware);

app.use(bodyParser.json({limit: '2mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '2mb'}));
app.use(cookieParser());

const TIME = { minute: 60 * 1000 };
let sessionConfig = {
    secret: process.env.SECRET,
    resave: false,
    proxy: true,
    maxAge: 120 * TIME.minute,
    saveUninitialized: false,
    cookie: { secure: true }
};

if( process.env.ENVIRONMENT === "DEVELOPMENT" ){
    console.log('Setting DEVELOPMENT session configs');
    sessionConfig.proxy = false;
    sessionConfig.cookie.secure = false;
}

app.use(session(sessionConfig));

app.use(express.static(path.join(__dirname, 'public')));

function getAbsolutePath(relativePath){
    return path.join(__dirname, '/public/', relativePath);
}

const files = {
    index: getAbsolutePath('samurai.html'),
    editor: getAbsolutePath('editor.html'),
    game: getAbsolutePath('game.html'),
    replay: getAbsolutePath('gamereplay.html'),
    login: getAbsolutePath('login.html'),
    signup: getAbsolutePath('signup.html')
};

app.post('/', function(req, res){
    if(process.env.ENVIRONMENT === 'DEVELOPMENT' )
        logging.banIp(req.connection.remoteAddress);
    else
        logging.banIp(req.headers['x-real-ip']); res.status(400).end();
});
app.get('/', function(req, res){res.sendFile(files.index);});
app.get('/game/', function(req, res){res.sendFile(files.game);});
app.get('/editor', function(req, res){res.sendFile(files.editor);});
app.get('/replay', function(req, res){res.sendFile(files.replay);});
app.get('/login', function(req, res){res.sendFile(files.login);});
app.get('/signup', function(req, res){res.sendFile(files.signup);});
app.get('/bannedips', function(req,res){
    if( req.session.user === undefined ||
        req.session.user.role === undefined ||
        req.session.user.role !== 'admin' ){
        res.status(401).send({message: 'forbidden'});
        return;
    }

    res.send(logging.getIPList());
});

app.use( '/api', apiRouter );

app.all('*', function(req, res){
    res.status(404).send({message:'The hamster did not find this route in the registry'});
});

const port = (process.env.PORT || 3001);
app.listen(port, function() {
    console.log('Node Server ('+process.version+')');
    console.log('Listening on '+port);
    console.log('Platform: '+process.platform + ' '+process.arch+'('+process.pid+')');
    console.log('cwd: '+process.cwd() );
});

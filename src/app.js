let express = require('express');
let path = require('path');
let morgan = require('morgan');
let cookieParser = require('cookie-parser');
let session = require('express-session');
let bodyParser = require('body-parser');

let apiRouter = require('./route/api.js');
let siteRouter = require('./route/site.js');

let app = express();

app.disable('x-powered-by');

app.use(morgan(':date[iso] - (HTTP :http-version :status :method) [ip] :remote-addr [time] :response-time[3] ms [response-size] :res[content-length] [url] :url'));

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



app.use( '/', siteRouter );
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

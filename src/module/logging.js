let morgan = require('morgan');
let path = require('path');
let rfs = require('rotating-file-stream');


function setupLogging( app ){
    //NOTE __dirname = meangame/src/module for logging.js
    const logDirectory = path.join(__dirname, '../../logs');
    let accessLogStream = rfs('access.log', {
        interval: '1d', // rotate daily
        path: logDirectory
    });

    const logFormat = ':date[iso] - (HTTP :http-version :status :method) [ip] :real-ip [time] :response-time[3] ms [response-size] :res[content-length] [url] :url';
    app.use(morgan(logFormat, {stream: accessLogStream}));
    app.use(morgan(logFormat, {skip: function (req, res) { return res.statusCode < 400 } }));

    if( process.env.ENVIRONMENT === "DEVELOPMENT" ){
        morgan.token('real-ip', function(req, res) { return req.connection.remoteAddress; });
    } else {
        morgan.token('real-ip', function(req, res) { return req.headers['x-real-ip']; });
    }
}

let bannedIps = [];

function getIPList(){
    return bannedIps;
}

function banIp(ip){
    if( bannedIps.length < 5000 ){
        bannedIps.push(ip);
        console.log(`banned ip ${ip}`);
    }
    else {
        console.log("bannedIps full.. clearing");
        bannedIps = [];
    }
}

function ipFilterMiddleware(req, res, next){
    let ip = req.headers['x-real-ip'];
    if( process.env.ENVIRONMENT === "DEVELOPMENT" )
        ip = req.connection.remoteAddress;

    for (let ipKey in bannedIps) {
        if( ip === bannedIps[ipKey] ) {
            res.end();
            return;
        }
    }

    next();
}

module.exports = {
    setupLogging,
    banIp,
    ipFilterMiddleware,
    getIPList
};
let morgan = require('morgan');
let path = require('path');
let rfs = require('rotating-file-stream');


function setupLogging( app ){
    //NOTE __dirname = meangame/src/ for loggin.js
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

module.exports = setupLogging;
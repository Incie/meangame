var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongojs = require('mongojs');
var leveldb = mongojs('samurailevels', ['samurailevels']);

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function(req, res){
    console.log( 'get req on / ' + req.connection.remoteAddress );
    res.sendFile('index.html');
});

app.get('/levels', function(req, res){
    leveldb.samurailevels.find(function( err, docs) {
        res.json(docs);
    });
});

app.listen(3000, function() {
    console.log('listening on 3000');
});
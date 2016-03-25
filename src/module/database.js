var mongojs = require('mongojs');
var response = require('./response');
var db = mongojs('samurai', ['samurai']);

var dbModule = {};

var updateMap = function(map, docs, callback){
    if( map.size.x*map.size.y != map.data.length ){
        console.log('error updating map: size mismatch');
        callback(response.fail(response, 'size mismatch'));
        return;
    }

    db.samurai.update( {_id: docs[0]._id}, { $set : {data: map.data, size: map.size}}, function(err, docs){
        if( err ){
            console.log('error updating map: ', err);
            callback(response.fail(response, 'could not update map'));
            return;
        }

        callback(response.success('map updated'));
    });
};

dbModule.saveOrUpdateMap = function(map, callback){
    db.samurai.find({name: map.name}, function(err, docs){
        if( err ){
            console.log('error saving map: ', err);
            callback(response.fail(response, 'error saving map'));
            return;
        }
        else if( docs.length > 0 )
            return updateMap(map, docs, callback);
        else {
            db.samurai.insert( req.body, function(err, docs){
                if( err ) {
                    console.log('error inserting map, ', err);
                    callback(response.fail(response, 'err'));
                    return;
                }

                callback(response.success('map saved'));
            });
        }
    });
};

dbModule.getMapList = function(callback){
    var limitResponse = {name:1, size:1,_id:0};
    db.samurai.find({},limitResponse, function( err, docs ) {
        if( err ) {
            callback(response.fail('error trying to get maps' + err));
            return;
        }

        var mapObject = response.success(''+docs.length+' maps');
        mapObject.mapList = docs;
        callback(mapObject);
    });
};

dbModule.getMap = function(mapName, callback){
    db.samurai.find({name: mapName}, {_id:0}, function(err, docs){
        if( err ) {
            callback(response.fail('error getting map: ' + err));
            return;
        }

        if( docs.length === 0 ){
            callback(response.fail('map not found: ' + mapName));
            return;
        }

        var mapData = docs[0];
        var mapObject = response.success(mapName, 'ok');
        mapObject.mapData = mapData;

        callback(mapObject)
    });
};

dbModule.optimizeMapData = function(mapData){
    return mapData.filter( tile =>  { return (tile.type != 0) } );
};

module.exports = dbModule;
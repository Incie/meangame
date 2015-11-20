var mongojs = require('mongojs');
var db = mongojs('samurai', ['samurai']);

var dbModule = {};

function fail( response, msg ) { var obj = {success: false, message: msg }; response.send(obj); return 0; }
function success(msg){ return { success: true, message:msg }; }

var updateMap = function(map, docs, response){
    if( map.size.x*map.size.y != map.data.length ){
        console.log('error updating map: size mismatch');
        return fail(response, 'size mismatch');
    }

    db.samurai.update( {_id: docs[0]._id}, { $set : {data: map.data, size: map.size}}, function(err, docs){
        if( err ){
            console.log('error updating map: ', err);
            return fail(response, 'could not update map');
        }

        response.send(success('map updated'));
    });
};

dbModule.saveMap = function(response, map){
    db.samurai.find({name: map.name}, function(err, docs){
        if( err ){
            console.log('error saving map: ', err);
            return fail(response, 'error saving map');
        }
        else if( docs.length > 0 )
            return updateMap(map, docs, response);
        else {
            db.samurai.insert( req.body, function(err, docs){
                if( err ) {
                    console.log('error inserting map, ', err);
                    return fail(response, 'err');
                }

                response.send(success('map saved'));
            });
        }
    });
};

dbModule.sendMapList = function(response){
    var limitResponse = {name:1, size:1,_id:0};
    db.samurai.find({},limitResponse, function( err, docs ) {
        if( err )
            return fail(response, 'error trying to get maps' + err);
        var mapList = success(''+docs.length+' maps');
        mapList.maps = docs;
        response.send(mapList);
    });
};

dbModule.getMap = function(response, mapName){
    db.samurai.find({name: mapName}, {_id:0}, function(err, docs){
        if( err )
            return fail(response, 'error getting map: ' + err)

        if( docs.length === 0 )
            return fail(response, 'map not found: ' + mapName);

        var mapObject = docs[0];
        var responseObject = success(mapName, 'ok');
        responseObject.data = mapObject;
        response.send(responseObject);
    });
};

module.exports.dbModule = dbModule;
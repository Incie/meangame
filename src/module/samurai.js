var response = require('./response');

var samurai = {};
var colors = [ 0xff0000, 0x00ff00, 0x0000ff, 0xffff00 ];

const SUITE = {
    religion: 'religion',
    politics: 'politics',
    trade: 'trade',
    samurai: 'samurai',
    ronin: 'ronin',
    boat: 'boat'
};

const CITYTYPE = {
    religion: 'religion',
    trade: 'trade',
    politics: 'politics'
};


//gameInfo { roomName, ownerName, numPlayers, mapName, password, isPrivate }
//mapObject { name, size {x,y}, data }
samurai.createGame = function(gameInfo, mapObject, callback){
    var gameObject = {};
    gameObject.roomName = gameInfo.roomName;
    gameObject.numPlayers = gameInfo.numPlayers;
    gameObject.ownerName = gameInfo.ownerName;
    gameObject.mapName = gameInfo.mapName;

    gameObject.map = mapObject;

    gameObject.players = createPlayers(gameObject.numPlayers);
    gameObject.players[0].name = gameObject.ownerName;

    gameObject.state = [];
    gameObject.players.forEach(function(player){
        gameObject.state.push({
            player: player.name,
            turn: player.turn,
            score: {
                religion: 0,
                politics: 0,
                trade: 0
            }
        });
    });

    gameObject.status = 'waiting for players';
    gameObject.turnCounter = 0;
    gameObject.moveList = [];
    gameObject.playerTurn = Math.floor( (Math.random() * 123456) ) % gameInfo.numPlayers;
    gameObject.gameid = createRandomId();

    callback(gameObject);
};

function createPlayers(numPlayers){
    var players = [];
    for( var i = 0; i < numPlayers; i += 1 ){
        var player = {};
        player.name = 'unassigned';
        player.turn = i;
        player.deck = createDeck();
        player.usedCards = [];
        player.hand = [];
        player.color = colors[i];

        dealHand(player.hand, player.deck);

        players.push(player);
    }

    return players;
}

function dealHand(hand, deck){
    while( hand.length < 6 ){
        var randomNumber = Math.random() * deck.length;
        if( randomNumber < deck.length && randomNumber >= 0 ){
            var randomIndex = Math.floor(randomNumber);
            var card = deck.splice(randomIndex, 1);
            hand.push(card[0]);
        }
    }
}

//Todo What is in a complete deck?
function createDeck() {
    let deck = [];
    for( let cardSize = 1; cardSize <= 4; cardSize += 1 ){
        deck.push( {suite: SUITE.trade, size: cardSize} );
        deck.push( {suite: SUITE.religion, size: cardSize} );
        deck.push( {suite: SUITE.politics, size: cardSize} );
        deck.push( {suite: SUITE.samurai, size: cardSize} );
    }

    let ronin = { suite: SUITE.ronin, quick: true, size: 1 };
    let boat1 = { suite: SUITE.boat, quick: true, size: 1 };
    let boat2 = { suite: SUITE.boat, quick: true, size: 2 };

    deck.push( ronin, ronin, boat1, boat1, boat2 );

    return deck;
}


function createRandomId(n) {
    var randomId = [];
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmopqrtuvwxyz123456789";

    var numChars = n || 6;

    for( var i = 0; i < numChars; i += 1 ){
        var index = Math.floor( Math.random() * possible.length );
        randomId.push(possible[index]);
    }

    return randomId.join('');
}

function validPlayerTurn( gameObject, player ){
    for( let i = 0; i < gameObject.players.length; i += 1 ){
        if( gameObject.players[i].name == player && gameObject.playerTurn == i)
            return true;
    }

    return false;
}

function validateHand(playerMoves, playerHand) {
    let validatedHand = true;
    playerMoves.every( move => {
        for( var i = 0; i < playerHand.length; i += 1 ){
            if( move.suite == playerHand[i].suite && move.size == playerHand[i].size ) {
                move.playerCard = playerHand.splice(i,1);
                return true;
            }
        }

        validatedHand = false;
        return false;
    });

    return validatedHand;
}

function validateMoves(mapObject, playerMoves, turnCount, playerColor, playerName){
    let validMapMoves = true;
    let normalMoveTaken = false;
    playerMoves.every( move => {
        var tile = mapObject.data.find( t => { return (move.x==t.x && move.y==t.y); } );

        if( !tile ) {
            validMapMoves = false;
            return false;
        }

        if( move.suite != SUITE.boat && move.suite != SUITE.ronin ){
            if( normalMoveTaken ){
                validMapMoves = false;
                return false;
            }

            normalMoveTaken = true;
        }

        if( tile.move !== undefined ){
            validMapMoves = false;
            return false;
        }

        if( move.suite == SUITE.boat && tile.type != 1 ) {
            validMapMoves = false;
            return false;
        }

        if( move.suite != SUITE.boat && tile.type != 2 ) {
            validMapMoves = false;
            return false;
        }

        tile.move = {
            color: playerColor,
            player: playerName,
            suite: move.suite,
            size: move.size,
            turn: turnCount
        };

        return true;
    });
    
    return validMapMoves;
}

samurai.processTurn = function(gameObject, player, moves, callback) {
    if( !validPlayerTurn(gameObject, player) ){
        callback( response.fail('Not your turn') );
        return;
    }

    var playerObject = gameObject.players.find( p => { return p.name == player; } );
    if( playerObject === undefined ){
        callback({success: false, error: 'player not found in gameobj: '+player});
        return;
    }

    if( !validateHand(moves, playerObject.hand) ){
        callback( response.fail('Failed hand validation'));
        return;
    }

    if( !validateMoves(gameObject.map, moves, gameObject.turnCounter, playerObject.color, playerObject.name) ) {
        callback( response.fail('Failed map validation') );
        return;
    }


    let cities = [];
    let tileOffsets = [{x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0}, {x: -1, y: 0}];
    let specialOffsets = [
        [{x: 1, y:-1}, {x: -1, y:-1}], //%2 == 0
        [{x: 1, y: 1}, {x: -1, y: 1}]  //%2 == 1
    ];

    for( let i = 0; i < moves.length; i += 1 ){
        let move = moves[i];

        //certain tiles can't trigger a score update
        if( move.suite == SUITE.boat )
            continue;

        function findTilesFor(offset) {
            let tile = gameObject.map.data.find( tile => { return ( (offset.x+tile.x) == move.x && (offset.y+tile.y) == move.y ) } );
            if( tile && tile.type == 3 )
                cities.push(tile);
        }

        let specialOffset = specialOffsets[ move.x % 2 ]; //validate %2?
        specialOffset.forEach(findTilesFor);
        tileOffsets.forEach(findTilesFor);
    }

    for( let i = 0; i < cities.length; i += 1 ){
        let cityObject = cities[i];

        let cityTiles = [];

        function findCityTilesAround(offset){
            let cityTile = gameObject.map.data.find( tile => { return (tile.x == (cityObject.x+offset.x) && tile.y == (cityObject.y+offset.y)) });
            if( cityTile )
                cityTiles.push(cityTile);
        }

        let specialOffset = specialOffsets[ cityObject.x % 2 ];
        specialOffset.forEach(findCityTilesAround);
        tileOffsets.forEach(findCityTilesAround);
        
        let isCitySurrounded = true;
        let cityInfluence = {};

        cityTiles.forEach( tile => {
            if( !tile.move ){
                if( tile.type == 2 ){
                    isCitySurrounded = false;
                }
                return;
            }

            //void or town
            if( tile.type == 0 || tile.type == 3 )
                return;

            //count cityInfluence
            let suite = tile.move.suite;
            if( suite == SUITE.boat || suite == SUITE.samurai ||suite == SUITE.ronin )
                suite = 'all';

            //if( tile.move.suite == move_tile ) continue?

            if( cityInfluence[suite] === undefined )
                cityInfluence[suite] = {};

            if( cityInfluence[suite][tile.move.player] === undefined )
                cityInfluence[suite][tile.move.player] = 0;

            cityInfluence[suite][tile.move.player] += tile.move.size;
        });

        if( isCitySurrounded ){
            console.log(cityInfluence);

            //prepare score object
            let score = {};
            for( let cityType in cityObject.city ){
                //validate cityType?
                score[cityType] = [];
                gameObject.players.forEach( player => {
                    score[cityType].push( {player: player.name, influence: 0});
                });
            }

            //calculate score
            for( let key in cityInfluence ){
                if( !cityInfluence.hasOwnProperty(key) ) continue;

                let influence = cityInfluence[key];
                if( key == 'all' ){
                    for( let player in influence ){
                        if( !influence.hasOwnProperty(player) ) continue;

                        for( let cityElement in score ){
                            let playerInfluence = score[cityElement].find( p => p.player == player );
                            playerInfluence.influence += influence[player];
                        }
                    }
                }
                else {
                    //key is a cityObject
                    for( let player in influence ){
                        if( !influence.hasOwnProperty(player) ) continue;
                        let scoreType = 'square';
                        if( key == 'hat' ) scoreType = 'circle';
                        if( key == 'buddha' ) scoreType = 'star';

                        if( score[scoreType] ){
                            let playerInfluence = score[scoreType].find( p => p.player == player );
                            playerInfluence.influence += influence[player];
                        }
                    }
                }
            }

            let pointsAwarded = [];
            for( let cityType in score ){
                score[cityType].sort((v0, v1) => {
                    if (v0.influence < v1.influence) return 1;
                    if (v0.influence > v1.influence) return -1;
                    return 0;
                });

                //no score
                if (score[cityType].length == 0)
                    return;

                //give singular player a point
                if (score[cityType].length == 1){
                    pointsAwarded.push( {
                        player: score[cityType][0].player,
                        cityType: cityType
                    });

                    return;
                }

                //no score
                if( score[cityType][0].influence == score[cityType][1].influence )
                    return;

                pointsAwarded.push( {
                    player: score[cityType][0].player,
                    cityType: cityType
                });
            }

            pointsAwarded.forEach( pointObject => {
                let state = gameObject.state.find( stateObject => stateObject.player == pointObject.player );

                let stateType = undefined;
                if( pointObject.cityType == 'square' ) stateType = 'trade';
                if( pointObject.cityType == 'circle' ) stateType = 'politics';
                if( pointObject.cityType == 'star' ) stateType = 'religion';

                state.score[stateType] += 1;
                console.log('+1', pointObject.player, stateType );
            });

            //mark cityObject as inactive
        }
    }


    //Add cards to the spent pile
    moves.forEach( move => { playerObject.usedCards.push(move); });

    //Draw new cards
    while( playerObject.hand.length < 6 && playerObject.deck.length != 0 ){
        var cardIndex = Math.floor(playerObject.deck.length * Math.random());
        var draw = playerObject.deck.splice(cardIndex, 1);
        playerObject.hand.push( draw[0] );
    }

    //TODO: Mark who made the move
    gameObject.moveList.push({player: playerObject.name, moves: moves});
    // gameObject.moveList.push(moves);
    gameObject.turnCounter++;
    gameObject.playerTurn = (gameObject.playerTurn + 1) % gameObject.numPlayers;

    callback({success: true, game: gameObject });
};


module.exports = samurai;

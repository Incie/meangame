var response = require('./response');

var samurai = {};
var colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
var hexColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];

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
samurai.createGame = function (gameInfo, mapObject, callback) {
    var gameObject = {};
    gameObject.roomName = gameInfo.roomName;
    gameObject.numPlayers = gameInfo.numPlayers;
    gameObject.ownerName = gameInfo.ownerName;
    gameObject.mapName = gameInfo.mapName;

    gameObject.map = mapObject;

    gameObject.players = createPlayers(gameObject.numPlayers);
    gameObject.players[0].name = gameObject.ownerName;

    gameObject.state = [];
    gameObject.players.forEach(function (player, index) {
        gameObject.state.push({
            player: player.name,
            turn: player.turn,
            color: hexColors[index],
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
    gameObject.playerTurn = Math.floor((Math.random() * 123456)) % gameInfo.numPlayers;
    gameObject.gameid = createRandomId();

    callback(gameObject);
};

function createPlayers(numPlayers) {
    var players = [];
    for (var i = 0; i < numPlayers; i += 1) {
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

function dealHand(hand, deck) {
    while (hand.length < 6) {
        var randomNumber = Math.random() * deck.length;
        if (randomNumber < deck.length && randomNumber >= 0) {
            var randomIndex = Math.floor(randomNumber);
            var card = deck.splice(randomIndex, 1);
            hand.push(card[0]);
        }
    }
}

//Todo What is in a complete deck?
function createDeck() {
    let deck = [];
    for (let cardSize = 2; cardSize <= 4; cardSize += 1) {
        deck.push({suite: SUITE.trade, size: cardSize});
        deck.push({suite: SUITE.religion, size: cardSize});
        deck.push({suite: SUITE.politics, size: cardSize});
    }

    let samurai1 = {suite: SUITE.samurai, size: 1};
    let samurai2 = {suite: SUITE.samurai, size: 2};
    let samurai3 = {suite: SUITE.samurai, size: 3};
    deck.push(samurai1, samurai1, samurai2, samurai2, samurai3);

    let ronin = {suite: SUITE.ronin, quick: true, size: 1};
    let boat1 = {suite: SUITE.boat, quick: true, size: 1};
    let boat2 = {suite: SUITE.boat, quick: true, size: 2};
    deck.push(ronin, boat1, boat1, boat2);

    //TODO: MISSING SWAP AND MOVE TILE

    return deck;
}


function createRandomId(n) {
    var randomId = [];
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmopqrtuvwxyz123456789";

    var numChars = n || 6;

    for (var i = 0; i < numChars; i += 1) {
        var index = Math.floor(Math.random() * possible.length);
        randomId.push(possible[index]);
    }

    return randomId.join('');
}

function validPlayerTurn(gameObject, player) {
    for (let i = 0; i < gameObject.players.length; i += 1) {
        if (gameObject.players[i].name == player && gameObject.playerTurn == i)
            return true;
    }

    return false;
}

function validateHand(playerMoves, playerHand) {
    let validatedHand = true;
    playerMoves.every(move => {
        for (var i = 0; i < playerHand.length; i += 1) {
            if (move.suite == playerHand[i].suite && move.size == playerHand[i].size) {
                move.playerCard = playerHand.splice(i, 1);
                return true;
            }
        }

        validatedHand = false;
        return false;
    });

    return validatedHand;
}

function validateMoves(mapObject, playerMoves, turnCount, playerColor, playerName) {
    let validMapMoves = true;
    let normalMoveTaken = false;
    playerMoves.every(move => {
        var tile = mapObject.data.find(t => {
            return (move.x == t.x && move.y == t.y);
        });

        if (!tile) {
            validMapMoves = false;
            return false;
        }

        if (move.suite != SUITE.boat && move.suite != SUITE.ronin) {
            if (normalMoveTaken) {
                validMapMoves = false;
                return false;
            }

            normalMoveTaken = true;
        }

        if (tile.move !== undefined) {
            validMapMoves = false;
            return false;
        }

        if (move.suite == SUITE.boat && tile.type != 1) {
            validMapMoves = false;
            return false;
        }

        if (move.suite != SUITE.boat && tile.type != 2) {
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

const tileOffsets = [{x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0}, {x: -1, y: 0}];
const specialOffsets = [
    [{x: 1, y: -1}, {x: -1, y: -1}], //%2 == 0
    [{x: 1, y: 1}, {x: -1, y: 1}]  //%2 == 1
];

function findSurroundingTiles(tiles, mapData){
    let surroundingTiles = [];

    tiles.forEach( tile => {
        function findTilesFor(offset) {
            let t = mapData.find(maptile => (offset.x + tile.x) == maptile.x && (offset.y + tile.y) == maptile.y );
            if( t )
                surroundingTiles.push(t);
        }

        let specialOffset = specialOffsets[tile.x % 2]; //validate %2?
        specialOffset.forEach(findTilesFor);
        tileOffsets.forEach(findTilesFor);
    });

    return surroundingTiles;
}

const TILE = {
    CITY: 3,
    LAND: 2,
    WATER: 1,
    VOID: 0
};

function handleScore(gameObject, moves) {
    let cities = findSurroundingTiles(moves.filter(move => move.suite != SUITE.boat), gameObject.map.data).filter(tile => tile.type == TILE.CITY && tile.occupied === undefined );

    let uniqueCities = Array.from( new Set(cities) );
    uniqueCities.forEach( cityTile => {
        let cityTiles = findSurroundingTiles( [cityTile], gameObject.map.data);

        let unoccupiedLand = cityTiles.filter( tile => tile.type == TILE.LAND && tile.move === undefined );
        if( unoccupiedLand.length > 0 ) {
            console.log('City has unoccupied land', cityTile);
            return;
        }

        const all = [SUITE.samurai, SUITE.boat, SUITE.ronin];
        let cityInfluence = {};
        for( let cityType in cityTile.city )
            cityInfluence[cityType] = {};

        let tilesWithMoves = cityTiles.filter( tile => tile.move !== undefined );
        tilesWithMoves.forEach( tile => {
            let suite = tile.move.suite;
            if( all.find( type => type == suite ) ){
                for( let cityType in cityInfluence ){
                    cityInfluence[cityType][tile.move.player] = cityInfluence[cityType][tile.move.player] || 0;
                    cityInfluence[cityType][tile.move.player] += tile.move.size;
                }
            }
            else if( cityInfluence[suite] ) {
                cityInfluence[suite][tile.move.player] = cityInfluence[suite][tile.move.player] || 0;
                cityInfluence[suite][tile.move.player] += tile.move.size;
            }
        });

        console.log( cityTile, cityInfluence );

        for( let cityType in cityInfluence ){
            let kv = [];
            for( let player in cityInfluence[cityType] )
                kv.push( {player: player, influence: cityInfluence[cityType][player] });

            kv.sort( (v0, v1) => v1.influence - v0.influence );

            console.log(kv);

            if( kv.length == 0 )
                continue;

            if( kv.length == 1 && kv[0].influence > 0 ){
                console.log('Winzip', cityTile, cityType, kv[0]);
                gameObject.state.find( stateObject => stateObject.player == kv[0].player ).score[cityType] += 1;
                return;
            }

            if( kv[0].influence == kv[1].influence ) {
                console.log( 'Tied', cityTile, cityType, kv);
                return;
            }

            console.log('Winrar', cityTile, cityType, kv[0]);
            gameObject.state.find( stateObject => stateObject.player == kv[0].player ).score[cityType] += 1;
        }

        gameObject.map.data.find( tile => cityTile.x == tile.x && cityTile.y == tile.y ).occupied = true;
    });

    return true;
}

samurai.processTurn = function (gameObject, player, moves, callback) {
    if (!validPlayerTurn(gameObject, player)) {
        callback(response.fail('Not your turn'));
        return;
    }

    var playerObject = gameObject.players.find(p => {
        return p.name == player;
    });
    if (playerObject === undefined) {
        callback({success: false, error: 'player not found in gameobj: ' + player});
        return;
    }

    if (!validateHand(moves, playerObject.hand)) {
        callback(response.fail('Failed hand validation'));
        return;
    }

    if (!validateMoves(gameObject.map, moves, gameObject.turnCounter, playerObject.color, playerObject.name)) {
        callback(response.fail('Failed map validation'));
        return;
    }

    if( !handleScore(gameObject, moves) ){
        callback(response.fail('Failed score handling'));
        return;
    }

    //Add cards to the spent pile
    moves.forEach(move => {
        playerObject.usedCards.push(move);
    });

    //Draw new cards
    while (playerObject.hand.length < 6 && playerObject.deck.length != 0) {
        var cardIndex = Math.floor(playerObject.deck.length * Math.random());
        var draw = playerObject.deck.splice(cardIndex, 1);
        playerObject.hand.push(draw[0]);
    }

    //TODO: Mark who made the move
    gameObject.moveList.push({player: playerObject.name, moves: moves});
    // gameObject.moveList.push(moves);
    gameObject.turnCounter++;
    gameObject.playerTurn = (gameObject.playerTurn + 1) % gameObject.numPlayers;

    callback({success: true, game: gameObject});
};


module.exports = samurai;

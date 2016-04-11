'use strict';

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

var fs = require('fs');

var testData = {};
testData.map = JSON.parse( fs.readFileSync( 'test/data/map.json', 'utf8' ) );

describe("MapData", function() {
	let map = testData.map;
	it("should be 5x5", function(){
		expect(map.size.x).to.equal(10);
		expect(map.size.y).to.equal(5);
	});

    it("should have 10x5 data elements minus 2 void tiles", function() {
		let expectedLength = map.size.x * map.size.y - 2;
        expect(map.data.length).to.equal(expectedLength);
    });
	
	it("should have fields type, x and y", function() {
		map.data.forEach( tile => { 
			assert.property(tile, 'type');
			assert.property(tile, 'x');
			assert.property(tile, 'y');
		});
	});
});







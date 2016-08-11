'use strict';

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

var auth = require('../src/module/user-authentication');

function failAssertion(){
    assert(false);
}

function trueAssertion(){
    assert(true);
}

describe("Authentication", function() {
    function testPasswordPair(pass0, pass1){
        return auth.generatePasswordHash(pass0).then( function(hash) {
            return auth.validatePassword(pass1, hash);
        });
    }

    it("should validate password", function(){
        return testPasswordPair('1234567890abcdefghijklmnopqrstuvwxyz','1234567890abcdefghijklmnopqrstuvwxyz')
            .then(function(result){
                expect(result).to.equal(true);
            });
    });

    it("should not validate password", function(){
        return testPasswordPair('1234567890abcdefghijklmnopqrstuvwxyz','1234567890abcddfghijklmnopqrstuvxyz')
            .then(function(result){
                expect(result).to.equal(false);
            });
    });

    it("should be rejected quickly", function(){
        return testPasswordPair(NaN, '1')
            .then(failAssertion)
            .catch(trueAssertion);
    });

    it("should be rejected", function(){
        return testPasswordPair('1', NaN)
            .then(failAssertion)
            .catch(trueAssertion);
    });
});

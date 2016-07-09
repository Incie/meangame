'use strict';

let users = require('./users');
let bcryptjs = require('bcryptjs');

let authModule = {};

function generatePasswordHash(password){
    return new Promise( function(success, fail){
        bcryptjs.hash(password, 9, function(err, hash){
            if( err ){
                fail(err);
            } else {
                success(hash);
            }
        });
    });
}

function validatePassword(password, hash){
    return new Promise( function(success, fail){
        bcryptjs.compare(password, hash, function(err, res){
            if( err  ){
                fail(err);
            } else if( res == undefined ) {
                fail('undefined result');
            } else {
                success(res);
            }
        });
    });
}

authModule.__testing__ = {
    validatePassword: validatePassword,
    generatePasswordHash: generatePasswordHash
};

module.exports = authModule;
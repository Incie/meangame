let userModule = {};

let authModule = require('./user-authentication');
let mongojs = require('mongojs');
let usersDb = mongojs('samurai', ['users']);

userModule.userExists = function(user){
    return new Promise( function(success, reject){
        usersDb.find({user:user}, {user:1, _id:0}, function(err, docs){
            let userFound = false;

            if( err ){
                reject(err);
                return;
            }

            if( docs.length > 0 )
                userFound = true;

            success(userFound);
         });
    });
};

userModule.registerUser = function(user, password, name){
    return new Promise( function(success, reject){
        let userObject = {
            user: user,
            password: password,
            name: name
        };

        usersDb.insert(userObject, function(err, docs){
            if( err ){
                reject(err);
                return;
            }

            success(docs);
        });
    });
};

userModule.getUserData = function(user){
    return new Promise( function(success, reject){
        let userObject = { user:user };
        usersDb.find(userObject, {_id: 0}, function(err, docs){
            if( err ) {
                reject(err);
                return;
            }

            success(docs);
        });
    });
};

userModule.login = function(loginObject){
    let user = loginObject.user;
    let pass = loginObject.pass;

    return userModule.getUserData(user)
        .then(function(userObject){
            return authModule.validatePassword(pass, userObject.password);
        });
};

module.exports = userModule;
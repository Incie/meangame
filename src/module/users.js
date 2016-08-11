let userModule = {};

let authModule = require('./user-authentication');
let mongojs = require('mongojs');
let usersDb = mongojs('users', ['users']);

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
        userModule.getUserData(user)
            .then( userObjects => {
                if( userObjects.length > 0 ) {
                    reject("User Exists");
                    return;
                }

                authModule.generatePasswordHash(password)
                    .then(hash => {
                        let userObject = {
                            user: user,
                            password: hash,
                            name: name
                        };

                        usersDb.users.insert(userObject, function(err, docs){
                            if( err ){
                                reject(err);
                                return;
                            }

                            success();
                        });
                    });
            })
            .catch( msg => reject(msg) );
    });
};

userModule.getUserData = function(user){
    return new Promise( function(success, reject){
        let userObject = { user:user };
        usersDb.users.find(userObject, function(err, docs){
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

    return new Promise( function(success, reject){
        userModule.getUserData(user)
            .then(function(userObject){
                if( userObject.length == 0 ){
                    reject('invalid');
                    return;
                }

                return authModule.validatePassword(pass, userObject[0].password)
                    .then( validated => {
                        if( validated ){
                            success(userObject[0]);
                            return;
                        }
                        reject("not valid");
                });
        });
    })
};

module.exports = userModule;
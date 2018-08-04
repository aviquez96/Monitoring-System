var Datastore = require('nedb')
var _ = require('lodash');

var user_id = exports.user_id - null

var initializeDataStore = exports.initializeDataStore = () => {
    return new Promise((resolve, reject) => {
        var db = {};
        db.userInfo = new Datastore({ filename: `${__dirname}/datastore/local/userInfo`, autoload: true });
        db.userInfo.find({ _id: '0000000000000001' }, (error, docs) => {
            if (error) {
                return reject(error)
            }
            if (docs.length !== 0) {
                return resolve();
            }
            db.userSettings = new Datastore({ filename: `${__dirname}/datastore/local/userSettings`, autoload: true });
            db.dataCollection = new Datastore({ filename: `${__dirname}/datastore/local/dataCollection`, autoload: true });
            var doc = { 
                        _id: '0000000000000001'
                    };
            db.userInfo.insert(doc, error => {   // Callback is optional
                if (error) {
                    return reject(error)
                }
                return resolve();
            });
        });
    })
}

exports.findUser = function(email) {
    return new Promise((resolve, reject) => {
        var db = {};
        db.userInfo = new Datastore({ filename: `${__dirname}/datastore/local/userInfo`, autoload: true });
        db.userInfo.find({ email: email }, (error, docs) => {
            if (error) {
                return reject(error)
            }
            if (docs.length === 0) {
                return resolve(false)
            }
            return resolve(true);
        })
    })
}

exports.createSession = function(userId) {
    db.userInfo.find({ email: email }, (error, docs) => {
        if (error) {
            return reject(error)
        }
        if (docs.length === 0) {
            return resolve(false)
        }
        return resolve(true);
    })
}

exports.loginUser = function(email, password, isRemember) {
    return new Promise(async (resolve, reject) => {
        try {
            var db = {};
            db.userSettings =  new Datastore({ filename: `${__dirname}/datastore/local/userSettings`, autoload: true })
            const user = await find({ email: email, password: password }, 'userInfo')
            if (user.length === 0) {
                return reject('Incorrect email or password')
            }
            user_id = user[0]._id
            const setting = await find({ userId: user.Id}, 'userSettings')
            const uSettDoc = {
                userId: user[0]._id,
                isRemembered: isRemember
            }
            if (setting.length === 0) {
                db.userSettings.insert(uSettDoc, (error, newDoc)=> {
                    if (error) {
                        return reject(error)
                    }
                    return resolve(true);
                });
            } else {
                db.userSettings.update(setting, uSettDoc, {}, (error, settingReplaced) => {
                    if (error) {
                        return reject(error)
                    }
                    return resolve(true)
                })
            }

        } catch(error) {
            if (error) {
                return reject(error)
            }
        }
    })
}

exports.newUser = function(email, password) {
    return new Promise(async (resolve, reject) => {
        try {
            // Document object declaration
            var uInfoDoc = { 
                email: email,
                password: password,
                created_at: Math.round((new Date()).getTime() / 1000),
                session: false,
            };
            // Insert document into database
            let newDoc = await insert(uInfoDoc, "userInfo")
            return resolve();
        }catch (error) {
            console.log(error)
            return reject(error)
        }
    })
}

exports.storeSensorData = function(data) {
    return new Promise(async (resolve, reject) => {
        try {
            data.createdAt = Math.round(new Date().getTime() / 1000);
            data.userId = user_id;
            let newDoc = await insert(data, "dataCollection");
            return resolve()
        } catch(error) {
            console.log(`error: ${error}`);
            return reject(error);
        }
    })
}

exports.getSummaryData = function(pumpId) {
    return new Promise((resolve, reject) => {
        try {
            let userId = user_id;
            var db = new Datastore({ filename: `${__dirname}/datastore/local/dataCollection`, autoload: true  });
            console.log('find', userId, pumpId)
            db
            .findOne({ userId: userId, pumpId: pumpId })
            .sort({ createdAt: -1 })      // OR `.sort({ updatedAt: -1 })` to sort by last modification time
            .limit(1)
            .exec(function(error, data) {
                if (error) {
                    return reject(error)
                }
                return resolve(data)
            });
        } catch(error) {
            console.log(error)
        }
    }) 
}

exports.getRealTime = function(data)  {
    return new Promise((resolve, reject) => {
        try{
            let userId = user_id;
            let pumpId = data.pumpId;
            let count = 5
            var db = new Datastore({ filename: `${__dirname}/datastore/local/dataCollection`, autoload: true  });
            db
            .find({ userId: userId, pumpId: pumpId })
            .sort({ createdAt: -1 })      // OR `.sort({ updatedAt: -1 })` to sort by last modification time
            .limit(count)
            .exec(function(error, data) {

                if (error) {
                    return reject(error)
                }

                let voltageList = new Array();
                let currentList = new Array();
                let powerList = new Array();
                let opTempList = new Array();
                let suTempList = new Array();
                let waterBreakerList = new Array();
                console.log('da',data)
                for (i = data.length - 1; i >= 0; i--) {
                    voltageList.push(data[i].voltage)
                    currentList.push(data[i].current)
                    powerList.push(data[i].power)
                    opTempList.push(data[i].opTemp)
                    suTempList.push(data[i].suTemp)
                    waterBreakerList.push(data[i].waterBreaker)
                }
                let response =  [
                    voltageList,
                    currentList,
                    powerList,
                    opTempList,
                    suTempList,
                    waterBreakerList
                ]
                console.log('r',response)
                return resolve(response)
            });
        } catch(error) {
            console.log(error)
            return reject(error)
        } 
    })
}

//wrappers

var find = exports.find = function(object, tableName) {
    return new Promise((resolve, reject) => {
        var db = {};
        db.schema = new Datastore({ filename: `${__dirname}/datastore/local/${tableName}`, autoload: true });
        db.schema.find(object, (error, docs) => {
            if (error) {
                return reject(error)
            }
            return resolve(docs);
        })
    })
}

var insert = exports.insert = function(object, tableName) {
    return new Promise ((resolve, reject) => {
        var db = {};
        db.schema = new Datastore({ filename: `${__dirname}/datastore/local/${tableName}`, autoload: true });
        db.schema.insert(object, (error, newDoc) => {
            if (error) {
                return reject(error)
            }
            return resolve(newDoc);
        })
    })
}

var update = exports.update = function(object, query, updateModifier, options, tableName) {
    return new Promise ((resolve,reject) => {
        var db = {};
        db.schema = new Datastore({ filename: `${__dirname}/datastore/local/${tableName}`, autoload: true });
        db.schema.update(object, query, updateModifier, options, (error, settingReplaced, affectedDocuments, upsert) => {
            if (error) {
                return reject(error)
            }
            return resolve(settingReplaced, affectedDocuments, upsert);
        })
    })
}

var remove = exports.remove = function (object, query, options, tableName) {
    return new Promise ((resolve,reject) => {
        var db = {};
        db.schema = new Datastore({ filename: `${__dirname}/datastore/local/${tableName}`, autoload: true });
        db.schema.remove(object, query, options, (error, numRemoved) => {
            if (error) {
                return reject(error)
            }
            return resolve(numRemoved);
        })
    })
}

var findOne = exports.findOne = function (object, tableName) {
    return new Promise ((resolve,reject) => {
        var db = {};
        db.schema = new Datastore({ filename: `${__dirname}/datastore/local/${tableName}`, autoload: true });
        db.schema.findOne(object, (error, doc) => {
            if (error) {
                return reject(error)
            }
            return resolve(doc);
        })
    })
}

var count = exports.count = function (object, tableName) {
    return new Promise ((resolve,reject) => {
        var db = {};
        db.schema = new Datastore({ filename: `${__dirname}/datastore/local/${tableName}`, autoload: true });
        db.schema.count(object, (error, count) => {
            if (error) {
                return reject(error)
            }
            return resolve(count);
        })
    })
}

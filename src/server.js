'use strict';
var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var http = require('http');
var killable = require('killable');

var server;

function start(cb) {

  var dbServer = {
    protocol: 'http',
    domain: '192.168.59.103',
    port: 5984,
    adminUser: 'admin',
    adminPass: 'KtgFck3D557Sn545'
  };

  var app = express();

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  app.use(express.static('static'));
  app.use(morgan('dev'))
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(passport.initialize());

  passport.use(new LocalStrategy(
    function(username, password, done) {
      authenticateUser(username, password, done);
    }
  ));

  app.post('/register', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    if (username && password) {
      createUser(username, password, function(err, user) {
        if (err) {
          res.status(400).json({
            error: 'createfailed',
            description: err.message
          });
        } else {
          res.json(user);
        }
      });
    } else {
      res.status(400).send();
    }
  });

  app.post('/login', function(req, res, next) {
    passport.authenticate('local', {
      session: false,
      failureFlash: false
    }, function(err, user, info) {
      if (err) {
        return res.status(500).send();
      }
      if (user) {
        res.json(user);
      } else {
        res.status(401).json({
          error: 'invalidcredentials',
          message: 'Invalid username/password.'
        });
      }
    })(req, res, next);
  });


  var port = process.env.PORT || 8080;
  server = http.createServer(app);
  killable(server);
  server.listen(port, cb);
  console.log('Server started on port ' + port + '.');
}

function stop(cb) {
  if (server) {
    console.log('Stopping server.');
    server.kill(cb);
    server = null;
  } else {
    if (cb) {
      cb();
    }
  }
}

function authenticateUser(username, password, callback) {
  var dbName = calcDbNameFromUsername(username);
  request.get({
    uri: dbServer.protocol + '://' + dbServer.domain + ':' + dbServer.port + '/' + dbName,
    auth: {
      'user': username,
      'pass': password
    }
  }, function(err, response, body) {
    if (err) {
      return callback(e);
    }
    if (response.statusCode === 200) {
      callback(null, createUserObject(dbName, username, password));
    } else if (response.statusCode === 401) {
      callback(null, false);
    } else {
      callback(new Error('Unknown error occurred while authenticating user'));
    }
  });
}

function createUser(username, password, callback) {
  var dbName = calcDbNameFromUsername(username);
  request.put({
    uri: dbServer.protocol + '://' + dbServer.domain + ':' + dbServer.port + '/_users/org.couchdb.user:' + username,
    auth: {
      'user': dbServer.adminUser,
      'pass': dbServer.adminPass
    },
    json: {
      "_id": "org.couchdb.user:dbreader",
      "name": username,
      "type": "user",
      "roles": [],
      "password": password
    }
  }, function(err, response, body) {
    if (err) {
      return callback(err);
    }
    if (response.statusCode === 201) {
      callback(null, createUserObject(dbName, username, password));
    } else if (response.statusCode === 412) {
      callback(new Error('User already exists'));
    } else {
      callback(new Error('Unknown error occurred while creating user'));
    }
  });
}

function createUserObject(dbName, username, password) {
  return {
    'username': username,
    'dbUrl': dbServer.protocol + '://' + dbServer.domain + ':' + dbServer.port + '/' + dbName,
    'dbCredentials': [username, password]
  };
}

function calcDbNameFromUsername(username) {
  return 'userdb-' + new Buffer(username).toString('hex');
}


module.exports = function() {
  return {
    start: start,
    stop: stop
  }
}

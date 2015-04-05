'use strict';
var express = require('express'),
  passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  morgan = require('morgan'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  request = require('request'),
  http = require('http'),
  killable = require('killable'),
  TypedError = require("error/typed"),
  WrappedError = require('error/wrapped');

var server;

var dbConfig = {
  protocol: 'CONFIG_DB_PROTOCOL',
  domain: 'CONFIG_DB_HOST',
  port: 'CONFIG_DB_PORT',
  adminUser: 'admin',
  adminPass: 'CONFIG_DB_ADMIN_PASS'
};

var DbError = TypedError({
  type: 'db',
  statusCode: null
});

var AuthenticationError = TypedError({
  type: 'authentication',
  statusCode: null
});

function start(cb) {

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
          res.status(err.statusCode).json({error: err.type, message: err.message});
        }
        res.json(user);
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
        return res.status(err.statusCode).json({error: err.type, message: err.message});
      }
      res.json(user);
    })(req, res, next);
  });


  var port = 8001;
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
    uri: dbConfig.protocol + '://' + dbConfig.domain + ':' + dbConfig.port + '/' + dbName,
    auth: {
      'user': username,
      'pass': password
    }
  }, function(err, response, body) {
    if (err) {
      return callback(new DbError({statusCode: 503, message: err.message}));
    }
    if (response.statusCode === 200) {
      callback(null, createUserObject(dbName, username, password));
    } else if (response.statusCode === 401) {
      callback(new AuthenticationError({statusCode: 401, message: 'Invalid username/password.'}));
    } else {
      callback(new AuthenticationError({statusCode: 500, message: body}));
    }
  });
}

function createUser(username, password, callback) {
  request.put({
    uri: dbConfig.protocol + '://' + dbConfig.domain + ':' + dbConfig.port + '/_users/org.couchdb.user:' + encodeURIComponent(username),
    auth: {
      'user': dbConfig.adminUser,
      'pass': dbConfig.adminPass
    },
    json: {
      "_id": 'org.couchdb.user:' + username,
      "name": username,
      "type": 'user',
      "roles": [],
      "password": password
    }
  }, function(err, response, body) {
    if (err) {
      return callback(new DbError({statusCode: 503, message: err.message}));
    }
    if (response.statusCode === 201) {
      callback(null, createUserObject(calcDbNameFromUsername(username), username, password));
    } else if (response.statusCode === 412) {
      callback(new AuthenticationError({statusCode: 412, message: 'User already exists.'}));
    } else {
      callback(new AuthenticationError({statusCode: 500, message: body}));
    }
  });
}

function createUserObject(dbName, username, password) {
  return {
    'username': username,
    'dbUrl': dbConfig.protocol + '://' + dbConfig.domain + ':' + dbConfig.port + '/' + dbName,
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
};

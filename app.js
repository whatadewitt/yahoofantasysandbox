/**
 * Module dependencies.
 */

// sample conf.js
/*
  module.exports = {
    "APP_KEY": [KEY FROM YAHOO!],
    "APP_SECRET": [SECRET FROM YAHOO!],
    "APP_URL": "[APP URL]"
  }
*/

var express = require('express')
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , refresh = require('passport-oauth2-refresh')
  , YahooStrategy = require('https-passport-yahoo-oauth').Strategy
  , YahooFantasy = require('yahoo-fantasy')
  , APP_KEY = process.env.APP_KEY || require('./conf.js').APP_KEY
  , APP_SECRET = process.env.APP_SECRET || require('./conf.js').APP_SECRET
  , routes = require('./routes');

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

var strat = new YahooStrategy({
  consumerKey: APP_KEY,
  consumerSecret: APP_SECRET,
  callbackURL: (process.env.APP_URL || require('./conf.js').APP_URL) + '/auth/yahoo/callback'
},
function(token, tokenSecret, profile, done) {
  var data = profile._json;

  var userObj = {
    id: profile.id,
    name: data.profile.nickname,
    avatar: data.profile.image.imageUrl,
    dateJoined: new Date().getTime(),
    lastUpdated: new Date().getTime(),
    lastVisit: new Date().getTime(),
    accessToken: token,
    tokenSecret: tokenSecret,
    sessionHandle: profile.oauth_session_handle
  };

  return done(null, userObj);
  // for luke... later...
  // User.findOne({ user_id: profile.id }, function(err, u) {
  //   console.log(u);
  //   if (err) { return done(err); }
  //   if (u) { return done(null, u); }

  //   var user = new User();
  //   user.user_id = profile.id;
  //   user.token = token;
  //   user.token_secret = tokenSecret;
  //   user.name = profile.displayName;
  //   user.nickname = profile._json.profile.nickname;

  //   // user.save(function(e, u) {
  //   //   if (e) return done(e);
  //   //   return done(null, profile);
  //   // });
  // });
});

// passport.use(strategy);
// refresh.use(strategy);

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon('public/images/favicon.png'));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use( express.cookieParser() );
  app.use(express.session({ secret: 'piano kitty' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.disable('view cache');
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', checkAuth, routes.index);
app.get('/resource/:resource/:subresource', checkAuth, routes.console);
app.get('/collection/:resource/:subresource', checkAuth, routes.console);
app.get('/data/:resource/:subresource', setAppToken, routes.getData);

app.get('/auth/yahoo',
  passport.authenticate('yahoo', { failureRedirect: '/login' }),
  function(req, res, user) {
    res.redirect('/');
  });

app.get('/auth/yahoo/callback',
  passport.authenticate('yahoo', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect(req.session.redirect || '/');
  }
);

app.get('/logout', function(req, res){
  req.logout();
  res.redirect(req.session.redirect || '/');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

function checkAuth(req, res, next) {
  var userObj;

  if (req.isAuthenticated()) {
    userObj = {
      name: req.user.name,
      avatar: req.user.avatar
    };
  } else {
    userObj = null;
  }

  req.userObj = userObj;

  next();
}

function setAppToken(req, res, next) {
  req.yahoo = {
    key: APP_KEY,
    secret: APP_SECRET
  };

  next();
}

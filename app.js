var express = require("express");
var path = require("path");
var favicon = require("serve-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var session = require("express-session");
var RedisStore = require("connect-redis")(session);

var passport = require("passport");
var request = require("request");
var OAuth2Strategy = require("passport-oauth2");
var YahooFantasy = require("yahoo-fantasy");
var APP_KEY = process.env.APP_KEY || require("./conf.js").APP_KEY;
var APP_SECRET = process.env.APP_SECRET || require("./conf.js").APP_SECRET;
var routes = require("./routes");

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(
  new OAuth2Strategy(
    {
      authorizationURL: "https://api.login.yahoo.com/oauth2/request_auth",
      tokenURL: "https://api.login.yahoo.com/oauth2/get_token",
      clientID: APP_KEY,
      clientSecret: APP_SECRET,
      callbackURL:
        (process.env.APP_URL || require("./conf.js").APP_URL) +
        "/auth/yahoo/callback"
    },
    function(accessToken, refreshToken, params, profile, done) {
      var options = {
        url:
          "https://social.yahooapis.com/v1/user/" +
          params.xoauth_yahoo_guid +
          "/profile?format=json",
        method: "get",
        json: true,
        auth: {
          bearer: accessToken
        }
      };

      request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          var userObj = {
            id: body.profile.guiid,
            name: body.profile.nickname,
            avatar: body.profile.image.imageUrl,
            accessToken: accessToken,
            refreshToken: refreshToken
          };

          app.yf.setUserToken(accessToken);

          return done(null, userObj);
        }
      });
    }
  )
);

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.yf = new YahooFantasy(APP_KEY, APP_SECRET);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    store: new RedisStore({
      host: process.env.REDIS_HOST || require("./conf.js").REDIS_HOST,
      port: process.env.REDIS_PORT || require("./conf.js").REDIS_PORT
    }),
    secret: process.env.SESSION_SECRET || require("./conf.js").SESSION_SECRET,
    resave: false,
    saveUninitialized: true
  })
);
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());
app.use(passport.session());
app.disable("view cache");

app.get("/", checkAuth, routes.index);
app.get("/resource/:resource/:subresource", checkAuth, routes.console);
app.get("/collection/:resource/:subresource", checkAuth, routes.console);
app.get("/data/:resource/:subresource", routes.getData);

app.get(
  "/auth/yahoo",
  passport.authenticate("oauth2", { failureRedirect: "/login" }),
  function(req, res, user) {
    res.redirect("/");
  }
);

app.get(
  "/auth/yahoo/callback",
  passport.authenticate("oauth2", { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect(req.session.redirect || "/");
  }
);

app.get("/logout", function(req, res) {
  // todo: fix this...
  req.logout();
  res.redirect(req.session.redirect || "/");
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

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;

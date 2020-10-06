const express = require("express");
const path = require("path");
const favicon = require("serve-favicon");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const RedisStore = require("connect-redis")(session);

const passport = require("passport");
const request = require("request");
const OAuth2Strategy = require("passport-oauth2");
const YahooFantasy = require("yahoo-fantasy");
const APP_KEY = process.env.APP_KEY || require("./conf.js").APP_KEY;
const APP_SECRET = process.env.APP_SECRET || require("./conf.js").APP_SECRET;
const routes = require("./routes");

// removed as the lib handles auth now -- here for the memories
// passport.serializeUser(function (user, done) {
//   done(null, user);
// });

// passport.deserializeUser(function (obj, done) {
//   done(null, obj);
// });

// passport.use(
//   new OAuth2Strategy(
//     {
//       authorizationURL: "https://api.login.yahoo.com/oauth2/request_auth",
//       tokenURL: "https://api.login.yahoo.com/oauth2/get_token",
//       clientID: APP_KEY,
//       clientSecret: APP_SECRET,
//       callbackURL:
//         (process.env.APP_URL || require("./conf.js").APP_URL) +
//         "/auth/yahoo/callback",
//     },
//     function (accessToken, refreshToken, params, profile, done) {
//       const options = {
//         url: "https://api.login.yahoo.com/openid/v1/userinfo",
//         method: "get",
//         json: true,
//         auth: {
//           bearer: accessToken,
//         },
//       };

//       request(options, function (error, response, body) {
//         if (!error && response.statusCode == 200) {
//           const userObj = {
//             id: body.sub,
//             name: body.nickname,
//             avatar: body.profile_images.image64,
//             accessToken: accessToken,
//             refreshToken: refreshToken,
//           };

//           app.yf.setUserToken(accessToken);

//           return done(null, userObj);
//         }
//       });
//     }
//   )
// );

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.tokenCallback = function ({ access_token, refresh_token }) {
  return new Promise((resolve, reject) => {
    console.log("PERSIST ACCESS TOKEN", access_token);
    console.log("PERSIST REFRESH TOKEN", refresh_token);

    const options = {
      url: "https://api.login.yahoo.com/openid/v1/userinfo",
      method: "get",
      json: true,
      auth: {
        bearer: access_token,
      },
    };

    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        const userObj = {
          id: body.sub,
          name: body.nickname,
          avatar: body.profile_images.image64,
          accessToken: access_token,
          refreshToken: refresh_token,
        };

        app.user = userObj;

        return resolve();
      }
    });
  });
};

app.yf = new YahooFantasy(
  APP_KEY,
  APP_SECRET,
  app.tokenCallback,
  "https://www.fantasyanalyzer.local/auth/yahoo/callback"
);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    // store: new RedisStore({
    //   host: process.env.REDIS_HOST || require("./conf.js").REDIS_HOST,
    //   port: process.env.REDIS_PORT || require("./conf.js").REDIS_PORT
    // }),
    secret: process.env.SESSION_SECRET || require("./conf.js").SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
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
  (req, res) => {
    app.yf.auth(res);
  }
  // passport.authenticate("oauth2", { failureRedirect: "/login" }),
  // function (req, res, user) {
  //   res.redirect("/");
  // }
);

app.get("/auth/yahoo/callback", (req, res) => {
  app.yf.authCallback(req, (err) => {
    if (err) {
      return res.redirect("/error");
    }

    return res.redirect("/");
  });
  // passport.authenticate("oauth2", { failureRedirect: "/login" }),
  // function (req, res) {
  // }
});

app.get("/logout", function (req, res) {
  // todo: fix this...
  req.logout();
  res.redirect(req.session.redirect || "/");
});

function checkAuth(req, res, next) {
  let userObj;

  if (req.app.user) {
    userObj = {
      name: req.app.user.name,
      avatar: req.app.user.avatar,
    };
  } else {
    userObj = null;
  }

  req.userObj = userObj;

  next();
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;

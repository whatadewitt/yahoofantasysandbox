var _ = require('lodash');
var https = require('https');
var request = require('request');

exports.index = function(req, res) {
  req.session.redirect = '/';

  res.render('index', {
    activeClass: 'home',
    data: {
      resource: ''
    },
    user: req.userObj
  });
};

exports.console = function(req, res) {
  var userObj = {},
    resource = req.params.resource,
    subresource = req.params.subresource,
    view = resource + '/' + subresource;

  req.session.redirect = req.url;

  res.render(view, {
    user: req.userObj,
    data: {
      resource: resource,
      subresource: subresource
    }
  });
};

exports.getData = function(req, res) {
  var func;
  var yf = req.app.yf,
    resource = req.params.resource,
    subresource = req.params.subresource,
    query = req.query;

  Object.map = function(obj) {
    var key, arr = [];
    for (key in obj) {
        arr.push(obj[key]);
    }
    return arr;
  };

  var args = Object.map(query);

  var callback = function callback(err, data) {
    if (err) {
      var reason = String(err.description).match( /"(.*?)"/ );
      
      if ( reason && 'token_expired' === reason ) {
        var options = {
          url: 'https://api.login.yahoo.com/oauth2/get_token',
          method: 'post',
          json: true,
          form: {
            client_id: process.env.APP_KEY || require('../conf.js').APP_KEY,
            client_secret: process.env.APP_SECRET || require('../conf.js').APP_SECRET,
            redirect_uri: 'oob',
            refresh_token: req.user.refreshToken,
            grant_type: 'refresh_token'
          }
        };

        request(options, function (error, response, body) {
          if ( error ) {
            res.json( { error: "Couldn't renew token..." } );
          }

          yf.setUserToken(body.access_token);
          req.user.accessToken = body.access_token;
          req.user.refreshToken = body.refresh_token;

          // re-try the request
          console.log("re-trying request...");
          console.log(resource, subresource)
          yf[resource][subresource].apply(yf[resource], args);
        });
      } else {
        res.json(err);
      }
    } else {
      res.json(data);
    }
  };

  if ( _.has(query, 'filters') ) {
    query.filters = JSON.parse(query.filters);
  }

  if ( _.has(query, 'subresources') ) {
    query.subresources = query.subresources.split(',');
  }

  args = _.values(query);
  args.push(callback);
    
  // arg length descriptions
    // 5 - i think this only happens with transactions.adddrop_player 
    // 4 - would be key, filters, subs, callback
    // 3 - would be key, filters or subs, callback for collection
      // could be key, another key, callback too...
    // 2 - would be key or filters or subs, callback
    // 1 - callback only...
  
  console.log(resource, subresource, args);
  yf[resource][subresource].apply(yf[resource], args);
};

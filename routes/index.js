var YahooFantasy = require('yahoo-fantasy');

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
  var yf = new YahooFantasy(req.yahoo.key, req.yahoo.secret),
    resource = req.params.resource,
    subresource = req.params.subresource,
    query = req.query;

  if ( req.isAuthenticated() ) {
    yf.setUserToken(req.user.accessToken, req.user.tokenSecret);
  } else {
    yf.setUserToken(null, null);
  }

  func = yf[resource][subresource];

  Object.map = function(obj) {
    var key, arr = [];
    for (key in obj) {
        arr.push(obj[key]);
    }
    return arr;
  };

  var args = Object.map(query);

  var callback = function callback(data) {
    res.json(data);
  }

  if ( 1 == args.length ) {
    func(
      args[0],
      callback
    );
  } else if ( 2 == args.length ) {
    func(
      args[0],
      args[1],
      callback
    );
  } else {
    func(callback);
  }
}

process.env.NODE_ENV = process.env.NODE_ENV || 'development';  
var config=require('./config/config.json')[process.env.NODE_ENV];
var express = require('express');
var path = require('path');	
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var rewrite = require('express-urlrewrite');
//var bodyParser = require('body-parser');
var restful   = require('sequelize-restful');
var fs = require("fs");
var models = require("./models");
//var routes = require('./routes');
var passport=require('passport');
var GitHubStrategy = require('passport-github2').Strategy

var app = express();
passport.use(new GitHubStrategy({
    clientID: config.GITHUB_CLIENT_ID,
    clientSecret: config.GITHUB_SECRET,
    callbackURL: "http://wikitimetable.com/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    models.User.findOrCreate({ username: profile.id , email:profile.email }, function (err, user) {
      return done(err, user);
    });
  }
));

	  app.set('views', __dirname + '/views');
	  app.set('view engine', 'ejs');
//	  app.use(logger());
	  app.use(cookieParser());
//	  app.use(bodyParser());
//	  app.use(methodOverride());
	  app.use(rewrite('/','/index.html'));
	  app.use(session({ secret: config.GEE_SECRET }));
	  // Initialize Passport!  Also use passport.session() middleware, to support
	  // persistent login sessions (recommended).
	  app.use(passport.initialize());
	  app.use(passport.session());
//	  app.use(app.router);
	  app.use('/dummy-api',express.static(__dirname + '/dummy-api'));
	  app.use(express.static(__dirname + '/node_modules'));
	  app.use(express.static(__dirname + '/client/javascript'));
	  app.use(express.static(__dirname + '/client/html'));
	  app.use(express.static(__dirname + '/client/templates'));
	  app.use(express.static(__dirname + '/public'));
	  app.use(restful(models.sequelize, { endpoint:config.apibase /* options */ }));
	

passport.serializeUser(function(user, done) {
	  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	  User.findById(id, function(err, user) {
	    done(err, user);
	  });
});
	
app.all('/*', function(req, res, next) {
	// CORS headers
	res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	// Set custom headers for CORS
	res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
	if (req.method == 'OPTIONS') {
		res.status(200).end();
	} else {
		next();
	}
});

app.all('/api/v1/*', [require('./middlewares/validateRequest')]);

app.get('/auth/github',
		  passport.authenticate('github', { scope: [ 'user:email' ] }),
		  function(req, res){
		    // The request will be redirected to GitHub for authentication, so this
		    // function will not be called.
		  });

app.get('/auth/github/callback', 
		  passport.authenticate('github', { failureRedirect: '/login' }),
		  function(req, res) {
		    res.redirect('/');
		  });

// Start the server
app.set('port', process.env.PORT || 3000);
var server = app.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + server.address().port);
});


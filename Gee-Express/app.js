var express = require('express');
var app = express();
var restful   = require('sequelize-restful-extended');

var fs = require("fs");
var models = require("./models");
var debug = require("debug");
var bodyParser = require('body-parser');
var routes = require('./routes');

app.use(bodyParser());
app.set('view engine', 'jade');

app.get('/', routes.home);
console.log("routing to users");
app.use('/users', routes.user);

//app.get('/user', routes.user);
//app.use(restful(models.sequelize, { /* options */ }));

module.exports = app;
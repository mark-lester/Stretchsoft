'use strict';
var Sequelize=require("sequelize");
var findOrCreate=require('./findOrCreate');
module.exports = function(sequelize, DataTypes){
	var User = sequelize.define('User', {
		username: {type : DataTypes.STRING, unique : 'UserIndex'},
		email: DataTypes.STRING
		}, {
		classMethods: {
			associate: function(models) {
				User.hasMany(models.Task);
				User.hasMany(models.Instance);
			}
          }
		},
		Sequelize.Utils._.extend({
		    instanceMethods: {
		        findOrCreate:findOrCreate
		      }
		 })
    );
	return User;
};

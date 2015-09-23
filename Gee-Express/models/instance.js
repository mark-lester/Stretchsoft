/*
 */
module.exports = function (sequelize, DataTypes) {
	var Instance = sequelize.define('Instance', {
		name: DataTypes.STRING,
		write: DataTypes.BOOLEAN,
		read: DataTypes.BOOLEAN
		}, {
		classMethods: {
			associate: function(models) {
				Instance.hasMany(models.Agency);
				Instance.hasMany(models.Route);
				Instance.hasMany(models.Stop);
				Instance.belongsTo(models.User);
			}
		}
	},{
		hooks:{
			beforeCreate:function(instance, fn) {
                console.log("want to create an instance for user "+instance.UserId);
			}
		}
	});
	return Instance;
};

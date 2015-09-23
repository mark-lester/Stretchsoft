/*
	service_id VARCHAR(255) NOT NULL UNIQUE KEY,
	monday INTEGER,
	tuesday INTEGER,
	wednesday INTEGER,
	thursday INTEGER,
	friday INTEGER,
	saturday INTEGER,
	sunday INTEGER,
	start_date  VARCHAR(255),	
	end_date  VARCHAR(255)
 */

module.exports = function (sequelize, DataTypes) {
	var Calendar = sequelize.define('Calendar', {
		InstanceId : {type : DataTypes.INTEGER, unique : 'calendarUIndex'},
		service_id : {type : DataTypes.STRING, unique : 'calendarUIndex'},
		monday: DataTypes.BOOLEAN,
		tuesday: DataTypes.BOOLEAN,
		wednesday: DataTypes.BOOLEAN,
		thursday: DataTypes.BOOLEAN,
		friday: DataTypes.BOOLEAN,
		saturday: DataTypes.BOOLEAN,
		sunday: DataTypes.BOOLEAN,
		start_date: DataTypes.DATE,
		end_date: DataTypes.DATE
		}, {
		classMethods: {
			associate: function(models) {
				Calendar.hasMany(models.CalendarDate);
				Calendar.belongsTo(models.Instance,{
					onDelete: "CASCADE",
				});
			},
		csv_mapping :{ // dont need any, the names are all the same
				monday:'monday'
			},
		parent_key_mapping : function(){
				return {}
			},
		},

	});
	return Calendar;
};
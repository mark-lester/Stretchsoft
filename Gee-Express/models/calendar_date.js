/*
	service_id VARCHAR(255) NOT NULL,
	`date`  VARCHAR(255) ,
	exception_type INTEGER,
	KEY `service_id` (service_id),
	KEY `exception_type` (exception_type),
	FOREIGN KEY (service_id) references calendar(service_id) on delete cascade on update cascade
 */

module.exports = function (sequelize, DataTypes) {
	var CalendarDate = sequelize.define('CalendarDate', {
		InstanceId : {type : DataTypes.INTEGER, unique : 'calendarDateUIndex'},
		CalendarId : {type : DataTypes.INTEGER, unique : 'calendarDateUIndex'},
		date : {type : DataTypes.DATE, unique : 'calendarDateUIndex'},
		exception_type: DataTypes.ENUM('1','2'),
		}, {
		classMethods: {
			associate: function(models) {
				CalendarDate.belongsTo(models.Instance,{
					onDelete: "CASCADE",
				});
				CalendarDate.belongsTo(models.Calendar,{
					onDelete: "CASCADE",
				});
			}
		}
	});
	return CalendarDate;
};

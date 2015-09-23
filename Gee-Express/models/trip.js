/*	
	trip_id VARCHAR(255) NOT NULL UNIQUE KEY,
	route_id VARCHAR(255) NOT NULL,
	service_id VARCHAR(255) NOT NULL,
	trip_headsign VARCHAR(255),
	trip_short_name VARCHAR(255),
	direction_id INTEGER,
	block_id VARCHAR(255),
	shape_id VARCHAR(255),
	wheelchair_accessible INTEGER,
	KEY `route_id` (route_id),
	KEY `service_id` (service_id),
	KEY `direction_id` (direction_id),
	KEY `block_id` (block_id),
	FOREIGN KEY (route_id) references routes(route_id) on delete cascade on update cascade,
	FOREIGN KEY (service_id) references calendar(service_id)
*/
module.exports = function (sequelize, DataTypes) {
    var Trip = sequelize.define('Trip', {
        InstanceId : {type : DataTypes.INTEGER, unique : 'tripUIndex'},
        code: {type : DataTypes.STRING, unique : 'tripUIndex'},
        headsign: DataTypes.STRING,
        short_name: DataTypes.STRING,
        direction_id: DataTypes.ENUM('0','1'),
        whilechair_accessible: DataTypes.BOOLEAN,
        block_id: DataTypes.STRING
       }, {
         classMethods: {
            associate: function(models) {
                Trip.belongsTo(models.Instance,{
					onDelete: "CASCADE",
				});
                Trip.belongsTo(models.Route,{
					onDelete: "CASCADE",
				});
                Trip.belongsTo(models.Calendar,{
					onDelete: "CASCADE",
				});
                Trip.hasMany(models.Shape);
                Trip.hasMany(models.StopTime);
             },
			csv_mapping:{
				trip_id : 'code',
				route_id : 'RouteCode',
				service_id : 'ServiceCode',
				trip_headsign: 'headsign',
				trip_short_name :'short_name',
				direction_id :'direction_id' ,
				whilechair_accessible :'whilechair_accessible' ,
				block_id : 'block_id' 
			},
			parent_key_mapping : function(models){
				return {
					RouteCode: { entity: models.Route, foreign_key : 'code' , native_key : 'RouteId'},
					ServiceCode: { entity: models.Calendar, foreign_key : 'service_id' , native_key : 'CalendarId'}
				};
			},
         },
       });
    return Trip;
 };

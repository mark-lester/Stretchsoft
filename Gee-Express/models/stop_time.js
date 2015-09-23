/*	
	trip_id VARCHAR(255) NOT NULL,
	arrival_time VARCHAR(255),
	departure_time VARCHAR(255),
	stop_id VARCHAR(255) NOT NULL,
	stop_sequence SMALLINT UNSIGNED NOT NULL,
	stop_headsign VARCHAR(255),
	pickup_type INTEGER,
	drop_off_type INTEGER,
	shape_dist_traveled DECIMAL(10,4) DEFAULT 0,
	KEY `trip_id` (trip_id),
	KEY `stop_id` (stop_id),
	KEY `stop_trip_id` (stop_id,trip_id),
	KEY `trip_stop_id` (trip_id,stop_id),
	KEY `stop_sequence` (stop_sequence),
	KEY `pickup_type` (pickup_type),
	KEY `drop_off_type` (drop_off_type),
	FOREIGN KEY (trip_id) references trips(trip_id) on delete cascade on update cascade,
	FOREIGN KEY (stop_id) references stops(stop_id) on delete cascade on update cascade
*/
module.exports = function (sequelize, DataTypes) {
    var StopTime = sequelize.define('StopTime', {
        InstanceId : {type : DataTypes.INTEGER, unique : 'stopTimeUIndex'},
        StopId: {type : DataTypes.INTEGER, unique : 'stopTimeUIndex'},
        TripId: {type : DataTypes.INTEGER, unique : 'stopTimeUIndex'},
        sequence: DataTypes.INTEGER,
        headsign: DataTypes.STRING,
        pickup_type: DataTypes.ENUM('0','1','2','3'),
        drop_off_type: DataTypes.ENUM('0','1','2','3'),
        shape_dist_traveled: DataTypes.DECIMAL(8,2)
       }, {
         classMethods: {
            associate: function(models) {
                StopTime.belongsTo(models.Instance,{
					onDelete: "CASCADE",
				});
                StopTime.belongsTo(models.Trip,{
					onDelete: "CASCADE",
				});
                StopTime.belongsTo(models.Stop,{
					onDelete: "CASCADE",
				});
             },
			csv_mapping:{
				trip_id : 'TripCode',
				arrival_time: 'arrival_time',
				departure_time :'departure_time',
				stop_id : 'StopCode',
				stop_sequence : 'sequence',
				stop_headsign :'headsign' ,
				pickup_type :'pickup_type' ,
				drop_off_type :'drop_off_type' ,
				shape_dist_traveled :'shape_dist_traveled' ,
			},
			parent_key_mapping : function(models){
				return {
					TripCode: { entity: models.Trip, foreign_key : 'code' , native_key : 'TripId'},
					StopCode: { entity: models.Stop, foreign_key : 'code' , native_key : 'StopId'}
				};
			},
         },

       });
    return StopTime;
 };

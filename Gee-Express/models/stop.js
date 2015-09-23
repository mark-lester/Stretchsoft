/*
 * 	stop_id VARCHAR(255) NOT NULL UNIQUE KEY,
	stop_code VARCHAR(255),
	stop_name VARCHAR(255) NOT NULL,
	stop_desc VARCHAR(255),
	stop_lat DECIMAL(12,8) NOT NULL,
	stop_lon DECIMAL(12,8) NOT NULL,
	zone_id VARCHAR(255),
	stop_url VARCHAR(255),
	location_type INTEGER,
	parent_station VARCHAR(255),
	KEY `zone_id` (zone_id),
	KEY `stop_lat` (stop_lat),
	KEY `stop_lon` (stop_lon)

 */
module.exports = function (sequelize, DataTypes) {
    var Stop = sequelize.define('Stop', {
        InstanceId : {type : DataTypes.INTEGER, unique : 'stopUIndex'},
		code : {type : DataTypes.STRING, unique : 'stopUIndex'},
        name: DataTypes.STRING,
        lat: DataTypes.DECIMAL(12,8),
        lon: DataTypes.DECIMAL(12,8),
        zone_id: DataTypes.STRING,
        location_type: DataTypes.ENUM('0','1'),
        parent_station : DataTypes.STRING
       }, {
         classMethods: {
            associate: function(models) {
                Stop.hasMany(models.StopTime);
                Stop.belongsTo(models.Instance,{
					onDelete: "CASCADE",
				});
             },
		csv_mapping:{
				stop_code : 'code',
				stop_name: 'name',
				stop_desc :'desc',
				stop_lat :'lat' ,
				stop_lon :'lon' ,
				zone_id : 'zone_id' ,
				location_type : 'location_type' ,
				parent_station :'parent_station' ,
			},
		parent_key_mapping : function(models){
				return {
				};
			},
         },

       });
    return Stop;
 };

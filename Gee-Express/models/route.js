/*
	route_short_name VARCHAR(255),
	route_long_name VARCHAR(255),
	route_desc VARCHAR(255),
	route_type INTEGER,
	route_url VARCHAR(255),
	route_color VARCHAR(255),
	route_text_color VARCHAR(255),
	KEY `agency_id` (agency_id),
    FOREIGN KEY (agency_id) 
        REFERENCES agency(agency_id)
        on delete cascade on update cascade

 */

module.exports = function (sequelize, DataTypes) {
	var Route = sequelize.define('Route', {
		InstanceId : {type : DataTypes.INTEGER, unique : 'routeUIndex'},
		short_name : {type : DataTypes.STRING, unique : 'routeUIndex'},
		code: DataTypes.STRING,
		long_name: DataTypes.STRING,
		desc: DataTypes.STRING,
		type: DataTypes.STRING,
		url: DataTypes.STRING,
		color: DataTypes.STRING,
		text_color: DataTypes.STRING,
		}, {
		classMethods: {
			associate: function(models) {
				Route.hasMany(models.Trip);
				Route.belongsTo(models.Instance,{
					onDelete: "CASCADE",
				});
				Route.belongsTo(models.Agency,{
					onDelete: "CASCADE",
				});
			},
			csv_mapping:{
				route_id : 'code',
				agency_id : 'AgencyCode',
				route_short_name: 'short_name',
				route_long_name :'long_name',
				route_desc :'desc' ,
				route_type :'type' ,
				route_url : 'url' ,
				route_color :'color' ,
				route_text_color : 'text_color' 
			},
			parent_key_mapping : function(models){
				return {AgencyCode: { entity: models.Agency, foreign_key : 'code' , native_key : 'AgencyId'}};
			},
		},

	});
	return Route;
};
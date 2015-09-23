/*
 * 	agency_id VARCHAR(255) UNIQUE KEY,
	agency_name VARCHAR(255) NOT NULL,
	agency_url VARCHAR(255) NOT NULL,
	agency_timezone VARCHAR(255) NOT NULL,
	agency_lang VARCHAR(255),
	agency_phone VARCHAR(255)

 */
module.exports = function (sequelize, DataTypes) {
	var Agency = sequelize.define('Agency', {
		InstanceId : {type : DataTypes.INTEGER, unique : 'agencyUIndex'},
		code : {type : DataTypes.STRING, unique : 'agencyUIndex'},
		name: {type: DataTypes.STRING, defaultValue:"default name"},
		url: DataTypes.STRING,
		timezone: DataTypes.STRING,
		lang: DataTypes.STRING,
		phone: DataTypes.STRING,
		fare_url: DataTypes.STRING,
		}, {
		classMethods: {
			associate: function(models) {
				Agency.hasMany(models.Route);
				Agency.belongsTo(models.Instance,{
					onDelete: "CASCADE",
					foreignKey: {
						allowNull: false
						}
				});
			},
			csv_mapping :{
				agency_id:'code',
				agency_name:'name',
				agency_url:'url',
				agency_timezone:'timezone',
				agency_lang:'lang',
				agency_phone:'phone',
				agency_fare_url:'fare_url'
			},
			parent_key_mapping : function(){
				return {};
			},
		}
	});

	return Agency;
};

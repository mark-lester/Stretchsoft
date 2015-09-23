/*
	fare_id VARCHAR(255) NOT NULL UNIQUE KEY,
	price VARCHAR(255) NOT NULL,
	currency_type VARCHAR(255) NOT NULL,
	payment_method INTEGER,
	transfers VARCHAR(255),
	transfer_duration VARCHAR(255) 
 */

module.exports = function (sequelize, DataTypes) {
	var FareAttribute = sequelize.define('FareAttribute', {
		InstanceId : {type : DataTypes.INTEGER, unique : 'fareAttrubuteUIndex'},
		fare_code : {type : DataTypes.STRING, unique : 'fareAttrubuteUIndex'},
		price : DataTypes.DECIMAL(8,2),
		currency_type : DataTypes.STRING,
		payment_method : DataTypes.ENUM('0','1'),
		transfers : DataTypes.ENUM('0','1','2'),
		transfer_duration: DataTypes.INTEGER
		}, {
		classMethods: {
			associate: function(models) {
				FareAttribute.belongsTo(models.Instance,{
					onDelete: "CASCADE",
				});
				FareAttribute.hasMany(models.FareRule);
			}
		}
	});
	return FareAttribute;
};

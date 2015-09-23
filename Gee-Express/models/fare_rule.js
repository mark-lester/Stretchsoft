/*
	fare_id VARCHAR(255),
	route_id VARCHAR(255),
	origin_id VARCHAR(255),
	destination_id VARCHAR(255),
	contains_id VARCHAR(255)/*,
 */

module.exports = function (sequelize, DataTypes) {
	var FareRule = sequelize.define('FareRule', {
		InstanceId : {type : DataTypes.INTEGER, unique : 'fareRuleUIndex'},
		FareAttributeId : {type : DataTypes.INTEGER, unique : 'fareRuleUIndex'},
		RouteId : {type : DataTypes.INTEGER, unique : 'fareRuleUIndex'},
		origin_id : {type : DataTypes.INTEGER, unique : 'fareRuleUIndex'},
		destination_id : {type : DataTypes.INTEGER, unique : 'fareRuleUIndex'},
		contains_id : {type : DataTypes.INTEGER, unique : 'fareRuleUIndex'},
		}, {
		classMethods: {
			associate: function(models) {
				FareRule.belongsTo(models.Instance,{
					onDelete: "CASCADE",
				});
				FareRule.belongsTo(models.FareAttribute,{
					onDelete: "CASCADE",
				});
				FareRule.belongsTo(models.Stop,{
					foreignKey: 'origin_id',
				});
				/* we need a constraint that the zone_id is in use, I think
				FareRule.belongsTo(models.Stop,{
					foreignKey: 'contains_id',
					targetKey:'zone_id'
				});
				*/
			}
		}
	});
	return FareRule;
};
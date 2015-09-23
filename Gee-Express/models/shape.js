/*	
	shape_id VARCHAR(255) NOT NULL,
	shape_pt_lat DECIMAL(12,8) NOT NULL,
	shape_pt_lon DECIMAL(12,8) NOT NULL,
	shape_pt_sequence INT UNSIGNED NOT NULL, 
	shape_dist_traveled DECIMAL(10,4),
*/
module.exports = function (sequelize, DataTypes) {
    var Shape = sequelize.define('Shape', {
        InstanceId : {type : DataTypes.INTEGER, unique : 'shapeUIndex'},
        code: {type : DataTypes.STRING, unique : 'shapeUIndex'},
        pt_sequence: {type : DataTypes.INTEGER, unique : 'shapeUIndex'},
        pt_lat : DataTypes.DECIMAL(12,8),
        pt_lon : DataTypes.DECIMAL(12,8),
        dist_traveled : DataTypes.DECIMAL(10,4),
       }, {
         classMethods: {
            associate: function(models) {
                Shape.belongsTo(models.Instance,{
					onDelete: "CASCADE",
				});
                Shape.hasMany(models.Trip);
             }
         }
       });
       return Shape;
 };

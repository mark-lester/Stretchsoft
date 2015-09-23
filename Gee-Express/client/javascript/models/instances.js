/**
 * Instance Collection
 */
define(['models/GTFS-collection.js','models/instance.js'], function(GTFScollection,Model){
	 return GTFScollection.extend({
		 objectPlural:'Instances',
		 model:Model
     })
});

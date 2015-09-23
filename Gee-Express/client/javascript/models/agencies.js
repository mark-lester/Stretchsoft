/**
 * Agency Collection
 */
define(['models/GTFS-collection.js','models/agency.js'], function(GTFScollection,Model){
	 return GTFScollection.extend({
		 objectPlural:'Agencies',
		 model:Model
     })
});

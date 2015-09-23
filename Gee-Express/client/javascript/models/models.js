define(['models/GTFS-model.js','models/GTFS-collection.js','models/plurals.js'], 
		function(GTFSmodel,GTFScollection,plurals){
	var struct={Models:{},Collections:{}};
	
    struct.Models.Instance= new (GTFSmodel.extend({
    	entity_name:'Instance',
        	}))();
    
    struct.Models.Agency= new (GTFSmodel.extend({
    	entity_name:'Agency',
    	parent:'Instance',
    }))();


    struct.Collections.Instance= new (GTFScollection.extend({
    	entity_name:'Instance',
    }))();

    struct.Collections.Agency= new (GTFScollection.extend({
    	entity_name:'Agency',
    	parent:'Instance',
    }))();

    struct.Collections.Calendar= new (GTFScollection.extend({
    	entity_name:'Calendar',
    	parent:'Instance',
        display:'service_id'
    }))();

    struct.Collections.CalendarDate= new (GTFScollection.extend({
    	entity_name:'CalendarDate',
    	parent:'Calendar',
    	display:'date'
    }))();

    struct.Collections.FareAttribute= new (GTFScollection.extend({
    	entity_name:'FareAttribute',
    	parent:'Instance',
    	display:'fare_code'
    }))();

    struct.Collections.FareRule= new (GTFScollection.extend({
    	entity_name:'FareRule',
    	parent:'FareAttribute',
    }))();
    
    struct.Collections.Route= new (GTFScollection.extend({
    	entity_name:'Route',
    	parent:'Agency',
    	display:'code'
    }))();
    
    struct.Collections.Shape= new (GTFScollection.extend({
    	entity_name:'Shape',
    	parent:'Instance',
    }))();
    
    struct.Collections.StopTime= new (GTFScollection.extend({
    	entity_name:'StopTime',
    	parent:'Trip',
    	display:'StopId',
        foreign:{
    		name:'Stop',
    		key:'StopId',
    	    show:'name'
    	}
    }))();
    
    struct.Collections.Stop= new (GTFScollection.extend({
    	entity_name:'Stop',
    	parent:'Instance',
    	display:'StopId',
    }))();
    
    struct.Collections.Trip= new (GTFScollection.extend({
    	entity_name:'Trip',
    	parent:'Route',
    	display:'code'
    }))();

    struct.Collections.User= new (GTFScollection.extend({
    	entity_name:'User',
    }))();
    
    return struct;
});

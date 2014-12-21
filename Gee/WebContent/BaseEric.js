
function Eric (ED) {
	this.ED=ED; // jquery element for the entire block of Eric Declaration
    this.UIobject; // jquery element for the  the select list, which will by where the place holder is 
    this.name;  // entity name, e.g Stops
    this.parent_name; // parent name
    this.parent=null; // parent Eric
    this.secondParent=null;
    this.data = []; // data array from REST
    this.children=[]; // array of child Erics
    this.relations={}; // all the stuff we need to work out how to cook up a REST url
    this.dialogs={}; // array of dialogs, edit and delete, to attach to the blue,red,green buttons
    this.RESTUrlBase = "/Gee/";
    this.hid_lookup = {};
    this.record_lookup = {};
    this.relations={};
    this.edit_flag=false; // used to re-use the edit dialog for create
    this.seed=null;
    this.current_request=null;
    this.full_set = false; // 
    
    this.queue = jQuery.jqmq({    
        // Next item will be processed only when queue.next() is called in callback.
        delay: -1,
        // Process queue items one-at-a-time.
        batch: 1,
        // For each queue item, execute this function,
        eric :  this,
        callback: function( request_struct ) {
        	var queue=this;
        	// immediately remove it from the list of currently queued requests, allowing for a 
        	// reissue of a a request in execution
    		queue.current_requests[request_struct.request]=undefined;
        	queue.active=true;
        	eric.current_request=request_struct.request;
        	if (DEBUG)console.log("executing request="+eric.current_request+
        			" on "+eric.name+" with "+request_struct.data+
        			" ref = "+typeof(this.eric[request_struct.request]));
        		
        	$.when(this.eric[request_struct.request](request_struct.data)).done(function (){
              	eric.current_request=null;      			
   if(DEBUG)console.log("I finished "+request_struct.request+" on "+eric.name);
   				queue.active=false;
        		if (request_struct.callback != undefined){
        			request_struct.callback(request_struct);
        		}
            	queue.next();        		
        	});
        },
        
        // When the queue completes naturally, execute this function.
        complete: function(){
        }
    });
    this.queue.eric = this;
    this.queue.current_requests={};
    this.name = $(ED).attr('id');
    this.title = $(ED).attr('title') || $(ED).find("#select label").text();
	this.parent_name = $(ED).attr('parent') || $(ED).find('#edit input[id=parentTable]').val();
	this.relations={
			method 				: $(ED).attr('method') || "Entity",
			no_join 			: $(ED).attr('no_join'),
			key 				: $(ED).find('#edit input[key]').attr('name'),
			order 				: $(ED).find('#edit input[order]').attr('name'),
			joinkey 			: $(ED).find('#edit input[joinkey]').attr('name'),
			display 			: $(ED).find('#edit input[display]').attr('name'),
			parentKey 			: $(ED).find('#edit input[id=parentKey]').attr('value'),
			parentTable 		: $(ED).find('#edit input[id=parentTable]').attr('value'),
			extendKey 			: $(ED).find('#edit input[id=extendKey]').attr('name'),
			extendTable 		: $(ED).find('#edit input[id=extendTable]').attr('name'),
			secondParentKey 	: $(ED).find('#edit input[id=secondParentKey]').attr('value'),
			secondParentTable 	: $(ED).find('#edit input[id=secondParentTable]').attr('value'),
			display				: []
	};
//	$(ED).find('#edit input[id=extendKey]').attr('value');
	var eric=this;
	$(this.ED).find('#edit :input[display]').each(function (){
		eric.relations.display.push($(this).attr('name'));			
	});
	if (!this.relations.display.length){
		this.relations.display.push(this.relations.key);		
	}
	if (this.relations.order == undefined){
		this.relations.order=this.relations.display[0];
	}
if(DEBUG)console.log("CONFIG "+this.name+" = "+JSON.stringify(this.relations));
    this.type_specific();
    
	
	switch (this.name){
	case "Shapes":
		this.lat_name="shapePtLat";
		this.lon_name="shapePtLon";
		break;
	case "Stops":
		this.lat_name="stopLat";
		this.lon_name="stopLon";
		break;	
	}
}

Eric.prototype.request = function(request,data,callback,priority) {
	if (this.queue.current_requests[request]){
		if(DEBUG)console.log("not issuing currently queued request "+request+" on "+this.name+" with data "+data);
		return;
	}
	if(DEBUG)console.log("Asking for  "+request+
			" on "+this.name+
			" with "+data+
				" length "+this.queue.size()+
				" current request ="+this.current_request
				);
		switch (request){
		case "Load":
//			this.queue.clear();  //  Load invalidates anything else on the queue
		case 'open_edit_dialog':
		case 'open_tabular_dialog':
			priority=true;
		}
		this.queue.current_requests[request]=true;
		this.queue.add({request : request, data : data, callback:callback},priority);
	};

	
Eric.prototype.Empty = function (){
		this.data=null;
		this.queue.clear();
		for (var child in this.children){
			this.children[child].Empty();
		}
};


Eric.prototype.PrintTree = function(indent){
	var indent_string=""+indent+" ";
	for (var i=0;i<indent;i++){
		indent_string=indent_string+"----";
	}
if(DEBUG)console.log(indent_string+"I am "+this.name+" child of "+this.parent_name+" and I am the parent of");
	for (var index in this.children){
		this.children[index].PrintTree(indent+1);
	}	
if(DEBUG)console.log(indent_string+"============= end of "+this.name);
};

// STANDARD CONSTRUCTOR. 
// Creates a drop down select, and the dialogs 
Eric.prototype.type_specific = function() {

    this.ProcessDialogs(); // get them ready for the buttons
    this.MakeUIobject();  //  make the UI object and plonk in the place holder
    
    // and finally, get the select to fire off a LoadChildren when it changes
    var eric=this;
    $(this.UIobject).find("select").change(function(){
    	// TODO - abstract this 
    	if (eric.name == "Instance"){
    		// we're changing databases
    		// TODO - abstract this into a method we can override for Instance
    		 setCookie("gee_databasename",$(this).val());
    		 $KingEric.Empty();  //  clear everything
    	}
    	eric.request("Changed",true);
    });
};

 
Eric.prototype.addChild = function(child) {
    return this.children.push(child);
};

Eric.prototype.set_border_colour = function(colour) {
	$(this.UIobject).find("#template-select-table").attr("style","border: 2px solid "+colour+";");
};

Eric.prototype.select_entity = function() {
	return $(this.UIobject).find("select");
};
Eric.prototype.value = function(value) {
	if (value != undefined)
		return $(this.select_entity()).val(value);
	return $(this.select_entity()).val();
};
Eric.prototype.text = function(text) {
	if (text != undefined)
		return $(this.select_entity()).text(text);
	return $(this.select_entity()).text();
};
Eric.prototype.first = function() {
	return $(this.select_entity()).first();
};

Eric.prototype.currentRecord = function() {
	return this.record_lookup[this.value()];
};

Eric.prototype.select_empty = function() {
	$(this.select_entity()).empty();
};

Eric.prototype.getrecord = function(key) {
	return this.record_lookup[key];
};

Eric.prototype.Chain = function(chain) {
	$KingEric.get(chain.queue).request(chain.func);
};

// this is just called by stops and shapes, perhaps can be abstracted to object specific classes
Eric.prototype.getMapDims = function() {
	var bounds;
	
	try{
		bounds=GeeMap.getBounds();
		var minll=bounds.getSouthWest();
		var maxll=bounds.getNorthEast();
		this.lat_min = minll.lat;
		this.lon_min = minll.lng;
		this.lat_max = maxll.lat;
		this.lon_max = maxll.lng;
		
	} catch (err) {
		// map not set up yet, so fetch the lot 
		this.lat_min = -90;
		this.lon_min = -180;
		this.lat_max = 90;
		this.lon_max = 180;
	}
};
	
// called by Instance entity on load
// needed by shapes and stops fetches to know how big the geoset actually is
Eric.prototype.GetMapBounds = function() {
	var eric=this;
	var max_bounds_url="/Gee/Mapdata"+
	"?action=bounds";
	var $dfd = $.getJSON(max_bounds_url, 
				function( data ) {
					eric.bounds_lat_min=data.minLat; 
					eric.bounds_lat_max=data.maxLat; 
					eric.bounds_lon_min=data.minLon; 
					eric.bounds_lon_max=data.maxLon; 
		});
		return $dfd;
};

Eric.prototype.entityCount = function() {
	var eric=this;
	    this.getMapDims();
	    var instance=$KingEric.get("Instance");
		var select_set_size_url="/Gee/Mapdata"+
					"?action=select_set_size"+
					"&entity="+this.name+
					"&lat_name="+this.lat_name+
					"&lon_name="+this.lon_name+
					// the current map view dimensions
					"&lat_min="+this.lat_min+
					"&lon_min="+this.lon_min+
					"&lat_max="+this.lat_max+
					"&lon_max="+this.lon_max+
					// the maxim scope of the geoset, so we know when to stop lookig for more
					"&bounds_lat_min="+instance.bounds_lat_min+
					"&bounds_lat_max="+instance.bounds_lat_max+
					"&bounds_lon_min="+instance.bounds_lon_min+
					"&bounds_lon_max="+instance.bounds_lon_max+					
					"&max_select_size="+MAX_STOPS_TO_VIEW;
		
		var $dfd = $.getJSON(select_set_size_url, 
				function( data ) {		
					eric.select_set_size=data.select_set_size; 
					// the lats and lons may be bigger than just the current view
					// you need this so they dont all disappear when you zoom in
					// and also to fill the whole thing up if we can
					eric.lat_min=data.lat_min; 
					eric.lat_max=data.lat_max;
					eric.lon_min=data.lon_min;
					eric.lon_max=data.lon_max;
					eric.full_set=data.full_set; // will be set to true if we have all of them
					
					if (DEBUG)console.log("got a select size of "+eric.select_set_size);
		});
		return $dfd;
};

Eric.prototype.ConditionalFetch = function(force) {
	if (this.select_set_size == undefined || this.select_set_size > MAX_STOPS_TO_VIEW) {
	    // select_set_size is at least how many on the current view
		// if that is to big, then dont display anything, and highlight this entity
	  	this.set_border_colour('red');
		return;
	}

	if (this.full_set){
		// we have all the stops
		// or we have all the relevant shape points
		this.set_border_colour('green');
	} else {
		// we dont have all of them, but we have at least all the ones in the
		// current map view
		this.set_border_colour('yellow');
	}
    this.bounds=1;
	this.request("Prepare");
	this.request("Fetch");
	this.request("Draw");
	this.request("LoadChildren",force); 
};


Eric.prototype.loadForBounds = function() {
	this.request("entityCount");
	this.request("ConditionalFetch");
};


Eric.prototype.Prepare = function() {
	var relations=this.relations;
	var url=this.RESTUrlBase + relations.method+"?entity="+this.name;
	
    if (relations.parentTable){
		if (relations.joinkey == undefined){
			url+="&field="+relations.parentKey+"&value="+this.parent.value();			
		} else {
			url+="&parent_field="+relations.parentKey+"&value="+this.parent.value()+	
				"&join_key="+relations.joinkey+"&join_table="+relations.parentTable;
		}
	}
    
    if (relations.extendTable){
		if (relations.extendKey == undefined){
			url+="&extend_table="+relations.extendTable+"&extend_key="+this.relations.joinkey;			
		} else {
			url+="&extend_table="+relations.extendTable+"&extend_key="+this.relations.extendKey;			
		}
	}
    
    if (this.bounds){
    	url+="&bounds=1"+
    		"&lat_name="+this.lat_name+
    		"&lon_name="+this.lon_name+
    		"&lat_min="+this.lat_min+
    		"&lon_min="+this.lon_min+
    		"&lat_max="+this.lat_max+
    		"&lon_max="+this.lon_max;	
    }
	
	if (relations.order != undefined){
		url+="&order="+relations.order;
	} else if (relations.display[0] != undefined){
		url+="&order="+relations.display[0];
	}
	this.url=url;
	// stops can do something else as well ...
};


// TODO Flush should be called Clear
Eric.prototype.Flush = function(force) {
	this.data=[];
	this.hid_lookup={};
	this.record_lookup={};
	this.full_set=false;
	for (var child in this.children){
		this.children[child].Flush();
	}
};


Eric.prototype.Load = function(force) {
	switch (this.name){
	case "Instance": 
		initial_map_focus=false;
		zerocount(); 
		this.request("GetMapBounds");
		
	default:
	//	this.Flush();  // wipe everything out, especially the stops
		this.full_set=true;  // by default we fetch everything
		this.request("Prepare");
		this.request("Fetch");
		this.request("Draw",true); 
		this.request("LoadChildren",force); 
		break;

	case "Stops":		
	case "Shapes":	
		if (!this.full_set || force){ 
			this.Flush();
			this.request("loadForBounds");			
		}
		break;			
	}
};

Eric.prototype.Fetch = function(chain) {
	var eric=this;
	var $dfd=new $.Deferred();
	var keys=[];
	this.data=[];
	this.hid_lookup={};
	this.record_lookup={};

	if (DEBUG)console.log("calling fetch on"+this.url);
	$.getJSON(this.url, 
		function( data ) {
			$.each( data, function( key, values ) {
				if (Array.isArray(values)){ // flatten out arrays of joined recs
					var tvalues={};
					// save the hibernate id which should be in the first record
					var hibernateId=values[0].hibernateId;
					while (values.length){
						tvalues=$.extend(tvalues, values[0]); 
						values.shift();
					}

					values=tvalues;
					values.hibernateId=hibernateId;
					var datastring = JSON.stringify(values);
				} 
				// save these for use by the edit and delete dialogs
				eric.hid_lookup[values[eric.relations.key]]=values['hibernateId'];
				eric.record_lookup[values[eric.relations.key]]=values;
				eric.data.push(values);
			});
			if (chain != undefined) eric.request("Chain",chain);

			$dfd.resolve();
			
//			eric.data=sort(eric.record_lookup);
//			eric.request("Draw",true); 
	     }
	);
	return $dfd;
};

//force flag to ensure propagation down the tree with the "Changed" request
//it will originate from create_or_update_entity. 
Eric.prototype.Draw = function(force) { 
	//this.hid_lookup={};
	var save_select_value=this.value();
	if (this.seed){
		save_select_value=this.seed;
	}
	this.select_empty();
	var eric=this;
	var select_entity=this.select_entity();
	$.each( this.data, function( key, values ) {
		$('<option>').val(values[eric.relations.key]).text(
				eric.relations.display.map(
						function (item){return values[item];}
						).join(' ')
				).appendTo(select_entity);	
	});
	
	var no_change=false;
	if (save_select_value &&
			(row_entity = $(select_entity).find("option[value='"+save_select_value+"']")) &&
			(value = $(row_entity).val()) &&
			value.length > 0){
		this.value(save_select_value);
		no_change=true;
	} 
//	this.PopulateTabular();
	if (force || !no_change || this.seed != null) { // only do this if we've changed or were seeded
		this.request("Changed",force);		
	}
	this.seed=null;
	return null;
};

Eric.prototype.Changed = function(force) {
	// we may need to go backup and change an ancestoral table, e,g, the stop if we changed stoptimes
	if (this.relations.secondParentTable){
		var record;
		if (record=this.currentRecord()){
			$KingEric.get(this.relations.secondParentTable)
			.value(record[this.relations.secondParentKey]);
		}
	}
	
	// but either way we've changed, so got get the kids
	this.request("LoadChildren",force);
	return null;
};

Eric.prototype.LoadChildren = function(force) {
	for (var child in this.children){
		this.children[child].request("Load",force);
	}
	return null;
};


// this request accepts edit and create,
var create_dfd;
Eric.prototype.create_or_update_entity = function(data) {
	var eric=this;
	
	$.each( data, function( key, val ) {
		if (val === undefined || val == null || val == 'null') val="";	
		data[key]=""+val;
	});
	data['entity']= this.name; //force this, else you could update a different kind of entity,which  would be ok
								// but then the Draw message will go to the wrong place
	
	if (!data['action'])   // and default to update
		data['action']='update';
	
	var datastring = JSON.stringify(data);
	if (DEBUG)console.log("trying to update "+datastring);
	var $url=this.RESTUrlBase+this.relations.method;

	create_dfd = new $.Deferred();
	$.ajax({
		method:"POST",
		dataType: 'JSON',
		data: {values: datastring},
		url: $url,
		success: function(response){
			eric.seed=data[eric.relations.key]; //let draw know where we should be
			create_dfd.resolve();
			eric.request("PostEdit",data);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			create_dfd.resolve();
			request_error_alert(xhr);
		}		 
	 });
	return create_dfd;
};

var create_table_dfd;
Eric.prototype.create_or_update_table = function(data) {
	create_tabe_dfd = new $.Deferred();
	var dfds=[];
	for (row in this.data){
		if (this.data[row].changed){
			dfds.push(this.create_or_update_entity(this.data[row]));
		}
	}
	$.when.apply($, dfds).done(function(){
		create_table_dfd.resolve();
	});
	return create_table_dfd;
};
	
var edit_dfd;
Eric.prototype.PostEdit = function(record) {
	edit_dfd=null;
	var eric=this;
	edit_dfd=new $.Deferred();
	switch(this.name){ //  on the next refactor I'll abstract this
	case 'StopTimes':
		url="/Gee/Mapdata?action=heal&tripId="+record['tripId'];
				
		$.ajax({
			  url: url,
			  dataType: 'json',
					success: function(response){
						edit_dfd.resolve();
						eric.request("Load",true);
						},
					error: function (xhr, ajaxOptions, thrownError) {
						edit_dfd.resolve();
						request_error_alert(xhr);
						}
			  }
		);
	break;
	case 'Instance':
		if (record['action'] == 'delete') {
			// we just zapped the current DB, so set the DB cookie to the first one
			setCookie("gee_databasename",this.first());
		}
		if (record['action'] == 'create') {
			setCookie("gee_databasename",record['databaseName']);
		}
		
	default:
		eric.request("Load",true);
		edit_dfd.resolve();
	}
	return edit_dfd;
};

var remove_dfd;
Eric.prototype.remove_entity = function(data) {
	var eric=this;
	$.each( data, function( key, val ) {
		if (val === undefined || val == null || val == 'null') 
			val="";
		
		data[key]=""+val;
	});
	data['entity']= this.name; 
	data['action']='delete';
	var datastring = JSON.stringify(data);
	if (DEBUG)console.log("trying to delete "+datastring);
	var $url=this.RESTUrlBase+this.relations.method;
	remove_dfd=new $.Deferred(); 

	$.ajax({
		method:"POST",
		dataType: 'JSON',
		data: {values: datastring},
		url: $url,
		success: function(response){
			remove_dfd.resolve();
			eric.request("Load");
		},
		error: function (xhr, ajaxOptions, thrownError) {
			remove_dfd.resolve();
			request_error_alert(xhr);
		}
	});
	return remove_dfd;
};


Eric.prototype.open_edit_dialog = function (edit_flag){
	this.edit_flag=edit_flag;
	this.dialogs.edit.dialog( "open" );
};

Eric.prototype.open_tabular_dialog = function (){
	this.dialogs.tabular.dialog( "open" );
};

var replicate_dfd;
Eric.prototype.replicate_entity = function (data){
	var eric=this;
	$.each( data, function( key, val ) {
		if (val === undefined || val == null || val == 'null') 
			val="";
		
		data[key]=""+val;
	});
	if (DEBUG)console.log("IN DO REPLICATE sourceTripId="+data.sourceTripId);
	data['entity']= this.name; 
	data['action']='replicate';
	
	
	if (!data['shiftMinutes']) data['shiftMinutes']= "0";
	
	if (data['newStartTime']){
		 var ham=$KingEric.get("StopTimes").currentRecord().departureTime.split(':');
		 var new_ham=data['newStartTime'].split(':');
		 var ot=ham[0]*60 + (ham[1]*1);
		 var nt=new_ham[0]*60+(new_ham[1]*1);
		 data['shiftMinutes']="" + (nt - ot);
	}

	if (data['invertTrip'] == "1"){
		data['invertTrip']="invert";
	}
	
	var datastring = JSON.stringify(data);
	if (DEBUG)console.log("trying to replicate "+datastring);
	var $url=this.RESTUrlBase+this.relations.method;

	replicate_dfd=new $.Deferred(); 
	$.ajax({
		method:"POST",
		dataType: 'JSON',
		data: {values: datastring},
		url: $url,
		success: function(response){
			replicate_dfd.resolve();
			eric.request("Load");
		},
		error: function (xhr, ajaxOptions, thrownError) {
			request_error_alert(xhr);
			replicate_dfd.resolve();
		}
	});
	return replicate_dfd;
};

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
    this.hid_lookup = [];
    this.record_lookup = [];
    this.relations={};
    this.edit_flag=false; // used to re-use the edit dialog for create
    this.seed=null;
    this.current_request=null;
    this.follup_request=null; //hack to allow the create (or_edit) dialog to flip back to tabular editing
    
    var eric=this;
    
    this.queue = jQuery.jqmq({    
        // Next item will be processed only when queue.next() is called in callback.
        delay: -1,
        // Process queue items one-at-a-time.
        batch: 1,
        // For each queue item, execute this function,
        eric :  this,
        callback: function( request_struct ) {
        	var queue=this;
        	eric.current_request=request_struct.request;
        		
        	$.when(this.eric[request_struct.request](request_struct.data)).done(function (){
              	eric.current_request=null;      			
   if(DEBUG)console.log("I finished "+request_struct.request+" on "+eric.name);
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
    this.name = $(ED).attr('id');
    this.title = $(ED).attr('title');
	this.parent_name = $(ED).attr('parent') || $(ED).find('#edit input[id=parentTable]').val();
	this.relations={
			method 				: $(ED).attr('method') || "Entity",
			no_join 			: $(ED).attr('no_join'),
			key 				: $(ED).find('#edit input[key]').attr('name'),
			order 				: $(ED).find('#edit input[order]').attr('name'),
			joinkey 			: $(ED).find('#edit input[joinkey]').attr('name'),
			parentKey 			: $(ED).find('#edit input[id=parentKey]').attr('value'),
			parentTable 		: $(ED).find('#edit input[id=parentTable]').attr('value'),
			secondParentKey 	: $(ED).find('#edit input[id=secondParentKey]').attr('value'),
			secondParentTable 	: $(ED).find('#edit input[id=secondParentTable]').attr('value'),
			display				: []
	};
	var relations=this.relations;
	$(this.ED).find('#edit :input[display]').each(function (){
		relations.display.push($(this).attr('name'));			
	});
	
    this.type_specific();
}

Eric.prototype.request = function(request,data,callback,priority) {
	if(DEBUG)console.log("Asking for  "+request+
				" on "+this.name+
				" length "+this.queue.size()+
				" current request ="+this.current_request
				);
		switch (request){
		case "Load":
			this.queue.clear();  //  Load invalidates anything else on the queue
			switch (this.name){
			case 'Instance':  //if we are changing db, then take the opportunity to turn the bloody spinner thing off
				zerocount(); 
			}
		case 'open_edit_dialog':
		case 'open_tabular_dialog':
			priority=true;
		}
		this.queue.add({request : request, data : data, callback:callback},priority);
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
    	}
    	eric.request("Changed",true);
    });
};

 
Eric.prototype.addChild = function(child) {
    return this.children.push(child);
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



Eric.prototype.RESTUrl = function() {
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
	
	if (relations.order != undefined){
		url+="&order="+relations.order;
	}
	
	return url;
};


//  here are the requests (WARNING, you could request "request", and it would explode)
Eric.prototype.Load = function(force) {
	var eric=this;
//	this.queue.clear();
	var $dfd = $.getJSON(this.RESTUrl(), 
		function( data ) {
			var outdata=[];
			$.each( data, function( key, values ) {
				if (eric.relations.joinkey){
					// flatten out composite tuple records from hibernate
					values=$.extend(values[0], values[1]); 
				} 
				// save these for use by the edit and delete dialogs
				eric.hid_lookup[values[eric.relations.key]]=values['hibernateId'];
				eric.record_lookup[values[eric.relations.key]]=values;
				outdata.push(values);
			});
			eric.data=outdata;
			eric.request("Draw",force); 
	     }
	);
	return $dfd;
};

//force flag to ensure propagation down the tree with the "Changed" request
//it will originate from create_or_update_entity. 
Eric.prototype.Draw = function(force) { 
	this.hid_lookup={};
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
	this.PopulateTabular();
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

	return $.ajax({
		method:"POST",
		dataType: 'JSON',
		data: {values: datastring},
		url: $url,
		success: function(response){
			eric.seed=data[eric.relations.key]; //let draw know where we should be
			eric.request("PostEdit",data);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			request_error_alert(xhr);
		}		 
	 });
};

Eric.prototype.create_or_update_table = function(data) {
	var one_dfd = new $.Deferred();
	var dfds=[];
	for (row in this.data){
		if (this.data[row].changed){
			dfds.push(this.create_or_update_entity(this.data[row]));
		}
	}
	$.when.apply($, dfds).done(function(){
		one_dfd.resolve();
	});
	return one_dfd;
};
	

Eric.prototype.PostEdit = function(record) {
	var dfd=null;
	var eric=this;
	switch(this.name){ //  on the next refactor I'll abstract this
	case 'StopTimes':
		url="/Gee/Mapdata?action=heal&tripId="+record['tripId'];
		
		dfd=$.ajax({
			  url: url,
			  dataType: 'json',
					success: function(response){
						eric.request("Load",true);
						},
					error: function (xhr, ajaxOptions, thrownError) {
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
	}
	return dfd;
};


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

	return $.ajax({
		method:"POST",
		dataType: 'JSON',
		data: {values: datastring},
		url: $url,
		success: function(response){
			eric.request("Load");
		},
		error: function (xhr, ajaxOptions, thrownError) {
			request_error_alert(xhr);
		}
	});
};


Eric.prototype.open_edit_dialog = function (edit_flag){
	this.edit_flag=edit_flag;
	this.dialogs.edit.dialog( "open" );
};

Eric.prototype.open_tabular_dialog = function (){
	this.dialogs.tabular.dialog( "open" );
};

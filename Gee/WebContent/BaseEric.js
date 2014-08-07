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
	console.log("in changed for "+this.name);
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
	console.log("trying to update "+datastring);
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
	$.each( data, function( key, val ) {
		if (val === undefined || val == null || val == 'null') 
			val="";
		
		data[key]=""+val;
	});
	data['entity']= this.name; 
	data['action']='delete';
	var datastring = JSON.stringify(data);
	console.log("trying to delete "+datastring);
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

/* END OF REQUESTS, but actually, as said above, you can request any of Eric's methods */


/*  jquery stuff */
Eric.prototype.ProcessDialogs = function (){
	var dialogs={};
	var eric=this;
    
    $(this.ED).find("#edit").attr('id','edit-'+this.name);
    $(this.ED).find("#delete").attr('id','delete-'+this.name);
    this.initInputForm('edit-'+this.name);
    
	dialogs['edit']=$("#edit-"+this.name).dialog({ 
		open : function (event,ui){
			if (eric.edit_flag == true){
				$(".ui-dialog-titlebar").css("background-color", "green");
			} else {
				$(".ui-dialog-titlebar").css("background-color", "blue");
			}
			eric.init_edit_values();
		},
		autoOpen: false, 
		modal :true,
		width : 800,
		resizable : true,
		dragable : true,
		dialogClass: "edit-dialog",
		buttons : {
			"Update/Create": function() {                     
				var $inputs = $('#edit-'+eric.name+' input');
			    var values = {};
			    // work through the form to get the values
			    $inputs.each(function() {
			    	switch ($(this).attr('type')){
		    		case 'checkbox':
		    			if ($(this).is(':checked')){
		    				values[this.id]="1";
		    			} else {
		    				values[this.id]="0";
		    			}
		    		break;
		    		case 'color':
		    				values[this.id]=$(this).spectrum("get").toHex();
		    		break;
			    		
			    	default:
					    values[this.id] = $(this).val();
			    	}
			    	
			    	// option so we've half a chance of database names working
			    	if ($(this).attr('nospace')){
				        values[this.id] = $(this).val().replace(/[^a-zA-Z0-9]/,'');			    		
			    	}
			    });
			    // selects arent inputs, but they are.
			    $('#edit-'+eric.name+' select').each(function() {
			    	values[this.id]=$(this).val();
			    });

			    values['entity']=eric.name;
				if (eric.edit_flag == true){
				    values['action']='update';
				} else {
				    values['action']='create';
				}
				eric.request("create_or_update_entity",values);
				$( this ).dialog( "close" );		    
			},
			"Delete" : function () {
				 $( this ).dialog( "close" );	
				 $( "#delete-"+eric.name ).dialog("open");
			},
			Cancel: function() {
				 $( this ).dialog( "close" );
			}
		}
	});

	this.MakeTabularTemplate();
	
	dialogs['tabular']=$("#tabular-"+this.name).dialog({ 
		open : function (event,ui){
	//		eric.PopulateTabular();
		},
		autoOpen: false, 
		modal :true,
		width : 800,
		resizable : true,
		dragable : true,
		dialogClass: "edit-dialog",
		buttons : {
			"Update": function() {
				eric.ProcessTabular();
				 $( this ).dialog( "close" );
			},
			"Create": function() {
				eric.request("open_edit_dialog");
				$( this ).dialog( "close" );
			},
			Cancel: function() {
				 $( this ).dialog( "close" );
			}
		}
	});
	
	dialogs['remove']=$(this.ED).find( "#delete-"+this.name ).dialog({ 
		open : function (event,ui){
			// need to get these working 
			$(".ui-dialog-titlebar").css("background-color", "red");
			// there should only by one "do you wanna delete this field
			// set it to whatever the select text is
			console.log("I wanna delete a "+eric.name +" of value "+eric.value());
			$(eric.ED).find('#delete input').val(eric.value());		
		},
		autoOpen: false, 
		modal :true,
		width : 600,
		resizable : true,
		dragable : true,

		buttons : {
			"Delete": function() {
			    // only the GTFS id (e.g agencyId) is stored as the value in the select list
				var values=eric.currentRecord();
				eric.request("remove_entity",values);
				$( this ).dialog( "close" );
			    
			},
			Cancel: function() {
				 $( this ).dialog( "close" );
			}
		}
	});
	this.dialogs=dialogs;
};

/*
 * <div id="table-row">
    <input id="stopId" name="stopId" readonly><br>
    <input id="arrivalTime" name="arrivalTime"  type=text picker=time required display lessthan="departureTime">
    <input id="departureTime" name="departureTime" type=text picker=time required greaterthan="arrivalTime">
   </div>
 */
Eric.prototype.MakeTabularTemplate = function (){
	var elem = document.createElement( "div" );
	$(elem).attr('id',"tabular-"+this.name)
	.append($("#tabular-template").clone())
	.appendTo(this.ED);
};

Eric.prototype.PopulateTabular = function (){
	$("#tabular-"+this.name+" #parent").empty();
	if(this.parent){
		var parent_row=$(this.parent.ED).find("#table-row").clone();
		parent_rec= this.parent.currentRecord();
		this.FillInputs(parent_row,parent_rec);
		$(parent_row).appendTo("#tabular-"+this.name+" #parent")				
	}
	
	row_container = $("#tabular-template #table").clone();
	var table_row=$(this.ED).find("#table-row").clone();
	$("#tabular-"+this.name+" #table").empty();
	
	for (row in this.data){
		var table_row=$(this.ED).find("#table-row").clone();
		table_row.attr('count',row);
		this.FillInputs(table_row,this.data[row]);
		var data_row=this.data[row];
		$(table_row).appendTo("#tabular-"+this.name+" #table");	
		button=$(this.ED).find("#tabular-row-delete-button").clone();	
		$(button).find('#tabular-opener-delete')
			.attr('id',"tabular-opener-delete-"+this.name)
			.click(function(e) {
				e.preventDefault();
				eric.request("remove_entity",data_row);
			});

		$(button).appendTo("#tabular-"+this.name+" #table");
	}
};

Eric.prototype.FillInputs = function (object,record){
	if (!record) return;
	$(object).find("input").each(function(){
		$(this).val(record[this.id]);
		record['changed']=false;
	});
};

Eric.prototype.FillOutputs = function (object,record){
	if (!record) return;
	$(object).find("input").each(function(){
		if (record[this.id]!=$(this).val()){
			if(DEBUG)console.log("changing field "+this.id+ " from "+record[this.id]+" to "+$(this).val());
			record[this.id]=$(this).val();
			record['changed']=true;
		}
	});
};

Eric.prototype.ProcessTabular = function (){
	var eric=this;
	var record_count=0;
	var parent_record = this.parent.currentRecord();
	this.FillOutputs($("#tabular-"+this.name+" #parent #table-row"),parent_record);
	if (parent_record.changed)
		this.parent.request("create_or_update_entity",parent_record);

	$("#tabular-"+this.name+" #table #table-row").each(function (){
		eric.FillOutputs(this,eric.data[record_count]);
		record_count++;
	});
	eric.request("create_or_update_table",null,null,true);
};

Eric.prototype.MakeUIobject = function (){
	// clone the template
	var eric=this;
	var $template=$("#template-select").clone();
	$template.attr('id','container-'+name);
	
	$template.find('#template-select-form')
		.attr('id',"form-"+this.name);
	
	$template.find('#template-opener-add')
		.attr('id',"opener-add-"+this.name)
		.click(function(e) {
			e.preventDefault();
			eric.edit_flag=false;
			eric.dialogs.edit.dialog( "open" );
		});

	$template.find('#template-opener-edit')
		.attr('id',"opener-edit-"+this.name)
		.click(function(e) {
			e.preventDefault();
			eric.request("open_edit_dialog",true);
		});

	$template.find('#template-opener-delete')
	.attr('id',"opener-delete-"+this.name)
	.click(function(e) {
		e.preventDefault();
	    eric.dialogs.remove.dialog( "open" );
	});
	
	$template.find('#template-opener-tabulate')
	.attr('id',"opener-tabulate-"+this.name)
	.click(function(e) {
		e.preventDefault();
		console.log("redraw on "+eric.name);
		eric.request("Load",true);
		eric.request("open_tabular_dialog",true);
	});

	
	$template.find('label').text(
				$(this.ED).find("#select label").text()
				);
	this.UIobject = $("#"+this.name+".Eric_Place_Holder");
	$template.appendTo(this.UIobject);
	return this.UIobject;
};	


Eric.prototype.open_edit_dialog = function (edit_flag){
	this.edit_flag=edit_flag;
	this.dialogs.edit.dialog( "open" );
};

Eric.prototype.open_tabular_dialog = function (){
	this.dialogs.tabular.dialog( "open" );
};
// form intialisers

Eric.prototype.initInputForm = function (formId){
//	$('#'+formId).validate().form();
	// set the pickers
	$('#'+formId+" input").each(function() {
    	switch ($(this).attr('picker')){
    		case 'date':
    		$(this).datepicker({
    		    showAnim: 'slideDown',
    		    dateFormat: 'yy-mm-dd'
    		});
    		break;
    		
    		case 'time':
	    	$(this).timepicker({
	    	    timeFormat: 'H:i:s',
	    	    step:1
	   		});
	    	break;

    		case 'colour':
		    	$(this).spectrum({
		    	    showInput: true,
		    	    preferredFormat: "hex6"
		    	});
		    break;
	    }		
	    
    	if ($(this).attr('greaterthan')){
    		$(this).change(function(){
    			if (!$('#'+$(this).attr('greaterthan')).val() || $(this).val() < $('#'+$(this).attr('greaterthan')).val()){
    				$('#'+$(this).attr('greaterthan')).val(
    					$(this).val()
    				);
    		}
    		});
    	}
    	
    	if ($(this).attr('lessthan')){
    		$(this).change(function(){
    			if (!$('#'+$(this).attr('lessthan')).val() || $(this).val() > $('#'+$(this).attr('lessthan')).val()){
    				$('#'+$(this).attr('lessthan')).val(
    					$(this).val()
    				);
    			}
    		});
    	}    
    });	
};

//RUN TIME FORM HANDLING, THIS STUFF GETS RUN EVERY TIME YOU CLICK EDIT

//this is just for any select lists inside the edit/create forms
Eric.prototype.populate_selects_in_form = function (form){
	var dfd = new $.Deferred();
	var dfds=[];
	$('#'+form+' select').each(function(){
		this_select=this;
		$(this).empty();
		var tableName=$(this).attr('table');
		var selectSource=$KingEric.get(tableName);
		var data = selectSource.data;
		var keyName=selectSource.relations.key;
		var displayField=selectSource.relations.display[0];
		$.each( data, function( key, val ) {		
				$option=$('<option>')
					.val(val[keyName])
					.text(val[displayField])
					.appendTo(this_select);
		});
	});
	
	$.when(dfds).done(function (){
		dfd.resolve();
	});
	return dfd;
};

Eric.prototype.init_edit_values = function (){
	var eric=this;
    this.populate_selects_in_form('edit-'+this.name);
    var record=null;
    if (this.edit_flag){
    	record=this.getrecord(this.value());
    }
    var relations=this.relations;

    $('#edit-'+this.name+' input').each(function() {
    	if (this.id == relations.key && eric.edit_flag){			    	
			// dont let them edit the key on edit else any kids will be orphaned 
    		//(actually constraints stop nasty stuff happening, but we stil dont want them trying to edit it)
			$(this).attr("readonly",true);			        
    		$(this).val(record[this.id]);
    	} else if (this.id == relations.parentKey){
    		$(this).attr("readonly",true);			        
	        $(this).val(eric.parent.value());        
	    } else if (this.id == relations.secondParentKey){
	        $(this).attr("readonly",true);			        
	        $(this).val(eric.secondParent.value());
	    } else if (($(this).attr("joinkey") != null) && eric.edit_flag){
	        $(this).attr("readonly",true);			        	    	
	    } else if (	this.id == 'parentKey' || 
	    			this.id == 'parentTable' || 
	    			this.id == 'secondParentTable' || 
	    			this.id == 'secondParentKey') {
    		// leave these alone
    	} else {
    		if (eric.edit_flag){
        		switch ($(this).attr('type')){
    			case 'checkbox':
    		        if (record[this.id] == 1){
    		        	$(this).prop('checked',true);
    		        } else {
    		        	$(this).prop('checked',false);
    		        }
    		    break;
    		    
    			case 'colour':
    		        $(this).val(record[this.id]);
    				$(this).spectrum("set",record[this.id]);
    		    break;
    		    
       			default:
    		        $(this).val(record[this.id]);
        		}    			
    		} else { // we're in create, this is an editable field, so zap it
	    		$(this).val("");
	    		$(this).attr("readonly",false);
    		}
        }
    });

    $(this.ED).find('#edit select').each(function() {
    	$(this).val(record[this.id]);
    });	    
};


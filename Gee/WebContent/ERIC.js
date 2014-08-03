/*
 * 
 * Global Object - KingEric
 *   subjects - hash of array of name->erics
 *   orphans - the heads of any trees
 *   
 * Methods
 * 	Init - Initialise the heirarchy
 *  add - add an eric to the global "subjects" hash
 *  	calls initSelectForm (or derivative) to wire up the buttons
 *   
 *  get - fetch from subjects
 *  delete - delete an eric
 *  
 *  initialise dialog
 *  	process a dialog form
 *   
 * Object Eric
 * 		UIObject
 * 		name : unique identifier
 * 		relation data
 * 			key - the name of the field from the rest data to use for key, 
 * 				it will be used in creating/modifying 
 * 			display - field to use for display (as above)
 * 			order - order field to sort on, defaults to display
 * 			joinkey - key name to join on
 * 			joinparentkey - key name on parent table to join on (if different from joinkey), i.e in
 * 					most cases it will be something like child.stopId = parent.stopId
 * 			parent table - table name of parent to join onb (if we're joining)
 * 
 * 		RESTUrl : a template, or at least stub, URL
 * 		RESTUrl generator : function, takes RESTUrl, relation data, and creates an ajax URL to use
 		RESTPostUrl post : same as above but for write actions	
 * 		RESTPost : for updating the DB
 * 			action - select, create,edit,delete
 * 
 * 		elements : Array of DataObjects, from REST
 * 		children : array of Eric objects
 *      twin_driver : routine to be called upon changes to elements
 *		dependent_twins : array of Erics managed by twin_driver
 *  
 * Methods
 * new (UIObject,parent,data)
 * 		UIObject is either a jQuery element or leaflet object
 * 		the change function of the element will be set to send a "changed" message to the eric
 * 
 * set parent - set the parent eric
 * set edit dialog
 * set create dialog
 * set delete dialog
 * 
 * value - value of object (usually the current val of a select)
 * 		when given a parameter it will set the value (possibly checking it's valid, ie. exists in the elements)
 * 
 * message
 * 		changed - we got a change event from the UI for the associated element or leaflet object, 
 * 				the .change() function (jquery) and the "dragend" event 
 * 				this will send a "parent changed" message to any children. 
 * 					it's the usually (right now) the result of selecting a different value in a select list
 * 		click - we got a click event from the object
 * 		dblckick - we got a double click event
 * 			generally means create or edit. click cant be used on the map as then you cant use drag
 * 			but we might be able to use click on a jquery entity to, for instance, huighlight the respective
 * 			map object, i.e. for a station, stick up a pop up, or may be add that station to the current view  		
 * 			
 * 		call_create - call the creation dialog (the edit dialog with a create parameter) 
 * 						and the subsequent insertion routine
 * 			 
 * 		call_edit - call edit ...
 * 		call_delete - call delete ...
 * 			will all call load
 * 		parent_change - will usually call load
 * 			optional param - parent_name or eric
 * 		sibling_change - called when a dependent twin changes
 * 			param : eric
 * 
 * 		load - load data elements, then call draw
 * 		draw - (usually implied with parent_change which will call load and then draw)
 * 			to be continued... 
 * 			find out if we are a select or a leaflet object, and work out what to do 
 *  
 * DataObject
 * 	record - usually what came back from REST
 * 
 * 
*/
var load_count=0;
function upcount(){
	// show gif here, eg:
//	$("#loading").show();
	load_count++;
}
function downcount(){
	// hide gif here, eg:
	load_count--;
	if (load_count < 1)
		$("#loading").hide();
}

function SetUp(){
	$.ajaxSetup({
		beforeSend:upcount,
		complete:downcount
	});
	$(document).ajaxStop(function () {
		load_count=0;
		$("#loading").hide();
	});

	dfd = new $.Deferred();
	initDBCookie();
	FBSetup(dfd);
	MapSetup();
	
	dfd.done(function(){
		$KingEric= new KingEric();	

		$("#interface").show();
		$("#welcome").hide();
	});
}

function KingEric (){
	this.subjects = {};
	this.orphans = [];
	this.name ="King Eric";
	this.Init();
	for (var index in this.orphans){
		this.orphans[index].PrintTree(0);
	}
	for (var index in this.orphans){
		this.orphans[index].request("Load");
	}
}


KingEric.prototype.add = function (eric){
	if (this.subjects[eric.name]){
		// assertion failure, we already have one of this name
		return null;
	}
	if (!eric.parent_name){
		this.orphans.push(eric);
	}
	return this.subjects[eric.name]=eric;
};

KingEric.prototype.get = function (name){
	return this.subjects[name];
};

// I'm not currently envisaging a dynamic eric tree, but it's possible
KingEric.prototype.remove = function (name){
	this.subjects[name]=undefined;
	for (var i in this.orphans){
		if (this.orphans[i].name == name){
			this.orphans.splice(i,1);
		}
	}
};


KingEric.prototype.Init = function (){
	var king = this;
	// go find stuff and build the tree
	$('.Eric').each(function(){
		var eric=null;
		switch ($(this).attr('type')){
		case 'MapEric':
			eric = new MapEric(this);
			break;
		default:
			eric = new Eric(this);	
		}
		
		if (eric.parent_name){
			eric.parent=king.get(eric.parent_name);
		}
		if (eric.relations.secondParentTable){
			eric.secondParent=king.get(eric.relations.secondParentTable);
		}
		
		if (eric.parent)
			eric.parent.addChild(eric);
		king.add(eric);
	});	
	
};


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
    
    this.queue = jQuery.jqmq({    
        // Next item will be processed only when queue.next() is called in callback.
        delay: -1,
        // Process queue items one-at-a-time.
        batch: 1,
        // add a link to the owning object
        eric : this,
        // For each queue item, execute this function, 
        callback: function( request_struct ) {
        	var queue=this;
        	$.when(this.eric[request_struct.request](request_struct.data)).done(function (){
            	queue.next();        		
        	});
        },
        
        // When the queue completes naturally, execute this function.
        complete: function(){
        }
    });
    this.queue.eric = this;
    this.name = $(ED).attr('id');
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
	
    this.specific_constructor();
}

Eric.prototype.PrintTree = function(indent){
	var indent_string=""+indent+" ";
	for (var i=0;i<indent;i++){
		indent_string=indent_string+"----";
	}
	console.log(indent_string+"I am "+this.name+" child of "+this.parent_name+" and I am the parent of");
	for (var index in this.children){
		this.children[index].PrintTree(indent+1);
	}	
	console.log(indent_string+"============= end of "+this.name);
};

// STANDARD CONSTRUCTOR. 
// Creates a drop down select, and the dialogs 
Eric.prototype.specific_constructor = function() {

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
    	eric.request("Changed");
    });
}

Eric.prototype.request = function(request,data) {
	console.log("requesting "+request+" of "+this.name);
	this.queue.add({request : request,data : data});
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
	return $(this.select_entity()).text();
};
Eric.prototype.currentRecord = function() {
	return this.record_lookup[this.value()];
};

Eric.prototype.select_empty = function() {
	$(this.select_entity()).empty();
};

Eric.prototype.getrecord = function(key) {
	return eric.record_lookup[key];
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
Eric.prototype.Load = function() {
	var eric=this;
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
			eric.request("Draw"); 
	     }
	);
	return $dfd;
};


Eric.prototype.Draw = function() {
	this.hid_lookup={};
	var save_select_value=this.value();
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
	
	if (save_select_value &&
			(row_entity = $(select_entity).find("option[value='"+save_select_value+"']")) &&
			(value = $(row_entity).val()) &&
			value.length > 0)
		   {
		this.value(save_select_value);
	} else {
		// the current value has gone, reload the kids
		this.request("Changed");
	}
};

Eric.prototype.Changed = function() {
	// we may need to go backup and change an ancestoral table, e,g, the stop if we changed stoptimes
	if (this.relations.secondParentTable){
		$KingEric.get(this.relations.secondParentTable)
				.value(this.currentRecord()[this.relations.secondParentKey]);
	}
	// but either way we've changed, so got get the kids
	this.request("LoadChildren");
};

Eric.prototype.LoadChildren = function() {
	for (var child in this.children){
		this.children[child].request("Load");
	}
};


// this request accepts edit and create, 
Eric.prototype.create_or_update_entity = function(data) {
	var eric=this;
	var datastring = JSON.stringify(data);
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

Eric.prototype.remove_entity = function(request) {
	var datastring = JSON.stringify(request.data);
	var $url=this.RESTUrlBase+this.relations.method;

	return $.ajax({
		method:"POST",
		dataType: 'JSON',
		data: {values: datastring},
		url: $url,
		success: function(response){
			this.request("Load");
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
		ED : this.ED,
		eric : this,
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
	
	dialogs['remove']=$(this.ED).find( "#delete-"+this.name ).dialog({ 
		ED : this.ED,
		eric : this,
		open : function (event,ui){
			// need to get these working 
			$(".ui-dialog-titlebar").css("background-color", "red");
			// there should only by one "do you wanna delete this field
			// set it to whatever the select text is
			$(eric.ED).find('#delete input').val(eric.text());		
		},
		autoOpen: false, 
		modal :true,
		width : 600,
		resizable : true,
		dragable : true,

		buttons : {
			"Delete": function() {
			    // only the GTFS id (e.g agencyId) is stored as the value in the select list
				values={};
	    		values['hibernateId']=this.eric.hid_lookup[this.eric.value()];
			    values['entity']=tableName;
			    values['action']='delete';
				this.request("remove_entity",values);
				$( this ).dialog( "close" );
			    
			},
			Cancel: function() {
				 $( this ).dialog( "close" );
			}
		}
	});
	this.dialogs=dialogs;
}

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
	
	$template.find('label').text(
				$(this.ED).find("#select label").text()
				);
	this.UIobject = $("#"+this.name+".Eric_Place_Holder");
	$template.appendTo(this.UIobject);
	return this.UIobject;
}	

Eric.prototype.open_edit_dialog = function (edit_flag){
	this.edit_flag=edit_flag;
	this.dialogs.edit.dialog( "open" );
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
}

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

// utility stuff
function initDBCookie(){
	databaseName=getURLParameter('databaseName') || getCookie("gee_databasename") || "gtfs";
	console.log("Database ="+databaseName);
	if (!check_exists_db(databaseName)) databaseName="gtfs";
	setCookie("gee_databasename",databaseName);
}
var database_permissions=[];
function check_exists_db(databaseName){
	get_permissions(databaseName); // blocking, synchronous
	return database_permissions[databaseName]['exists'] == "1";	
}

// this has to go
function get_permissions(databaseName){
//	console.log("getting permissions for "+databaseName);
	console.log("gettingperpissions "+this.RESTUrlBase);
	var $url="/Gee/User?entity=Permissions&databaseName="+databaseName;
	return $.ajax({
		method:"GET",
		dataType: 'JSON',
		url: $url,
		async: false,
		success: function(response){
			console.log("database permissions for "+databaseName+"rec="+response+
					" exists="+response['exists']);
			database_permissions[databaseName]=response;
		 },
		error: function (xhr, ajaxOptions, thrownError) {
			request_error_alert(xhr);
		}		 
	});	
}

function getURLParameter(name) {
	  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i].trim();
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}

function setCookie(cname,value){
	console.log("setting cookie "+cname+"="+value);
	document.cookie=cname+"="+value;				
}


function request_error_alert(xhr){
	if (xhr.status == 404){
        alert(jQuery.parseJSON(xhr.responseText)['message']);
      } else {
    	alert("Internal Error: An error has been logged");
      }
}

function upcount(){
	// show gif here, eg:
	$("#loading").show();
	load_count++;
}
function downcount(){
	// hide gif here, eg:
	load_count--;
	if (load_count < 1)
		$("#loading").hide();
}


// MAP STUFF
var map=null;
var trainIcon=null;
var trainboldIcon=null;
var shapenodeIcon=null;
var basemaps={};
var overlays={};

MapEric.prototype = Object.create(Eric.prototype);
MapEric.prototype.constructor = MapEric;

function MapEric(ED){
	this.objectToValue={};
	console.log("WELL I SET UP ibjectToValue");
	Eric.call(this, ED);
}

MapEric.prototype.specific_constructor = function (){
// stuff to do with creating layergroups
	this.featureGroup=L.featureGroup();
	overlays["All Stations"]=this.featureGroup;
	L.control.layers(baseMaps,overlays).addTo(map);
};


MapEric.prototype.Load = function (){
	// stuff to do with fetching any extra data, e.g for the full route map
	// if we exceed some kind of limit on data fetch, we can turn this object (an Eric of subclass Map) off

	// nothing to do for stops, it's all in the parent
	this.request("Draw");
};

MapEric.prototype.Draw = function (){
	// stuff to do with playing about with map objects, using either (normally) the parents data store
	// or in the case of the route map, local data
	var maperic=this;
    var data = maperic.parent.data;
	
	$.each( data, function( key, val ) {
		var mapobject=L.marker([val['stopLat'],val['stopLon']], {icon: trainIcon, draggable: true});
		maperic.objectToValue[L.stamp(mapobject)]=val[maperic.parent.relations.key];
		maperic.set_event_handlers_for_station_outside_trip(mapobject,val['stopName']);
		maperic.featureGroup.addLayer(mapobject).bringToBack();
	});
	map.fitToBounds(this.featureGroup.getBounds());
	// we are politey issuing a 'Changed' request incase we have further descendants
	this.request("Changed");
};

function set_event_handlers_for_station_outside_trip(mapobject,stopName){
	if (mapobject == null){
		return;
	}
	mapobject.on('dragend', function(e) {
	    var marker = e.target;  // you could also simply access the marker through the closure
	    var coords = marker.getLatLng();  // but using the passed event is cleaner
	    var values = maperic.parent.getrecord(maperic.objectToValue[L.stamp(e.target)]);
		values['stopLat']=coords['lat'];
		values['stopLon']=coords['lng'];
		values['action']="update";
		maperic.parent().request("create_or_update_entity",values);
	});

	mapobject.on("click", function(e){
		// set the parent value to this stopId
		maperic.parent.value(maperic.objectToValue[L.stamp(e.target)])
		});
		
	mapobject.on("dblclick", function(e){
		maperic.parent.value(maperic.objectToValue[L.stamp(e.target)]);
		$KingEric.get("StopTimes").request("open_edit_dialog",false);
		});
	
   	var popup_val=stopName;
	mapobject.bindPopup(popup_val);
	mapobject.on('mouseover', function(e) {
		this.openPopup();
		});
	mapobject.setIcon(trainIcon);    
}


function MapSetup(){
	map = L.map('map', { zoomControl:false });
	var osm_tiles='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var baselayer = L.tileLayer(osm_tiles, {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
	});
	var Stamen_TonerLabels = L.tileLayer('http://{s}.tile.stamen.com/toner-labels/{z}/{x}/{y}.png', {
		attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
		subdomains: 'abcd',
		minZoom: 0,
		maxZoom: 20
	});
	trainIcon = L.icon({
	    iconUrl: 'img/steamtrain.png',
	    iconSize:     [44, 44], // size of the icon
	    iconAnchor:   [22, 44], // point of the icon which will correspond to marker's location
	    popupAnchor:  [0, -44] // point from which the popup should open relative to the iconAnchor
	});

	trainboldIcon = L.icon({
	    iconUrl: 'img/steamtrain-bold.png',
	    iconSize:     [44, 44], // size of the icon
	    iconAnchor:   [22, 44], // point of the icon which will correspond to marker's location
	    popupAnchor:  [0, -44] // point from which the popup should open relative to the iconAnchor
	});

	shapenodeIcon = L.icon({
	    iconUrl: 'img/node.png',
	    iconSize:     [22, 22], // size of the icon
	    iconAnchor:   [11, 11], // point of the icon which will correspond to marker's location
	    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
	});
	var OpenStreetMap_DE = L.tileLayer('http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
	});
	baseMaps={
		    "OSM": baselayer,
		    "Stoner":Stamen_TonerLabels,
		    "OSM/DE":OpenStreetMap_DE
		};
	L.control.layers(baseMaps,overlays).addTo(map);
	baselayer.addTo(map);
}

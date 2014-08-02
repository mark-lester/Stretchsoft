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

$( document ).ready(function() {
	initDBCookie();
	$.ajaxSetup({
		beforeSend:function (){
			// show gif here, eg:
			$("#loading").show();
		},
	});
	$(document).ajaxStop(function () {
		$("#loading").hide();
	});
	$KingEric= new KingEric();	
});

function KingEric (){
	this.subjects = {};
	this.orphans = [];
	this.Init();
}


KingEric.prototype.add = function (eric){
	if (this.subjects[eric.name]){
		// assertion failure, we already have one of this name
		return null;
	}
	if (!eric.parent){
		this.orphans.push(eric);
	}
	return this.subjects[eric.name]=eric;
};

KingEric.prototype.remove = function (name){
	this.subjects[name]=undefined;
	for (var i in this.orphans){
		if (this.orphans[i].name == name){
			this.orphans.splice(i,1);
		}
	}
};


KingEric.protype.Init = function (){
	// go find stuff and build the tree
	$('.Eric').each(function(){
		var eric = new Eric(this);	
		this.add(eric);
		this.get(eric.parent_name).addChild(eric);
	});	
};


function Eric (ED) {
	this.ED=ED; // jquery element for the entire block of Eric Declaration
    this.UIobject; // jquery element for the  the select list, which will by where the place holder is 
    this.name;  // entity name, e.g Stops
    this.parent_name; // parent name
    this.parent=null; // parent Eric
    this.data = []; // data array from REST
    this.children=[]; // array of child Erics
    this.relations={}; // all the stuff we need to work out how to cook up a REST url
    this.dialogs={}; // array of dialogs, edit and delete, to attach to the blue,red,green buttons
    this.RESTUrl = "/Gee";
    this.hid_lookup = [];
    this.record_lookup = [];
    this.relations={};
    
    this.queue = $.jqmq({    
        // Next item will be processed only when queue.next() is called in callback.
        delay: -1,
        // Process queue items one-at-a-time.
        batch: 1,
        // add a link to the owning object
        eric : this,
        // For each queue item, execute this function, 
        callback: function( item ) {
        	console.log("wanted to call "+item.request+" on "+this.eric.name);
        	$.when(this.eric[item.request](item.data)).done(function (){
            	this.eric.queue.next();        		
        	});
        },
        
        // When the queue completes naturally, execute this function.
        complete: function(){
        }
    });
    
	parent_name = $(ED).attr('parent') || $(ED,'#edit input[id=parentTable]').val();
	relations={
			method 				: $(ED).attr('method') || "Entity",
			no_join 			: $(ED).attr('no_join'),
			key 				: $(ED,'#edit :input[id=key]').attr('value'),
			order 				: $(ED,'#edit :input[id=order]').attr('value'),
			joinkey 			: $(ED,'#edit :input[id=joinkey]').attr('value'),
			parentKey 			: $(ED,'#edit :input[id=parentKey]').attr('value'),
			parentTable 		: $(ED,'#edit :input[id=parentTable]').attr('value'),
			secondParentKey 	: $(ED,'#edit :input[id=secondParentKey]').attr('value'),
			secondParentTable 	: $(ED,'#edit :input[id=secondParentTable]').attr('value')
	};
	$(ED,'#edit :input[display]').each(function (){
		relations.display.push($(this).attr('name'));			
	});

    this.ProcessDialogs(); // get them ready for the buttons
    this.MakeUIobject();  //  make the UI object and plonk in the place holder
    
    // and finally, get the select to fire off a LoadChildren when it changes
    $(this.UIobject,":select").change(function(){
    	this.request("LoadChildren");
    });
}
 
Eric.prototype.addChild = function(child) {
    return this.children.push(child);
};

Eric.prototype.value = function(value) {
	return $(this.UIobject,":select").val(value);
};

Eric.prototype.generateRESTUrl = function() {
	var relations=this.relations;
	var url=this.RESTUrl + relations.method+"?entity="+this.name;

	if (relations.matchField != undefined){
		var matchValue=this.parent.value();
		if (relations.joinKey != undefined){
			url+="&parent_field="+relations.matchField+"&value="+matchValue;	
		} else {
			url+="&field="+relations.matchField+"&value="+matchValue;			
		}
	}
	if (relations.orderField != undefined){
		url+="&order="+relations.orderField;
	}
	if (relations.joinKey != undefined){
		url+="&join_key="+relations.joinKey+"&join_table="+relations.parentTable;
	}
	return url;
};


Eric.prototype.request = function(request,data) {
	this.queue.add({request : request,data : data});
};


//  here are the requests (WARNING, you could request "request", and it would explode)
Eric.prototype.Load = function() {
	var $dfd = $.getJSON(this.generateRESTUrl(), 
		function( data ) {
			var outdata=[];
			$.each( data, function( key, values ) {
				if (this.joinKey){
					// flatten out composite tuple records from hibernate
					values=$.extend(values[0], values[1]); 
				} 
				// save these for use by the edit and delete dialogs
				this.hid_lookup[values[this.relations.key]]=values['hibernateId'];
				this.record_lookup[values[this.relations.key]]=values;
				outdata.push(values);
			});
			this.data=outdata;
			this.request("Draw"); 
	     }
	);
	return $dfd;
};

Eric.prototype.Draw = function() {
	this.hid_lookup={};
	var select_list = $(this.UIobject,"#select");
	var save_select_row=select_list.val();
	$.each( this.data, function( key, values ) {
		$('<option>').val(values[this.relations.keyName]).text(
				this.relations.display.map(
						function (item){return values[item];}
						).join(' ')
				).appendTo(this.UIobject);	
	});
	if (save_select_row &&
			$(this,"option[value='"+save_select_row+"']").val().length > 0		
	) {
		select_list.val(save_select_row);
	} else {
		// the current value has gone, reload the kids
		this.request("LoadChildren");		
	}
};

Eric.prototype.LoadChildren = function() {
	for (var child in this.children){
		child.request("Load");
	}
};


// this request accepts edit and create, 
Eric.prototype.create_or_update_entity = function(request) {
	var datastring = JSON.stringify(request.data);
	var $url="/Gee/"+this.relations.method;

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

Eric.prototype.remove_entity = function(request) {
	var datastring = JSON.stringify(request.data);
	var $url="/Gee/"+this.relations.method;

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


/*  jquery stuff */
Eric.prototype.ProcessDialogs = function (){
	var dialogs={};
	dialogs['edit']=$(ED,"#edit").dialog({ 
		ED : this.ED,
		eric : this,
		open : function (event,ui){
			$('#edit').validate().form();
			if ($(this.ED, "#edit").data("edit_flag") == true){
				this.init_edit_values();
				$(".ui-dialog-titlebar").css("background-color", "green");
			} else {
				this.init_create_values();
				$(".ui-dialog-titlebar").css("background-color", "blue");
			}
		},
		autoOpen: false, 
		modal :true,
		width : 800,
		resizable : true,
		dragable : true,
		dialogClass: "edit-dialog",
		buttons : {
			"Update/Create": function() {                     
                if (!$(this.ED,'#edit').validate().form()) {
                	alert("Form doesnt validate")
                	return;
                }
                
				var $inputs = $(this.ED,'#edit :input');
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
			    $(ED,'#edit :select').each(function() {
			    	values[this.id]=$(this).val();
			    });

			    values['entity']=this.eric.name;
				if ($(ED, "#edit").data("edit_flag") == true){
				    values['action']='update';
				} else {
				    values['action']='create';
				}
				this.request("create_or_update_entity",values);
				$( this ).dialog( "close" );
			    
			},
			"Delete" : function () {
				 $( this ).dialog( "close" );	
				 $(this.ED, "#delete" ).dialog("open");
			},
			Cancel: function() {
				 $( this ).dialog( "close" );
			}
		}
	});
	
	dialogs['remove']=$(ED, "#delete" ).dialog({ 
		ED : this.ED,
		eric : this,
		open : function (event,ui){
			// need to get these working 
			$(".ui-dialog-titlebar").css("background-color", "red");
			// there should only by one "do you wanna delete this field
			// set it to whatever the select text is
			$(this.ED,'#delete :input').val($(this.eric.UIobject,'option:selected').text());		
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
	    		values['hibernateId']=this.hid_lookup[$(this.eric.UIobject,":select").val()].toString();
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
	var $template=$("#template-select").clone();
	$template.attr('id','container-'+name);
	
	$template.find('#template-select-form')
		.attr('id',"form-"+this.name);
	
	$template.find('#template-opener-add')
		.attr('id',"opener-add-"+this.name)
		.click(function(e) {
			e.preventDefault();
			dialogs.edit.data("edit_flag",false);
			dialogs.edit.dialog( "open" );
		});

	$template.find('#template-opener-edit')
		.attr('id',"opener-edit-"+this.name)
		.click(function(e) {
			e.preventDefault();
			dialogs.edit.data("edit_flag",true);
			dialogs.edit.dialog( "open" );
		});

	$template.find('#template-opener-delete')
	.attr('id',"opener-delete-"+this.name)
	.click(function(e) {
		e.preventDefault();
	    dialogs.remove.dialog( "open" );
	});
	
	// clone to copy the id=select element in the ID
	UIobject=$(ED,"#select").clone();
	var placeholder=$(".EricPlaceHolder #"+this.name);
	
    // use what's inn the h5 element in the ED specific block and use for the label value
	// in the resultant mix of $temlate and #select
	var label=UIobject.find("h5").text();
	UIobject.find("h5").remove();
	UIobject.find('label').text(label);
	UIobject.appendTo($template);
	$template.appendTo(placeholder);
	return UIobject;
}	

// form intialisers

Eric.prototype.initInputForm = function (){
	$(ED,'#edit').validate();
	// set the pickers
	$(ED,'#edit :input').each(function() {
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
Eric.prototype.populate_selects_in_forms = function (){
	var dfd = new $.Deferred();
	var dfds=[];
	$(ED,':select').each(function(){
		tableName=$(this).attr('table');
		keyName=this.relations.key;
		displayField=this.relations.display[0];
		$(this).empty();
		url= "/Gee/"+this.relations.method+"?entity="+tableName+"&order="+this.relations.key;

		dfds.push($.ajax({
			  url: url,
			  dataType: 'JSON',
			  async: true,
			  success: function(data) {
					$.each( data, function( key, val ) {		
						$option=$('<option>')
						.val(val[keyName])
						.text(val[displayField])
						.appendTo('#'+formId+" #"+$this_select);
					});
			  }
		}));
	});
	
	$.when(dfds).done(function (){
		dfd.resolve();
	});
	return dfd;
};

Eric.prototype.init_edit_values = function (){
    this.populate_selects_in_forms();
    var record=this.record_lookup[this.value()];
 
    $(ED,'#edit :input').each(function() {
    	if (this.id == relations.key){			    	
			 // dont let them edit the key else any kids will be orphaned (actually constraints stop nasty stuff happening, but we stil dont want them trying to edit it)
			 // and dont let them edit the parent key else this will be orphaned
    		$(this).attr("readonly",true);			        
    		$(this).val(record[this.id]);
    	} else if (this.id == relations.parentKey){
    		$(this).attr("readonly",true);			        
	        $(this).val(parent.value());        
	    } else if (this.id == relations.secondParentKey){
	        $(this).attr("readonly",true);			        
	        $(this).val(secondParent.value());
	    } else if (	this.id == 'parentKey' || 
	    			this.id == 'parentTable' || 
	    			this.id == 'secondParentTable' || 
	    			this.id == 'secondParentKey') {
    		// leave these alone
    	} else {
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
        }
    });

    $(ED,'#edit :select').each(function() {
    	$(this).val(record[this.id]);
    });	    
};

// utility stuff
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



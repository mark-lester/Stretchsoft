var hid_lookup=[];
var relations=[];
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
	document.cookie=cname+"="+value;				

}

function getDatabaseName(){
	var dataseName=getCookie('gee_databasename');
	if (databaseName == undefined || databaseName.length == 0){
		databaseName='gtfs';
		setCookie('gee_databasename',databaseName);
	}
	return databaseName;
}

function MainSetup(){
	dfd = new $.Deferred();
	FBSetup(dfd);


	dfd.done(function(){
		initTableRelations();
		initTables();
		
		$("#interface").show();
		$("#welcome").hide();
		refreshAll();
		$.when().done(function(){
			console.log("everything should now be ready");
			MapSetUp();
			SetupMenu();
		});
	});
}


function initTableRelations(){
	//<div id="Stops" class="Eric" parent="Instance" display_field="stopName">
	$('.Eric').each(function(){
		var tableName=$(this).attr('id');
		if (!relations[tableName]){
			relations[tableName]=[];
		}
		if ($(this).attr('parent') != undefined){
			relations[tableName]['parent']=
				// <div id="CalendarDates" class="Eric" parent="Instance" >
				$(this).attr('parent');			
		}
		if (!relations[tableName]['parent']){
			if ($('#dialog-edit-'+tableName+'-form :input[id=parentTable]').length){
				relations[tableName]['parent']=
					//<input id="parentTable" value="Trips" type=hidden>
					$('#dialog-edit-'+tableName+'-form :input[id=parentTable]').val();				
			}
		}
		if ($(this).attr('no_join') != undefined){
			relations[tableName]['no_join']=1;			
		}
		if ($(this).attr('method') != undefined){
			relations[tableName]['method']=$(this).attr('method');			
		} else {
			relations[tableName]['method']="Entity";						
		}

		
		// <input id="stopId" name="stopId" size=10 maxlength=10 required key>
		relations[tableName]['key']=$('#dialog-edit-'+tableName+'-form :input[key]').attr('name');
		
		// <input id="stopName" name="stopName" size=30 maxlength=30 required display>
		relations[tableName]['display']=[];
//		relations[tableName]['display']=$('#dialog-edit-'+tableName+'-form :input[display]').attr('name');
		$('#dialog-edit-'+tableName+'-form :input[display]').each(function (){
			relations[tableName]['display'].push($(this).attr('name'));
			console.log("added "+$(this).attr('name')+" first val is "+relations[tableName]['display'][0]+"\n");
			
		})
		
		if (relations[tableName]['parent']){
			var child=undefined;
			var parent=relations[tableName]['parent'];
			if (!relations[parent]){
				relations[parent]=[];
			}
			if (!relations[parent]['children']){
				relations[parent]['children']=[];
			}
			relations[parent]['children'].push(tableName);		
		}
	});
}

function initTables(){
	for (tableName in relations){
	    if (tableName === 'length' || !relations.hasOwnProperty(tableName)) continue;
		initSelectForm(tableName);
		initInputForm(tableName);
		initDialogs(tableName);
	}
}

function refreshAll(){
	var deferreds=[];
	var dfd = new $.Deferred();
	// zap everything first as sometimes we dont recurse all the way down
	for (tableName in relations){
		$("#select-"+tableName).empty();
	}
	
	for (tableName in relations){
	    if (tableName == 'length' || !relations.hasOwnProperty(tableName)
	    		// Only refresh the orphans. logically everything else will get called as a result.
	    		|| relations[tableName]['parent'] != undefined ) 
	    	continue;
	    deferreds.push(refreshTable(tableName));  
	}
	console.log("I have "+deferreds.length+" dfds");
	$.when(deferreds).done(function(){
		console.log("resolving the refresh all dfd");
		dfd.resolve();
	});
	return dfd;
}

function refreshTable(tableName){
	console.log("refreshing "+tableName);
	var dfd = new $.Deferred();
	
	var gt_dfd=getTableData(tableName);
	gt_dfd.done(function (){
		console.log("got data refreshing "+tableName);
		var deferreds=refreshChildren(tableName);
		$.when(deferreds).done(function(){
			postRefresh(tableName);

			dfd.resolve();
			console.log("releasing dfd for refreshing "+tableName);
		});
	});
	
	return dfd;
}

function refreshChildren(tableName){
	var dfd = new $.Deferred();
	var deferreds=[];
	for (child in relations[tableName]['children']){
		deferreds.push(refreshTable(relations[tableName]['children'][child]));
	}
	$.when(deferreds).done(function(){
		dfd.resolve();
	})
	return dfd;
}

function postRefresh(tableName){
	switch(tableName){
	case 'Stops':
		drawStops();
		break;
	case 'StopTimes':
		drawTrip($('#select-Trips').val());
		break;
	}
}
	
var get_table_deffereds=[];

function getTableData(table){
  var dfd;
  $.when(get_table_deffereds[table]).done(
		  function(){
			  dfd=getTableDataInner(table);
		  }
		  );
  return dfd;
}

function getTableDataInner(table){
	var dfd = new $.Deferred();
	get_table_deffereds[table]=dfd;

	
	var tableName=table;
	var keyName=relations[tableName]['key'];
//	alert("in getTable tableName="+tableName+" key="+keyName);
	var defaultOrderField=relations[tableName]['display'][0];
	var orderField=relations[tableName]['order'];
	var parentTable=relations[tableName]['parent'];
	var matchField=undefined;
	var matchValue=undefined;
	
	if (parentTable != undefined && relations[parentTable]['no_join'] == undefined){
		matchField=relations[parentTable]['key'];
		matchValue=$('#select-'+parentTable).val();		
	}
	var save_select_row=undefined;
	var $select_list = $("#select-"+tableName);
	if ($("#select-"+tableName).val()!=undefined){
     	save_select_row=$("#select-"+tableName).val();
    } 
	if (tableName == 'Instance'){
		save_select_row = getCookie("gee_databasename");
		console.log("catching databasename "+save_select_row);
	}

	if (orderField==undefined){
		orderField=defaultOrderField;
	}
	
	var $url="/Gee/"+relations[tableName]['method']+"?entity="+tableName;

	if (matchField != undefined){
		$url+="&field="+matchField+"&value="+matchValue;
	}
	if (orderField != undefined){
		$url+="&order="+orderField;
	}
	hid_lookup[tableName]={};
    $select_list.empty();

	$.getJSON($url, 
			function( data ) {
			$.each( data, function( key, values ) {
				hid_lookup[tableName][values[keyName]]=values['hibernateId'];
				display_data=[];
				for (index in relations[tableName]['display']){
					display_field=relations[tableName]['display'][index];
					console.log("pushing "+display_field+" = "+values[display_field]+"\n");
					display_data.push(values[display_field]);
				}
				var $option=$('<option>').val(values[keyName]).text(
						display_data.join(' ')
						);	
				$option.data(values['hibernateId']);
				$option.appendTo($select_list);
			});
			if (save_select_row != undefined &&
					$("#select-"+tableName+" option[value='"+save_select_row+"']").length != 0 		
			){
				$("#select-"+tableName).val(save_select_row);
			}
			dfd.resolve();
		}
	);	
	
	dfd.done(function(){
		// for the benefit of StopTimes, which has two parents, stops and trips, set the initial value of Stops
		secondParentTable = $('#dialog-edit-'+tableName+'-form input[id=secondParentTable]').val();
		if (secondParentTable != undefined)
			$('#select-'+secondParentTable).val($('#select-'+tableName).val());	    		
	});
	
	return dfd;
}


function initSelectForm(tableName){
	$("<form>",{id:"form-"+tableName}).appendTo("#"+tableName);
	$("<select/>", {
		id: "select-"+tableName,
		name: "select-"+tableName
		})
		.change(function (){
			if (tableName == 'Instance'){
				console.log("setting db to "+$("#select-"+tableName).val());
				setCookie('gee_databasename',$("#select-"+tableName).val());				
			}
			refreshTable(tableName);
		})
		.appendTo("#form-"+tableName);

	//class="pure-button  pure-button-primary"
	bootstart_button_stuff=' type="button" class="btn btn-primary btn-xs"';
	$('<button type="button" class="btn btn-primary btn-xs">')
		.attr('id',"opener-add-"+tableName)
		.text('Add')
		.click(function(e) {
			e.preventDefault();
			$( "#dialog-edit-"+tableName ).data("edit_flag",false);
			$( "#dialog-edit-"+tableName ).dialog( "open" );
		})
		.appendTo("#form-"+tableName);

	$('<button type="button" class="btn btn-success btn-xs">')
		.attr('id',"opener-edit-"+tableName)
		.text('Edit')
		.click(function(e) {
		    e.preventDefault();
		    $( "#dialog-edit-"+tableName ).data("edit_flag",true);
		    $( "#dialog-edit-"+tableName ).dialog( "open" );
		})
		.appendTo("#form-"+tableName);
	
	$('<button type="button" class="btn btn-danger btn-xs">')
		.attr('id',"opener-delete-"+tableName)
		.text('Delete')
		.click(function(e) {
		    e.preventDefault();
		    $( "#dialog-delete-"+tableName ).dialog( "open" );
		})
		.appendTo("#form-"+tableName);
}

function initInputForm(tableName){
	$('#dialog-edit-'+tableName+'-form').validate();
	// set the pickers

	var $inputs = $('#dialog-edit-'+tableName+'-form :input');
    
    $inputs.each(function() {
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

function initDialogs(tableName){
			$( "#dialog-edit-"+tableName ).dialog({ 
				open : function (event,ui){
					$('#dialog-edit-'+tableName+'-form').validate().form();
					if ($( "#dialog-edit-"+tableName ).data("edit_flag") == true){
						$(".edit-dialog .ui-widget-header").css("background-color", "green");
						init_edit_values(tableName);
					} else {
						$(".edit-dialog .ui-widget-header").css("background-color", "blue");//						$(".edit-dialog .ui-widget-content").css("background-color", "blue");
						init_create_values(tableName);
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
                        if (!$('#dialog-edit-'+tableName+'-form').validate().form()) {
                        	return;
                        }
                        
						var $inputs = $('#dialog-edit-'+tableName+'-form :input');
					    var values = {};
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
					    });
					    $('#dialog-edit-'+tableName+'-form select').each(function() {
					    	values[this.id]=$(this).val();
					    });

					    values['entity']=tableName;
						if ($( "#dialog-edit-"+tableName ).data("edit_flag") == true){
						    values['action']='update';
						} else {
						    values['action']='create';
						}
					    var datastring = JSON.stringify(values);
						var $url="/Gee/"+relations[tableName]['method'];

						$.ajax({
							method:"POST",
							dataType: 'JSON',
							data: {values: datastring},
							url: $url,
							success: function(response){
								postEditHandler(tableName,values).done( function(){
									getTableData(tableName).done(function (){
										// fetches the table with potientiall new row
										// set the select list value, and refresh 
										$('#select-'+tableName).val(values[relations[tableName]['key']]);
										refreshChildren(tableName);
										}); 
									}
								);
							}
						});
						
						$( this ).dialog( "close" );
					    
					},
					Cancel: function() {
						 $( this ).dialog( "close" );
					}
				}
			});
			
			$( "#dialog-delete-"+tableName ).dialog({ 
				open : function (event,ui){
					// there should only by one "do you wanna delete this field
					// set it to whatever the select text is
					$('#dialog-delete-'+tableName+'-form :input')
						.val($('#select-'+tableName+' option:selected').text());
					
				},
				autoOpen: false, 
				modal :true,
				width : 600,
				resizable : true,
				dragable : true,

				buttons : {
					// TODO **IMPORTANT** 
					// this will leave all the children to this record orphaned. right now you have to manually delete 
					// the children first else you wont even be able to see them after the parent is gone
					// so we need a recursive delete children function.
					"Delete": function() {
					    // only the GTFS id (e.g agencyId) is stored as the value in the select list
					    // this horrid global nested hash was the only way I could map 
					    // from tableName + gtfs-id value to hibernateId
						values={};
//						alert("Want to delete "+$('#select-'+tableName).val()+ "in table "+tableName);
			    		values['hibernateId']=hid_lookup[tableName][$('#select-'+tableName).val()].toString();
					    values['entity']=tableName;
					    values['action']='delete';
					    var datastring = JSON.stringify(values);
						var $url="/Gee/"+relations[tableName]['method'];

						$.ajax({
							method:"POST",
							dataType: 'JSON',
							data: {values: datastring},
							url: $url,
							success: function(response){
								postEditHandler(tableName,values).done( function(){
									refreshTable(tableName);
									}
								);
							}
						});
						$( this ).dialog( "close" );
					    
					},
					Cancel: function() {
						 $( this ).dialog( "close" );
					}
				}
			});
}

// After we've added or edited a stoptime, we (potentially) need to "heal" the sort order to match time. 
// This should perhaps be moved into the DB interface on the server. 
function postEditHandler(tableName,record){
	var dfd=new $.Deferred();
	switch (tableName){
		case 'Instance':
			if (record['action'] == 'delete') {
				// we just zapped the current DB, so set the DB cookie to the first one
				setCookie("gee_databasename",$('#select-'+tableName).first());
			}
			if (record['action'] == 'create') {
				setCookie("gee_databasename=",record['databaseName']);
			}
			
			dfd.resolve();			
		break;
			
		case 'StopTimes':
			url="/Gee/Mapdata?action=heal&tripId="+record['tripId'];
			
			$.ajax({
				  url: url,
				  dataType: 'json',
						success: function(response){
							dfd.resolve();
							}
				  }
			);
			dfd.done(function(){
				refreshTable(tableName);
			})
		break;
		default:
			dfd.resolve();			
	}
	return dfd;
}
//MENUs
var GTFS_Upload_file=null;
function SetupMenu(){

$( "#getstops" ).click(function(e) {
    e.preventDefault();
    $( "#dialog-getstops" ).dialog( "open" );
    
});

$("#dialog-getstops" ).dialog({ 
	open : function (event,ui){
	},
	autoOpen: false, 
	modal :true,
	width : 600,
	resizable : true,
	dragable : true,
	buttons : {
		// TODO **IMPORTANT** 
		// this will leave all the children to this record orphaned. right now you have to manually delete 
		// the children first else you wont even be able to see them after the parent is gone
		// so we need a recursive delete children function.
		"Upload": function() {
		    // only the GTFS id (e.g agencyId) is stored as the value in the select list
		    // this horrid global nested hash was the only way I could map 
		    // from tableName + gtfs-id value to hibernateId
			values={};
			
			$url= "/Gee/ImportStops?"+
			"n="+map.getBounds().getNorth()+
			"&s="+map.getBounds().getSouth()+
			"&e="+map.getBounds().getEast()+
			"&w="+map.getBounds().getWest()+
			"&t="+$( "#stop_type").val()
			;
			$.ajax({
				method:"GET",
				dataType: 'JSON',
				  async: false,
				url: $url,
				success: function(response){
					refreshAll();
					}
			});
			$( this ).dialog( "close" );
		    
		},
		Cancel: function() {
			 $( this ).dialog( "close" );
		}
	}
});

$( "#import_gtfs" ).click(function(e) {
    e.preventDefault();

    $( "#dialog-import_gtfs" ).dialog( "open" );
    
});
// Set an event listener on the Choose File field.
$('#upload_file').bind("change", function(evt) {
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0]; 

    if (f) {
      var r = new FileReader();
      r.onload = (function (f) {
          return function (e) {
              GTFS_Upload_file = e.target.result;
          };
      })(f);
      r.readAsBinaryString(f);
      console.log("read GTFS file");
    } else { 
      alert("Failed to load file");
    }
  });


$("#dialog-import_gtfs" ).dialog({ 
	open : function (event,ui){
	},
	autoOpen: false, 
	modal :true,
	width : 600,
	resizable : true,
	dragable : true,
	buttons : {
		// TODO **IMPORTANT** 
		// this will leave all the children to this record orphaned. right now you have to manually delete 
		// the children first else you wont even be able to see them after the parent is gone
		// so we need a recursive delete children function.
		"Upload": function() {
		    // only the GTFS id (e.g agencyId) is stored as the value in the select list
		    // this horrid global nested hash was the only way I could map 
		    // from tableName + gtfs-id value to hibernateId
			values={};
			values['url']=$('#dialog-import_gtfs :input[id=upload_file]').val();
			values['file']=window.btoa(GTFS_Upload_file);
//			values['file']=$('#dialog-import_gtfs :input[id=upload_file]').val();
			values['action']='import';
		    var datastring = JSON.stringify(values);
			console.log("zip file length="+GTFS_Upload_file.length+" encoded length="+values['file'].length+" datalength="+datastring.length+"\n");
			$url= "/Gee/Loader";
			//console.log("loader about to ajax\n"+datastring+"\n");
			$.ajax({
				method:"POST",
				dataType: 'JSON',
				async: false,
				data:  {values : datastring},
				url: $url,
				success: function(response){
					refreshAll();
					}
			});
			$( this ).dialog( "close" );
		    
		},
		Cancel: function() {
			 $( this ).dialog( "close" );
		}
	}
});

$( "#export_gtfs" ).click(function(e) {
    e.preventDefault();
    export_gtfs();
});


}

function export_gtfs(){
	var win = window.open('/Gee/Loader?action=export', '_blank');
	if(win){
	    //Browser has allowed it to be opened
	    win.focus();
	}else{
	    //Broswer has blocked it
	    alert('Please allow popups for this site');
	}
}

// RUN TIME FORM HANDLING, THIS STUFF GETS RUN EVERY TIME YOU CLICK EDIT

//  this is just for any select lists inside the edit/create forms
function populate_selects_in_forms(formId){
	var $selects = $('#'+formId+' select');

	$selects.each(function(){
		$this_select=this;
		tableName=$this_select.attr('table');
		keyName=relations[tableName]['key'];
		displayField=relations[tableName]['display'][0];
		$(this).empty();
		var $url="/Gee/"+relations[tableName]['method'];

		url= "/Gee/"+relations[tableName]['method']+"?entity="+tableName+"&order="+keyName;
	
		$.ajax({
			  url: url,
			  dataType: 'json',
			  async: false,
			  success: function(data) {
					$.each( data, function( key, val ) {		
						$option=$('<option>')
						.val(val[keyName])
						.text(val[displayField])
						.appendTo($this_select);
					});
			  }
		});
	});
}
// TODO init_edit and init_create need merging
function init_edit_values(tableName){
	var keyName=relations[tableName]['key'];
	var parentTable = $('#dialog-edit-'+tableName+'-form input[id=parentTable]').val();
    var parentKey = $('#dialog-edit-'+tableName+'-form input[id=parentKey]').val();
    var secondParentTable = $('#dialog-edit-'+tableName+'-form input[id=secondParentTable]').val();
    var secondParentKey = $('#dialog-edit-'+tableName+'-form input[id=secondParentKey]').val();
    
	var $url= "/Gee/"+relations[tableName]['method']+"?entity="+tableName;
	$url+="&field="+keyName+"&value="+$('#select-'+tableName).val();

    populate_selects_in_forms('dialog-edit-'+tableName+'-form');
	$.getJSON($url, 
		function( data ) {
		var items = [];
		// there should only be one
		$.each( data, function( key, record ) {
			var $inputs = $('#dialog-edit-'+tableName+'-form :input');
		    $inputs.each(function() {
/*
		    	if (this.id == keyName || this.id == parentKey || this.id == secondParentKey){
		        	// dont let them edit the key else any kids will be orphaned
		        	// and dont let them edit the parent key else this will be orphaned
			        $("#"+this.id,"#dialog-edit-"+tableName+"-form").attr("readonly",true);			        
			        $("#"+this.id,"#dialog-edit-"+tableName+"-form").val(record[this.id]);
*/
			    if (this.id == keyName){			    	
			        	// dont let them edit the key else any kids will be orphaned
			        	// and dont let them edit the parent key else this will be orphaned
				        $("#"+this.id,"#dialog-edit-"+tableName+"-form").attr("readonly",true);			        
				        $("#"+this.id,"#dialog-edit-"+tableName+"-form").val(record[this.id]);
			    } else if (this.id == parentKey){
			        $("#"+this.id,"#dialog-edit-"+tableName+"-form").attr("readonly",true);			        
			        $("#"+this.id,"#dialog-edit-"+tableName+"-form").val($("#select-"+parentTable).val());        
			    } else if (this.id == secondParentKey){
			        $("#"+this.id,"#dialog-edit-"+tableName+"-form").attr("readonly",true);			        
			        $("#"+this.id,"#dialog-edit-"+tableName+"-form").val($("#select-"+secondParentTable).val());			        
		        } else if (this.id == 'parentKey' || this.id == 'parentTable' || this.id == 'secondParentTable' || this.id == 'secondParentKey') {
		    		// leave these alone
		    	} else {
		    		switch ($(this).attr('type')){
	    			case 'checkbox':
				        if (record[this.id] == 1){
				        	$("#"+this.id,"#dialog-edit-"+tableName+"-form").prop('checked',true);
				        } else {
				        	$("#"+this.id,"#dialog-edit-"+tableName+"-form").prop('checked',false);
				        }
				    break;
				    
	    			case 'colour':
				        $("#"+this.id,"#dialog-edit-"+tableName+"-form").val(record[this.id]);
	    				$(this).spectrum("set",record[this.id]);
				    break;
				    
		   			default:
				        $("#"+this.id,"#dialog-edit-"+tableName+"-form").val(record[this.id]);
		    		}
		        }
		    });
		    $('#dialog-edit-'+tableName+'-form select').each(function() {
		    	$(this).val(record[this.id]);
		    });
		    
		});
	});
}

function init_create_values(tableName){
    var parentTable = $('#dialog-edit-'+tableName+'-form input[id=parentTable]').val();
    var parentKey = $('#dialog-edit-'+tableName+'-form input[id=parentKey]').val();
    var secondParentTable = $('#dialog-edit-'+tableName+'-form input[id=secondParentTable]').val();
    var secondParentKey = $('#dialog-edit-'+tableName+'-form input[id=secondParentKey]').val();
    populate_selects_in_forms('dialog-edit-'+tableName+'-form');
			var $inputs = $('#dialog-edit-'+tableName+'-form :input');
		    $inputs.each(function() {
		    	if (this.id == parentKey){
		    		// fill the parent key in and make it read only
		    		$("#"+this.id,"#dialog-edit-"+tableName+"-form").attr("readonly",true);	
		    		$("#"+this.id,"#dialog-edit-"+tableName+"-form").val($('#select-'+parentTable).val());
		    	} else if (this.id == secondParentKey){
		    		$("#"+this.id,"#dialog-edit-"+tableName+"-form").attr("readonly",true);	
		    		$("#"+this.id,"#dialog-edit-"+tableName+"-form").val($('#select-'+secondParentTable).val());	    		
		    	}else if (this.id == 'parentKey' || this.id == 'parentTable'|| this.id == 'secondParentTable'|| this.id == 'secondParentKey') {
		    		// leave these alone
		    	} else {
		    		// zap them for new input, but allow setting of fields by the caller through .data()
		    		setval=$("#dialog-edit-"+tableName+"-form").data(this.id);
		    		if (setval == null){
		    			setval="";
		    		}
		    		$("#"+this.id,"#dialog-edit-"+tableName+"-form").val(setval);
		    		$("#"+this.id,"#dialog-edit-"+tableName+"-form").attr("readonly",false);
		    	}
		    });
}

function init_delete_values(tableName,keyName){
	
}


// MAP STUFF
var map;
var allStopsArr = [];
var tripStopsArr = [];
var tripStopsLineArr = [];
var mapobjectToValue={};

var allStationsLayer=L.featureGroup();
var tripStationsLayer=L.featureGroup();
var baseMaps = {};


var overlayMaps = {
	    "AllStations": allStationsLayer,
	    "TripStations": allStationsLayer
	};


function MapSetUp(){
	map = L.map('map');
	osm_tiles='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	baselayer = L.tileLayer(osm_tiles, {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
	});

	baseMaps={
		    "OSM": baselayer
		};
	baselayer.addTo(map);
	allStationsLayer.addTo(map);
	tripStationsLayer.addTo(map);

//	L.control.layers(baseMaps,overlayMaps).addTo(map);
	url="/Gee/Mapdata";
	$.ajax({
		  url: url,
		  dataType: 'json',
		  async : false,
		  success: function(val) {
			  centreLat = val['minLat'] + (val['maxLat']-val['minLat'])/2;
			  centreLon = val['minLon'] + (val['maxLon']-val['minLon'])/2;
			  map.setView([centreLat, centreLon], 7);

		  }
	});
	map.on('click',function(e) {
	    $( "#dialog-edit-Stops").data("edit_flag",false);
	    $( "#dialog-edit-Stops-form").data("stopLat",e.latlng.lat);
	    $( "#dialog-edit-Stops-form").data("stopLon",e.latlng.lng);

	    $( "#dialog-edit-Stops").dialog( "open" );
	});
}

function drawStops(){
	var i=0;
	allStationsLayer.clearLayers();

	mapurl= "/Gee/Entity?entity=Stops";
	$.getJSON(mapurl, 
			function( data ) {
				allStationsLayer.clearLayers();
				$.each( data, function( key, val ) {
	//				alert("want to stick a circle at "+val['stopLat']+" : "+val['stopLon']);
					
					mapobject=L.circle([val['stopLat'],val['stopLon']], 100, {
						color: 'red',
						fillColor: '#f03',
						fillOpacity: 0.5
					})
					.on("click",function(e) {
					    $( "#select-Stops").val(mapobjectToValue[L.stamp(e.target)]);
					    $( "#dialog-edit-StopTimes").data("edit_flag",false);
					    $( "#dialog-edit-StopTimes").dialog( "open" );
					});
					

					mapobjectToValue[L.stamp(mapobject)]=val['stopId'];
					allStationsLayer.addLayer(mapobject);
					/*
					var mapobject = L.marker(val['stopLat']+0.0001,val['stopLon']).bindLabel(val['stopName'], { noHi99999999999999999999999999de: true })
					.addTo(map)
					.showLabel();
					allStationsLayer.addLayer(mapobject);
					*/
				});
				allStationsLayer.bringToBack();
			}
	);
}

function drawTrip(tripId){
	var latlngs=[];
	var i=0;
	
	// TODO fix Mapdata?action=stops to retyurn a labelled record, and not have to go val[0,1,...]
	stopTimesUrl= "/Gee/Mapdata?action=stops&tripId="+tripId;
	$.getJSON(stopTimesUrl, 
			function( data ) {
				tripStationsLayer.clearLayers();
				$.each( data, function( key, val ) {
					mapobject=L.circle([val[0],val[1]], 10, {
						color: 'green',
						fillColor: 'green',
						fillOpacity: 0.3,
					})
					.on("click",function(e) {
					    $( "#select-StopTimes").val(mapobjectToValue[L.stamp(e.target)]);
					    $( "#select-Stops").val(mapobjectToValue[L.stamp(e.target)]);
					    $( "#dialog-edit-StopTimes").data("edit_flag",true);
					    $( "#dialog-edit-StopTimes").dialog( "open" );
					});
					tripStationsLayer.addLayer(mapobject);
					mapobjectToValue[L.stamp(mapobject)]=val[2];

					// this is an array of the leaflet objects so we can zap them next time
					var myIcon = L.divIcon({ 
					    iconSize: new L.Point(80,15), 
					    html: val[2] +":" +val[4]
					});
					mapobject = L.marker([val[0]+0.002,val[1]],{icon:myIcon}).addTo(map);
					// this is just an array for the polyline function
					latlngs.push([val[0],val[1]]);
					tripStationsLayer.addLayer(mapobject);
				});
				mapobject=L.polyline(latlngs, 1000, {
					color: 'green',
					fillColor: 'green',
					fillOpacity: 1
				});
				map.fitBounds(latlngs);
				tripStationsLayer.addLayer(mapobject);
				tripStationsLayer.bringToFront();
	}
	);
}


// FACEBOOK LOGIN

function FBSetup(dfd){
window.fbAsyncInit = function() {
	  FB.init({
	    appId      : '287612631394075',
	    status     : true, // check login status
	    cookie     : true, // enable cookies to allow the server to access the session
	    xfbml      : true  // parse XFBML
	  });

	  // Here we subscribe to the auth.authResponseChange JavaScript event. This event is fired
	  // for any authentication related change, such as login, logout or session refresh. This means that
	  // whenever someone who was previously logged out tries to log in again, the correct case below 
	  // will be handled. 
	  FB.Event.subscribe('auth.authResponseChange', function(response) {
	    // Here we specify what we do with the response anytime this event occurs. 
	    if (response.status === 'connected') {
	      // The response object is returned with a status field that lets the app know the current
	      // login status of the person. In this case, we're handling the situation where they 
	      // have logged in to the app.
	      testAPI();
	      dfd.resolve();	      
	    } else if (response.status === 'not_authorized') {
	      // In this case, the person is logged into Facebook, but not into the app, so we call
	      // FB.login() to prompt them to do so. 
	      // In real-life usage, you wouldn't want to immediately prompt someone to login 
	      // like this, for two reasons:
	      // (1) JavaScript created popup windows are blocked by most browsers unless they 
	      // result from direct interaction from people using the app (such as a mouse click)
	      // (2) it is a bad experience to be continually prompted to login upon page load.
	      FB.login();
	    } else {
	      // In this case, the person is not logged into Facebook, so we call the login() 
	      // function to prompt them to do so. Note that at this stage there is no indication
	      // of whether they are logged into the app. If they aren't then they'll see the Login
	      // dialog right after they log in to Facebook. 
	      // The same caveats as above apply to the FB.login() call here.
	      FB.login();
	    }
	  });
	  };

	  // Load the SDK asynchronously
	  (function(d){
	   var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
	   if (d.getElementById(id)) {return;}
	   js = d.createElement('script'); js.id = id; js.async = true;
	   js.src = "//connect.facebook.net/en_US/all.js";
	   ref.parentNode.insertBefore(js, ref);
	  }(document));

	  // Here we run a very simple test of the Graph API after login is successful. 
	  // This testAPI() function is only called in those cases. 
	  function testAPI() {
	    console.log('Welcome!  Fetching your information.... ');
	    FB.api('/me', function(response) {
	      console.log('Good to see you, ' + response.name + '.');
	    });
       	var access_token =   FB.getAuthResponse()['accessToken'];
       	setCookie('gee_fbat',access_token);
	  }
}



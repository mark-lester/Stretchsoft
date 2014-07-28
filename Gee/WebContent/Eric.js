var hid_lookup=[];
var relations=[];
var get_table_deffereds=[];
var GTFS_Upload_file=null;
var rules={};
var load_count=0;

function MainSetup(){
	dfd = new $.Deferred();
	FBSetup(dfd);
	$.ajaxSetup({
	    beforeSend:function(){
	        // show gif here, eg:
	        $("#loading").show();
	        load_count++;
	    },
	    complete:function(){
	        // hide gif here, eg:
	        load_count--;
	    	if (load_count < 1)
	    		$("#loading").hide();
	    }
	});
	$(document).ready(function(){
		MainSetupInner();
	});
}

function MainSetupInner(){
		initDBCookie();
		initTableRelations();
		initTables();
		SetupMenu();			
		
		$("#interface").show();
		$("#menu").show();
		$("#welcome").hide();
		
		$.when(refreshAll()).done(function(){
			$("#select-Instance").val(databaseName);
			MapSetUp();
		});
}

function getURLParameter(name) {
	  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
	}

function initDBCookie(){
	databaseName=getURLParameter('databaseName') || getCookie("gee_databasename") || "gtfs";
	setCookie("gee_databasename",databaseName);
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
	$.when(deferreds).done(function(){
		console.log("resolving the refresh all dfd");
		dfd.resolve();
	});
	return dfd;
}

function refreshTable(tableName,vector){
	var dfd = new $.Deferred();
	
	var gt_dfd=getTableData(tableName,vector);
	gt_dfd.done(function (){
		var deferreds=refreshChildren(tableName,vector);
		$.when(deferreds).done(function(){
			postRefresh(tableName);

			dfd.resolve();
		});
	});
	
	return dfd;
}

function refreshChildren(tableName,vector){
	var dfd = new $.Deferred();
	var deferreds=[];
	for (child in relations[tableName]['children']){
		deferreds.push(refreshTable(relations[tableName]['children'][child],vector));
	}
	$.when(deferreds).done(function(){
		dfd.resolve();
	});
	return dfd;
}

function postRefresh(tableName){
	switch(tableName){
	case 'Stops':
		drawStops().done(function(){
			drawTrip($('#select-Trips').val());			
		});
		break;
	case 'StopTimes':
		drawTrip($('#select-Trips').val());
		break;
	}
}

function getTableData(table,vector){
	  var dfd = new $.Deferred();
	  $.when(get_table_deffereds[table]).done(
			  function(){
				  $.when(getTableDataInner(table,vector)).done(function (){
					  dfd.resolve();
				  });
			  }
			  );
	  return dfd;
}

function getTableDataInner(tableName,vector){
		var dfd = new $.Deferred();
		get_table_deffereds[tableName]=dfd;
		
		var keyName=relations[tableName]['key'];
//		alert("in getTable tableName="+tableName+" key="+keyName);
		var defaultOrderField=relations[tableName]['display'][0];
		var orderField=relations[tableName]['order'];
		var parentTable=relations[tableName]['parent'];
		var joinKey=relations[tableName]['joinkey'];
		
		var matchField=undefined;
		var matchValue=undefined;
		
		if (parentTable != undefined && relations[parentTable]['no_join'] == undefined){
			matchField=relations[parentTable]['key'];
			matchValue=$('#select-'+parentTable).val();		
		}
		var save_select_row=undefined;
		var $select_list = $("#select-"+tableName);
		if ($("#select-"+tableName).val()!=undefined 
			&& $("#select-"+tableName).val().length > 0
		){
	     	save_select_row=$("#select-"+tableName).val();
	    } 
		if (vector != undefined && vector[tableName] != undefined){
			save_select_row= vector[tableName];
		}
		if (tableName == 'Instance'){
			save_select_row = getCookie("gee_databasename");
			get_permissions(save_select_row);
			console.log("catching databasename "+save_select_row);
		}

		if (orderField==undefined){
			orderField=defaultOrderField;
		}
		
		var $url="/Gee/"+relations[tableName]['method']+"?entity="+tableName;

		if (matchField != undefined){
			if (joinKey != undefined){
				$url+="&parent_field="+matchField+"&value="+matchValue;	
			} else {
				$url+="&field="+matchField+"&value="+matchValue;			
			}
		}
		if (orderField != undefined){
			$url+="&order="+orderField;
		}
		if (joinKey != undefined){
			$url+="&join_key="+joinKey+"&join_table="+parentTable;
		}
		
		hid_lookup[tableName]={};
	    $select_list.empty();

		$.getJSON($url, 
				function( data ) {
				if (joinKey != undefined){
					count=0;
					var subdata=[];
					$.each( data, function( key, values ) {
						subdata[count++]=$.extend(values[0], values[1]); 
					});
					data=subdata;
				}
				$.each( data, function( key, values ) {
					hid_lookup[tableName][values[keyName]]=values['hibernateId'];
					display_data=[];
					for (index in relations[tableName]['display']){
						display_field=relations[tableName]['display'][index];
						display_data.push(values[display_field]);
					}
					var $option=$('<option>').val(values[keyName]).text(
							display_data.join(' ')
							);	
					$option.data(values['hibernateId']);
					$option.appendTo($select_list);
				});
				if (save_select_row != undefined && save_select_row.length != 0
						&& $("#select-"+tableName+" option[value='"+save_select_row+"']").val() != undefined
						&& $("#select-"+tableName+" option[value='"+save_select_row+"']").val().length > 0
				){
					$("#select-"+tableName).val(save_select_row);
				} else {
//					console.log("the save select row isnt in the list anymore, it says")
				}
				dfd.resolve();
			}
		);	
		
		dfd.done(function(){
			// for the benefit of StopTimes, which has two parents, stops and trips, set the initial value of Stops
			secondParentTable = $('#dialog-edit-'+tableName+'-form input[id=secondParentTable]').val();
			if (secondParentTable != undefined 
				&& $('#select-'+tableName).val() != undefined
				&& $('#select-'+tableName).val().length > 0)
				$('#select-'+secondParentTable).val($('#select-'+tableName).val());	    		
		});
		
		return dfd;
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
		relations[tableName]['order']=$('#dialog-edit-'+tableName+'-form :input[order]').attr('name');
		relations[tableName]['joinkey']=$('#dialog-edit-'+tableName+'-form :input[joinkey]').attr('name');
		
		// <input id="stopName" name="stopName" size=30 maxlength=30 required display>
		relations[tableName]['display']=[];
//		relations[tableName]['display']=$('#dialog-edit-'+tableName+'-form :input[display]').attr('name');
		$('#dialog-edit-'+tableName+'-form :input[display]').each(function (){
			relations[tableName]['display'].push($(this).attr('name'));			
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
		initTripBlockDialog();
	}
}

function get_permissions(databaseName){
//	console.log("getting permissions for "+databaseName);
	var $url="/Gee/User?entity=Permissions&databaseName="+databaseName;
	return $.ajax({
		method:"GET",
		dataType: 'JSON',
		url: $url,
		success: function(response){
			database_permissions={};
			database_permissions=response;
		 },
		error: function (xhr, ajaxOptions, thrownError) {
			request_error_alert(xhr);
		}
		 
	});	
}

function initSelectForm(tableName){
	var $template=$("#template-select").clone();
	$template.attr('id','container-'+tableName);
	
	$template.find('#template-select-form')
		.attr('id',"form-"+tableName);
	
	$template.find('#template-select-list')
		.attr('id',"select-"+tableName)
		.attr('name',"select-"+tableName)
		.change(function (){
			pdfd=null;
			if (tableName == 'Instance'){
				console.log("setting db to "+$("#select-"+tableName).val());
				setCookie('gee_databasename',$("#select-"+tableName).val());	
				pdfd=get_permissions($("#select-Instance").val());
			}
			$.when(pdfd).done(function(){
				refreshTable(tableName);				
			});
		});

	$template.find('#template-opener-add')
		.attr('id',"opener-add-"+tableName)
		.click(function(e) {
			e.preventDefault();
			$( "#dialog-edit-"+tableName ).data("edit_flag",false);
			$( "#dialog-edit-"+tableName ).dialog( "open" );
		});

	$template.find('#template-opener-edit')
	.attr('id',"opener-edit-"+tableName)
	.click(function(e) {
		e.preventDefault();
		$( "#dialog-edit-"+tableName ).data("edit_flag",true);
		$( "#dialog-edit-"+tableName ).dialog( "open" );
	});

	$template.find('#template-opener-delete')
	.attr('id',"opener-delete-"+tableName)
	.click(function(e) {
		e.preventDefault();
	    $( "#dialog-delete-"+tableName ).dialog( "open" );
	});
	label=$("#"+tableName).find("h5").text();
	$("#"+tableName).find("h5").remove();
	$template.find('label').text(label);
	$template.appendTo("#"+tableName).show();
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

function initTripBlockDialog(){
	$( "#dialog-edit-TripBlock" ).dialog({ 
		open : function (event,ui){
	       console.log("do some filling in on TripBlock");		
		},
		autoOpen: false, 
		modal :true,
		width : 800,
		resizable : true,
		dragable : true,

	});

}
function initDialogs(tableName){
	$( "#dialog-edit-"+tableName ).dialog({ 
		open : function (event,ui){
			$('#dialog-edit-'+tableName+'-form').validate().form();
			if ($( "#dialog-edit-"+tableName ).data("edit_flag") == true){
				init_edit_values(tableName);
				$(".ui-dialog-titlebar").css("background-color", "green");
			} else {
				init_create_values(tableName);
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
						});
						
					 },
					error: function (xhr, ajaxOptions, thrownError) {
						request_error_alert(xhr);
					}
					 
				}).done(function(){
					postRefresh(tableName);
				});
				
				$( this ).dialog( "close" );
			    
			},
			"Delete" : function () {
				 $( this ).dialog( "close" );	
				 $( "#dialog-delete-"+tableName ).dialog("open");
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
			$(".ui-dialog-titlebar").css("background-color", "red");
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
//				alert("Want to delete "+$('#select-'+tableName).val()+ "in table "+tableName);
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
					},
					error: function (xhr, ajaxOptions, thrownError) {
						request_error_alert(xhr);
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

function update_entity(tableName,values){
	var $url="/Gee/"+relations[tableName]['method'];
	values['entity']=tableName;
	values['action']='update';
	Object.keys(values).forEach(function(key){
		values[key]=values[key]+"";		
	});
	
	var datastring = JSON.stringify(values);
	return $.ajax({
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
		},
		error: function (xhr, ajaxOptions, thrownError) {
			request_error_alert(xhr);
		}
	});
}

function request_error_alert(xhr){
	if (xhr.status == 404){
        alert(jQuery.parseJSON(xhr.responseText)['message']);
      } else {
    	alert("Internal Error: An error has been logged");
      }
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
				setCookie("gee_databasename",record['databaseName']);
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
							},
						error: function (xhr, ajaxOptions, thrownError) {
							request_error_alert(xhr);
							}

				  }
			);
			dfd.done(function(){
				refreshTable(tableName);
			});
			
		break;
		default:
			dfd.resolve();			
	}
	return dfd;
}
//MENUs

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
					async: true,
					url: $url,
					complete: function(response){
						refreshTable('Stops');
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
	    $( "#dialog-import_gtfs" ).find('input').val('');
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
			$("#dialog-import_gtfs-loading" ).hide();
			$("#dialog-import_gtfs-done" ).hide();
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
				$("#dialog-import_gtfs-loading" ).show();
				$("#dialog-import_gtfs-done" ).hide();
				$("#dialog-import_gtfs").dialog('option', 'buttons', {});

				values={};
//				values['url']=$('#dialog-import_gtfs :input[id=upload_file]').val();
				values['file']=window.btoa(GTFS_Upload_file);
//				values['file']=$('#dialog-import_gtfs :input[id=upload_file]').val();
				values['action']='import';
			    var datastring = JSON.stringify(values);
				console.log("zip file length="+GTFS_Upload_file.length+" encoded length="+values['file'].length+" datalength="+datastring.length+"\n");
				$url= "/Gee/Loader";
				
				xhr=$.ajax({
					method:"POST",
					dataType: 'text',
					data:  {values : datastring},
					url: $url,
					success: function(data,textStatus,xhr){
						$("#dialog-import_gtfs-loading" ).hide();
						$("#dialog-import_gtfs-done" ).show();
						$("#dialog-import_gtfs-done-text" ).html("<pre>"+xhr.responseText+"</pre>");
						$("#dialog-import_gtfs" ).dialog('option', 'buttons', {
						    'Ok': function() {
						        $(this).dialog('close');
						    }
						});
						refreshAll();
						},
					error: function(response){
						alert("finished loading GTFS");
						
						$("#dialog-import_gtfs" ).dialog("close");
						refreshAll();
						}
				});	
				
			    
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
	
	$( "#zap_gtfs" ).click(function(e) {
	    e.preventDefault();
	    $( "#dialog-zap_gtfs" ).dialog( "open" );
	    
	});
	
	$("#dialog-zap_gtfs" ).dialog({ 
		open : function (event,ui){
		},
		autoOpen: false, 
		modal :true,
		width : 600,
		resizable : true,
		dragable : true,
		buttons : {
			"Clear": function() {
				$url= "/Gee/Loader?action=zap";
				$.ajax({
					method:"GET",
					dataType: 'JSON',
					url: $url,
					success: function(response){
						console.log("finished zapping GTFS");
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
		$this_select=this.id;		
		tableName=$('#'+formId+" #"+$this_select).attr('table');
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
						.appendTo('#'+formId+" #"+$this_select);
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
// all the paths NOT on the currently edited trip
var tripPathsLayer=L.featureGroup();
// the path AND the stations of the currently edited trip
var tripStationsLayer=L.featureGroup();
allStationsLayer.bringToFront();
tripPathsLayer.bringToFront();
tripStationsLayer.bringToFront();

var baseMaps = {};

var overlayMaps = {
	    "AllStations": allStationsLayer,
	    "TripStations": allStationsLayer
	};

var trainIcon;
function MapSetUp(){
	map = L.map('map', { zoomControl:false });
	osm_tiles='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	baselayer = L.tileLayer(osm_tiles, {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
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


	baseMaps={
		    "OSM": baselayer
		};
	baselayer.addTo(map);
	allStationsLayer.addTo(map);
	tripStationsLayer.addTo(map);
	tripPathsLayer.addTo(map);
	

//	L.control.layers(baseMaps,overlayMaps).addTo(map);
	url="/Gee/Mapdata";
	$.ajax({
		  url: url,
		  dataType: 'json',
		  async : false,
		  success: function(val) {
			  centreLat = val['minLat'] + (val['maxLat']-val['minLat'])/2;
			  centreLon = val['minLon'] + (val['maxLon']-val['minLon'])/2;
//			  map.setView([centreLat, centreLon], 7);

		  }
	});
	map.on('dblclick',function(e) {
	    $( "#dialog-edit-Stops").data("edit_flag",false);
	    $( "#dialog-edit-Stops-form").data("stopLat",e.latlng.lat);
	    $( "#dialog-edit-Stops-form").data("stopLon",e.latlng.lng);

	    $( "#dialog-edit-Stops").dialog( "open" );
	});
}

var mapobjectToValue=[];
function drawStops(){
	var i=0;
	
	mapobjectToValue=[];
	allStationsLayer.clearLayers();
	var all_station_points=[];
	mapurl= "/Gee/Entity?entity=Stops";
	return $.getJSON(mapurl, 
			function( data ) {
				allStationsLayer.clearLayers();
				$.each( data, function( key, val ) {
					var mapobject=L.marker([val['stopLat'],val['stopLon']], {icon: trainIcon, draggable: true}).addTo(map);
					mapobjectToValue[L.stamp(mapobject)]=val['stopId'];
					set_event_handlers_for_station_outside_trip(mapobject,val['stopName']);
					allStationsLayer.addLayer(mapobject);
					all_station_points.push([val['stopLat'],val['stopLon']]);
				});
				allStationsLayer.bringToBack();
			}
	);
}

function set_event_handlers_for_station_outside_trip(mapobject,stopName){
	if (mapobject == null){
		return;
	}
	mapobject.on('dragend', function(e) {
	    var marker = e.target;  // you could also simply access the marker through the closure
	    var result = marker.getLatLng();  // but using the passed event is cleaner
	    update_station(mapobjectToValue[L.stamp(e.target)],result).done(function(){
	    	$.when(drawStops()).done(function (){
			    drawTrip($('#select-Trips').val());							    		    		
	    	});
	    });
	});

	mapobject.on("click", function(e){
		$( "#select-Stops").val(mapobjectToValue[L.stamp(e.target)]);
		drawTripsForStop(mapobjectToValue[L.stamp(e.target)]);
		});
		
	mapobject.removeEventListener("dblclick");
	mapobject.on("dblclick", function(e){
		$( "#select-Stops").val(mapobjectToValue[L.stamp(e.target)]);
		$( "#dialog-edit-StopTimes").data("edit_flag",false);
		$( "#dialog-edit-StopTimes").dialog( "open" );
		});
	
   	var popup_val=stopName;
	if (mapobject.getPopup() != null && 
			(popup_val=mapobject.getPopup().getContent()) != null){
		var matches= popup_val.match(/(.*)</);
		if (matches != null){
			popup_val = matches[1];
		} 
		
		mapobject.unbindPopup();
	}
	mapobject.bindPopup(popup_val);
	mapobject.on('mouseover', function(e) {
		this.openPopup();
		});
	mapobject.setIcon(trainIcon);    
}

function set_event_handlers_for_station_inside_trip(mapobject,station){
	if (mapobject == null){
		return;
	}
	mapobject.on("dblclick",function(e) {
	    $( "#select-StopTimes").val(mapobjectToValue[L.stamp(e.target)]);
	    $( "#select-Stops").val(mapobjectToValue[L.stamp(e.target)]);
	    $( "#dialog-edit-StopTimes").data("edit_flag",true);
	    $( "#dialog-edit-StopTimes").dialog( "open" );
	});

	mapobject.bindPopup(station.stopName + "<br> A:"+station.arrivalTime+" D:"+station.departureTime);
	mapobject.on('mouseover', function(e) {
		this.openPopup();
	});
	mapobject.setIcon(trainboldIcon);	
}


var shape_points=[];
var station_points=[];
var trip_stops=[];
var shapeSequence={};
var drawTrip_dfd = null;

/*
 * TripStructure TS
 * TS.Stations = StationStructure[]
 * TS.Trip = Trip entity
 * 
 * StationStruct = Station Entity + StopTime Entity (just merge)
 * 
 * GetTrip(tripId,TripStruct);
 * 
 * 
 * DrawTrip -> ClearTripLayer, GetTrip(tripId,tripStruct), DrawTripPath(tripStruct), SetTTBE(tripStruct);
 * DrawTripOther -> DrawTripPath(tripStruct)
 * 
 * DrawTripPath - single click on object makes this trip the current trip to be edited, TTBE  
 * SetTTBE - highlight stations on current trip to be editied
 *  
 */

function TripStruct(){
	var tripStruct={};
	tripStruct['Trip']=[];
	tripStruct['Stations']=[];
	tripStruct['ShapePoints']=[];
	tripStruct['station_points']=[];
	return tripStruct;
}
/*
 * DrawTrip - Means Draw and make the current trip to be edited
 */
function drawTrip(tripId){
	var tripStruct = TripStruct();
	$.when(GetTrip(tripId,tripStruct)).done(function(){
		tripStationsLayer.clearLayers();
		SetTTBE(tripStruct);
		DrawTripPath(tripStruct);
	});
}

/*
 * paint all the trips that run from this stop 
 */

function drawTripsForStop(stopId){
	stopTimesUrl= "/Gee/Entity?entity=StopTimes&field=stopId&value="+stopId;
	tripPathsLayer.clearLayers();
	return $.getJSON(stopTimesUrl, 
			function( data ) {			
				$.each( data, function( key, val ) {
					var tripStruct = TripStruct();
					$.when(GetTrip(val['tripId'],tripStruct)).done(function(){
						DrawTripPathOther(tripStruct);						
					});
				});
			}
	);
	
}

function GetTrip(tripId,tripStruct){
	tripUrl="/Gee/Entity?entity=Trips&field=tripId&value="+tripId+"&join_table=Routes&join_key=routeId";
	stopTimesUrl= "/Gee/Entity?entity=Stops&parent_order=stopSequence&join_table=StopTimes&join_key=stopId&parent_field=tripId&value="+tripId;
	shapePointsUrl="/Gee/Entity?entity=Shapes&parent_field=tripId&order=shapePtSequence&join_key=shapeId&join_table=Trips&value="+tripId;

	trip_df = $.getJSON(tripUrl, 
			function( data ) {
				$.each( data, function( key, val ) {
					// hibernate returns an array of two records on a join
					$.extend(val[0],val[1],val[2]);					
					tripStruct.Trip=val[0];
				});
			}
			);
	
	stops_df = $.getJSON(stopTimesUrl, 
			function( data ) {
				$.each( data, function( key, val ) {
					// hibernate returns an array of two records on a join
					$.extend(val[0],val[1]);
					tripStruct.Stations.push(val[0]);
					tripStruct.station_points.push([val[0]['stopLat'],val[0]['stopLon']]);
				});
			}
			);
	
	shapes_df = $.getJSON(shapePointsUrl, 
			function( data ) {
				$.each( data, function( key, val ) {
					// hibernate returns an array of two records on a join
					$.extend(val[1],val[0]);  // we need the right hibernateId, so watch the merge
					tripStruct.ShapePoints.push(val[1]);
				});
			}
			);
	
	var all_dfd = new $.Deferred();
	$.when(stops_df,trip_df,shapes_df).done(function(){
		all_dfd.resolve();
	});
	return all_dfd;
}

/*
 * this one draws trip path for not the current trip being edited, 
 * i.e when you've clicked on a station outside the current trip
 */
var tripLinesToTripStruct=[];
function DrawTripPathOther(tripStruct){
	mapobject=L.polyline( tripStruct.station_points,  {
		color: 'green'
	});
	tripLinesToTripStruct[L.stamp(mapobject)]=tripStruct;
	tripPathsLayer.addLayer(mapobject);
	mapobject.on("click",function(e) {
		var vector={};
		tripPathsLayer.clearLayers();
		vector['Agency']=tripLinesToTripStruct[L.stamp(e.target)].Trip.agencyId;
		vector['Routes']=tripLinesToTripStruct[L.stamp(e.target)].Trip.routeId;
		vector['Trips']=tripLinesToTripStruct[L.stamp(e.target)].Trip.tripId;
		refreshTable('Agency',vector);
	});	
	mapobject.bindPopup("Route "+tripStruct.Trip.routeId);
	mapobject.on('mouseover', function(e) {
		this.openPopup();
		});

}

/*
 * this one prints the path for the current trip, which will include the shape if there is one
 */
function DrawTripPath(tripStruct){
	var i;
	if (tripStruct.ShapePoints.length > 0){
		for (i=0;i<tripStruct.ShapePoints.length-1;i++){
			mapobject=L.polyline( [
					[
					 tripStruct.ShapePoints[i]['shapePtLat'],
					 tripStruct.ShapePoints[i]['shapePtLon']
					],
					[
					 tripStruct.ShapePoints[i+1]['shapePtLat'],
					 tripStruct.ShapePoints[i+1]['shapePtLon']
					]],{
				color: 'blue'
			});
			
			tripStationsLayer.addLayer(mapobject);
			shapeSequence[L.stamp(mapobject)]=i+1;
			mapobject.on("dblclick",function(e) {
			    add_shape_point_after(shapeSequence[L.stamp(e.target)], tripStruct.Trip.shapeId,[e.latlng.lat,e.latlng.lng] );
			});
			DrawShapePoint(tripStruct.ShapePoints[i],tripStruct.Trip.tripId);
		}
		DrawShapePoint(tripStruct.ShapePoints[i],tripStruct.Trip.tripId); // and the last one
	} else {
		mapobject=L.polyline( tripStruct.station_points,  {
			color: 'red',
			opacity : 1
		});
		tripStationsLayer.addLayer(mapobject);
		mapobject.on("dblclick",function(e) {
			create_shape_from_trip(tripStruct.Trip.tripId);
		});
	}
}

function DrawShapePoint(Point,tripId){
	mapobject=L.marker([Point.shapePtLat,Point.shapePtLon], {icon: shapenodeIcon, draggable : true});
	mapobjectToValue[L.stamp(mapobject)]=Point.hibernateId;
	tripStationsLayer.addLayer(mapobject);
	mapobject.on('dragend', function(e) {
	    var marker = e.target;  // you could also simply access the marker through the closure
	    var result = marker.getLatLng();  // but using the passed event is cleaner
	    $.when(update_shape_point(mapobjectToValue[L.stamp(e.target)],result)).done(function(){
	    	// dont bother refocusing, we are already focused!
	    	drawTrip(tripId);
	    });
	});
	mapobject.on('dblclick', function(e) {
		$.when(delete_shape_point(mapobjectToValue[L.stamp(e.target)])).done(function(){
			drawTrip(tripId);							
		}); 
	});

}

function SetTTBE(tripStruct){
	var i;
	if (tripStruct.Stations.length < 1) return ;
	for (i=0;i< tripStruct.Stations.length;i++){
		station=tripStruct.Stations[i];
		var mapobject=L.marker(
								[station['stopLat'],
								 station['stopLon']], 
								{icon: trainboldIcon, draggable: true});
		set_event_handlers_for_station_inside_trip(mapobject,station);
		tripStationsLayer.addLayer(mapobject);
	}
	start=tripStruct.Stations[0];
	finish = tripStruct.Stations[tripStruct.Stations.length-1];
	map.fitBounds([
			[
				start.stopLat,
				start.stopLon
			],
			[
				finish.stopLat,
				finish.stopLon
			]]
			);				
}


function update_station(stopId,coords){
	var $url="/Gee/Entity?entity=Stops&field=stopId&value="+stopId;
	
	return $.ajax({
		method:"GET",
		url: $url,
		dataType: 'JSON',
		success: function(data){
			$.each( data, function( key, values ) {
				values['stopLat']=coords['lat'];
				values['stopLon']=coords['lng'];
				update_entity('Stops',values);
				});
			$.when(drawStops()).done(function(){
				drawTrip($('#select-Trips').val());				
			});
		},
		error: function (xhr, ajaxOptions, thrownError) {
			request_error_alert(xhr);
			$.when(drawStops()).done(function(){
				drawTrip($('#select-Trips').val());				
			});
		}
	});
}

function update_shape_point(hibernateId,coords){
	var $url="/Gee/Entity?entity=Shapes&field=hibernateId&value="+hibernateId;
	return $.ajax({
		method:"GET",
		url: $url,
		dataType: 'JSON',
		success: function(data){
			$.each( data, function( key, values ) {
				values['shapePtLat']=coords['lat'];
				values['shapePtLon']=coords['lng'];
				update_entity('Shapes',values);
				});
			drawTrip($('#select-Trips').val());
			refreshTable('Shapes');
		},
		error: function (xhr, ajaxOptions, thrownError) {
			request_error_alert(xhr);
		}
	});
}


function delete_shape_point(hibernateId){
	var $url="/Gee/Mapdata";
	var values={};
	values['action']='delete_shape_point';
	values['hibernateId']=""+hibernateId;
//	values['shapeId']=shapeId;
    var datastring = JSON.stringify(values);

	return $.ajax({
		method:"POST",
		url: $url,
		dataType: 'JSON',
		data: {values: datastring},
		success: function(response){
			drawTrip($('#select-Trips').val());
			refreshTable('Shapes');
		},
		error: function (xhr, ajaxOptions, thrownError) {
			request_error_alert(xhr);
		}
	});
}

function add_shape_point_after(after, shapeId, coords){
	var $url="/Gee/Mapdata";
	var values={};
	values['after']=""+after;
	values['action']='add_shape_point_after';
	values['shapeId']=shapeId;
	values['shapePtLat']=""+coords[0];
	values['shapePtLon']=""+coords[1];
			
    var datastring = JSON.stringify(values);
	return $.ajax({
		method:"POST",
		dataType: 'JSON',
		data: {values: datastring},
		url: $url,
		success: function(response){
			drawTrip($('#select-Trips').val());
			refreshTable('Shapes');
		},
		error: function (xhr, ajaxOptions, thrownError) {
			request_error_alert(xhr);
		}
	});
}

function create_shape_from_trip(tripId){
	var $url="/Gee/Mapdata";
	values={};
	values['action']='create_shape_from_trip';
	values['tripId']=tripId;
    var datastring = JSON.stringify(values);
	return $.ajax({
		method:"POST",
		dataType: 'JSON',
		data: {values: datastring},
		url: $url,
		success: function(response){
			drawTrip($('#select-Trips').val());
			refreshTable('Shapes');
		},
		error: function (xhr, ajaxOptions, thrownError) {
			request_error_alert(xhr);
		}
	});
	
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



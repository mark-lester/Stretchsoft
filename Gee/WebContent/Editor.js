function Startup(){
	SetUp();
	MapSetUp();
//	$("select, input").uniform();
}

var hid_lookup;
function getTable(tableName,keyName,displayField,matchField,matchValue,orderField){
	if (orderField==null){
		orderField=displayField;
	}
	$url= "/Gee/Entity?entity="+tableName+"&order="+orderField;

	if (matchField != null){
		$url+="&field="+matchField+"&value="+matchValue;
	}
	hid_lookup[tableName]={};
	$.getJSON($url, 
			function( data ) {
			var items = [];
			var save_select_row=$("#select-"+tableName).val();
			$("#form-"+tableName).remove();
			$("#select-"+tableName).remove();
			$("<form>",{id:"form-"+tableName}).appendTo("#"+tableName);

			$select_list=$("<select/>", {
				id: "select-"+tableName,
				name: "select-"+tableName
				});
			$.each( data, function( key, val ) {
				$option=$('<option>')
					.val(val[keyName])
					.text(val[displayField]);
				$option.data(val['hibernateId']);
				$option.appendTo($select_list);
				hid_lookup[tableName][val[keyName]]=val['hibernateId'];
				
			});

			$select_list.appendTo("#form-"+tableName);
			if (save_select_row != null &&
					$("#select-"+tableName+
						" option[value='"+
						save_select_row+"']").length != 0 		
			){
				$("#select-"+tableName).val(save_select_row);
			}
			// for the benefit of StopTimes, set the initial value of Stops
			secondParentTable = $('#dialog-edit-'+tableName+'-form input[id=secondParentTable]').val();
    		$('#select-'+secondParentTable).val($('#select-'+tableName).val());	    		

			//class="pure-button  pure-button-primary"
    		bootstart_button_stuff=' type="button" class="btn btn-primary btn-xs"';
			$('<button type="button" class="btn btn-primary btn-xs">')
				.attr('id',"opener-add-"+tableName)
				.text('Add')
				.appendTo("#form-"+tableName);
			$('<button type="button" class="btn btn-success btn-xs">')
				.attr('id',"opener-edit-"+tableName)
				.text('Edit')
				.appendTo("#form-"+tableName);
			$('<button type="button" class="btn btn-danger btn-xs">')
				.attr('id',"opener-delete-"+tableName)
				.text('Delete')
				.appendTo("#form-"+tableName);
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

		
		    	});
			$( "#dialog-edit-"+tableName ).dialog({ 
				open : function (event,ui){
					$('#dialog-edit-'+tableName+'-form').validate().form();
					if ($( "#dialog-edit-"+tableName ).data("edit_flag") == true){
						$(".edit-dialog .ui-widget-header").css("background-color", "green");
						init_edit_values(tableName,keyName);
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
					"Update": function() {                     
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
					    
						$url= "/Gee/Entity";
						$.ajax({
							method:"POST",
							dataType: 'JSON',
							  async: false,
						data: {values: datastring},
							url: "/Gee/Entity",
							success: function(response){
								postEditHandler(tableName,values);
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
					    
						$url= "/Gee/Entity";
						$.ajax({
							method:"POST",
							dataType: 'JSON',
							data: {values: datastring},
							  async: false,
							url: "/Gee/Entity",
							success: function(response){
//								alert("Record Deleted = "+response);
								postEditHandler(tableName,values);
//								SetUp(tableName);
								}
						});
						$( this ).dialog( "close" );
					    
					},
					Cancel: function() {
						 $( this ).dialog( "close" );
					}
				}
			});

			$( "#opener-add-"+tableName ).click(function(e) {
			    e.preventDefault();
	
			    $( "#dialog-edit-"+tableName ).data("edit_flag",false);
			    $( "#dialog-edit-"+tableName ).dialog( "open" );
			});
		
			$( "#opener-edit-"+tableName ).click(function(e) {
			    e.preventDefault();
			    $( "#dialog-edit-"+tableName ).data("edit_flag",true);
			    $( "#dialog-edit-"+tableName ).dialog( "open" );
			});
			
			$( "#opener-delete-"+tableName ).click(function(e) {
			    e.preventDefault();
			    $( "#dialog-delete-"+tableName ).dialog( "open" );
			});
				
			addChangeFunction(tableName);
			configureSubSelects(tableName);
		});

}


// TODO init_edit and init_create need merging
function init_edit_values(tableName,keyName){
	parentTable = $('#dialog-edit-'+tableName+'-form input[id=parentTable]').val();
    parentKey = $('#dialog-edit-'+tableName+'-form input[id=parentKey]').val();
    secondParentTable = $('#dialog-edit-'+tableName+'-form input[id=secondParentTable]').val();
    secondParentKey = $('#dialog-edit-'+tableName+'-form input[id=secondParentKey]').val();
	$url= "/Gee/Entity?entity="+tableName;
	$url+="&field="+keyName+"&value="+$('#select-'+tableName).val();

    populate_selects('dialog-edit-'+tableName+'-form');
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
    parentTable = $('#dialog-edit-'+tableName+'-form input[id=parentTable]').val();
    parentKey = $('#dialog-edit-'+tableName+'-form input[id=parentKey]').val();
    secondParentTable = $('#dialog-edit-'+tableName+'-form input[id=secondParentTable]').val();
    secondParentKey = $('#dialog-edit-'+tableName+'-form input[id=secondParentKey]').val();
    populate_selects('dialog-edit-'+tableName+'-form');
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



function postEditHandler(tableName,record){
	switch (tableName){
		case 'StopTimes':
			url="/Gee/Mapdata?action=heal&tripId="+record['tripId'];
			
			$.ajax({
				  url: url,
				  async: false,			  
				  dataType: 'json',
						success: function(response){
							drawTrip(record['tripId']);
							}
				  }
			);
	}
	SetUp(tableName);
	
}



function SetUp(tableName){
	hid_lookup = {};
	if (tableName === null){
		tabkeName="";
	}
//	alert("I am trying to set table "+tableName+"\n this is all very much still in development, but thanks for coming");
	switch (tableName){
	  default:
	  case "Agency":
			getTable("Agency","agencyId","agencyName");
	  case "Calendar":
			getTable("Calendar","serviceId","serviceId");
	  case "CalendarDates":
			getTable("CalendarDates","date","date","serviceId",$('#select-Calendar').val());

	  case "Stops":
			getTable("Stops","stopId","stopName");
			drawStops();
	  // the default should just call the top 3, the ones below wil get called as a result.
	  // but if we change any of the below then referesh everything below it
	  break;
			
	  case "Routes":
			getTable("Routes","routeId","routeId");
	  case "Trips":
			getTable("Trips","tripId","tripId","routeId",$('#select-Routes').val());
		
	  case 'Frequencies':
			getTable("Frequencies","startTime","startTime","tripId",$('#select-Trips').val(),"startTime");
		  
	  case "StopTimes":
			getTable("StopTimes","stopId","stopId","tripId",$('#select-Trips').val(),"stopSequence");
			drawTrip($('#select-Trips').val());
	}
}

function addChangeFunction(tableName){
	switch (tableName){
	case 'Agency': 
	case 'Routes': 
	case 'Trips': 
	case 'Calendar': 
		$('#select-'+tableName).change(function() {
			configureSubSelects(tableName);
		});
	break;
	
	case 'StopTimes': 
// set the "second parent table" select list to match this, it should be Stops, which I could hard code
// but there may be another table like this, and hey, this is all scary enough now anyway
		$('#select-'+tableName).change(function() {
		    secondParentTable = $('#dialog-edit-'+tableName+'-form input[id=secondParentTable]').val();
    		$('#select-'+secondParentTable).val($('#select-'+tableName).val());	   
    		
		});
		
	break;
	}
}

function configureSubSelects(tableName){
	switch (tableName){
		case 'Agency': 
			getTable("Routes","routeId","routeId","agencyId",$('#select-Agency').val());
			break;
		case 'Calendar': 
			getTable("CalendarDates","date","date","serviceId",$('#select-Calendar').val());
			break;
		case 'Routes': 
			getTable("Trips","tripId","tripId","routeId",$('#select-Routes').val());
		break;
		case 'Trips': 
			getTable("StopTimes","stopId","stopId","tripId",$('#select-Trips').val(),"stopSequence");
			getTable("Frequencies","startTime","startTime","tripId",$('#select-Trips').val(),"startTime");
			drawTrip($('#select-Trips').val());
		break;
	}
}


function populate_selects(formId){
	var $selects = $('#'+formId+' select');

	$selects.each(function(){
		$(this).empty();
		$this_select=this;
		switch (this.id){
			case 'serviceId':
				tableName='Calendar';
				keyName='serviceId';
				displayField='serviceId';
			break;
			case 'stopId':
				tableName='Stops';
				keyName='stopId';
				displayField='stopName';
			break;
		}
		url= "/Gee/Entity?entity="+tableName+"&order="+keyName;
	
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
	drawStops();
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
					mapobject=L.circle([val[0],val[1]], 1000, {
						color: 'green',
						fillColor: 'green',
						fillOpacity: 1,
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
					mapobject = L.marker([val[0]+0.02,val[1]],{icon:myIcon}).addTo(map);
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





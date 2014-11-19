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
				"n="+GeeMap.getBounds().getNorth()+
				"&s="+GeeMap.getBounds().getSouth()+
				"&e="+GeeMap.getBounds().getEast()+
				"&w="+GeeMap.getBounds().getWest()+
				"&t="+$( "#stop_type").val()
				;
				$.ajax({
					method:"GET",
					dataType: 'JSON',
					async: true,
					url: $url,
					complete: function(response){
						$KingEric.get("Stops").request("Load",true);
						}
				});
				$( this ).dialog( "close" );
			    
			},
			Cancel: function() {
				downcount();
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
			$(".ui-dialog-titlebar").css("background-color", "purple");
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
	        	if ($("#create_db","#dialog-import_gtfs").prop('checked')){
	        		mydatabaseName="user_"+getCookie("gee_username");
	        		if (!check_exists_db(mydatabaseName)){
	        			create_database(mydatabaseName);
	        		}
	        		databaseName=mydatabaseName;
	        		setCookie("gee_databasename",databaseName);
				}
				values={};
				values['file']=window.btoa(GTFS_Upload_file);
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
						$KingEric.get("Instance").request("Load",true);
						},
					error: function(xhr, ajaxOptions, thrownError){
						$("#dialog-import_gtfs-loading" ).hide();
						$("#dialog-import_gtfs-done" ).show();
						$("#dialog-import_gtfs-done-text" ).html("<pre>"+xhr.responseText+"</pre>");
						$KingEric.get("Instance").request("Load",true);
						}
				});	
				
			    
			},
			Cancel: function() {
				downcount();
				 $( this ).dialog( "close" );
			}
		}
	});

	$( "#publish_gtfs" ).click(function(e) {
	    e.preventDefault();
	    $( "#dialog-publish_gtfs" ).dialog( "open" );
	    
	});
	
	$("#dialog-publish_gtfs" ).dialog({ 
		open : function (event,ui){
			$("#dialog-publish_gtfs-loading" ).hide();
			$("#dialog-publish_gtfs-done" ).hide();
			$("#publish_publish" ).show();
			$("#publish_cancel" ).html("Cancel");

			$(".ui-dialog-titlebar").css("background-color", "purple");
		},
		autoOpen: false, 
		modal :true,
		width : 600,
		resizable : true,
		dragable : true,
		buttons : [
		    { 
		      text:"Publish",
		      id : "publish_publish",
		      click : function() {
			    // only the GTFS id (e.g agencyId) is stored as the value in the select list
			    // this horrid global nested hash was the only way I could map 
			    // from tableName + gtfs-id value to hibernateId
				$("#dialog-publish_gtfs-loading" ).hide();
				$("#dialog-publish_gtfs-done" ).hide();
				$("#publish_publish" ).hide();
				
				
				$url= "/Gee/GitHub";
				
				values={};
				values['comment']=$("#dialog-publish_gtfs-form #comment").val();
				values['action']='push';
			    var datastring = JSON.stringify(values);

				xhr=$.ajax({
					method:"POST",
					dataType: 'text',
					data:  {values : datastring},
					url: $url,
					success: function(data,textStatus,xhr){
						$("#dialog-publish_gtfs-loading" ).hide();
						$("#dialog-publish_gtfs-done" ).show();
						obj = JSON.parse(xhr.responseText);
						$("#dialog-publish_gtfs-done-text" ).html("<pre>"+obj.message+"</pre>");
						$("#publish_cancel" ).html("Close");
						},
					error: function(xhr, ajaxOptions, thrownError){
						$("#dialog-publish_gtfs-loading" ).hide();
						$("#dialog-publish_gtfs-done" ).show();
						$("#dialog-publish_gtfs-done-text" ).html("<pre>"+xhr.responseText+"</pre>");
						}
				  });	  
			    }
		      },
			  {
		     	text :	"Cancel",
			    id : "publish_cancel",
     			click : function() {
				     downcount();
				    $( this ).dialog( "close" );
			    }
			  }
		]
	});
	
	$("#dialog-login" ).dialog({ 
		open : function (event,ui){
			$(".ui-dialog-titlebar").css("background-color", "purple");
		},
		autoOpen: false, 
		modal :true,
		width : 600,
		resizable : true,
		dragable : true
	});


	$( "#export_gtfs" ).click(function(e) {
	    e.preventDefault();
	    export_gtfs();
	});
	
	$( "#zap_gtfs" ).click(function(e) {
	    e.preventDefault();
	    $( "#dialog-zap_gtfs" ).dialog( "open" );
	    
	});

	$( "#logged_out" ).click(function(e) {
	    e.preventDefault();
	    $( "#dialog-login" ).dialog( "open" );
	    
	});
	
	$("#dialog-zap_gtfs" ).dialog({ 
		open : function (event,ui){
			$(".ui-dialog-titlebar").css("background-color", "orange");
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
						$KingEric.get("Instance").request("Load",true);
						}
				});
				$( this ).dialog( "close" );
			    
			},
			Cancel: function() {
				 $( this ).dialog( "close" );
			}
		}
	});

	$("#dialog-move_stop" ).dialog({ 
		open : function (event,ui){
			$("#dialog-move_stop-form #move" ).val(0);
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
			Move: function() {
				$KingEric.get("Stops").request("create_or_update_entity",move_stop_values,function(){
					$KingEric.get("StopTimes").request("Load",true);
				});			
				 $( this ).dialog( "close" );				
			},
			Cancel: function() {
				stop_saved_marker.setLatLng(new L.LatLng(stop_saved_lat,stop_saved_lon));
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

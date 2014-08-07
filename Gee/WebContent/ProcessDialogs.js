
/*  jquery stuff */
Eric.prototype.ProcessDialogs = function (){
	var dialogs={};
	var eric=this;
    console.log("Processing dialogs for "+this.name);
    $(this.ED).find("#edit").attr('id','edit-'+this.name);
//    $(this.ED).find("#edit form #edit").attr('id','edit-form-'+this.name);
    $(this.ED).find("#delete").attr('id','delete-'+this.name);
    this.initInputForm('edit-'+this.name);
//	var validator = $("#edit-"+eric.name).validate();
//	console.log("validator is "+validator);
//	validator.form();
    
	dialogs['edit']=$("#edit-"+this.name).dialog({ 
		open : function (event,ui){
			$("#edit-"+eric.name+" form").validate().form();
			
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
				if (eric.followup_request){
					eric.request(eric.followup_request,values);
					eric.followup_request=null;
				}
				
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
			$(".ui-dialog-titlebar").css("background-color", "green");
			$("#tabular-"+eric.name+" form").validate().form();
			this.init_tabular_values();
	//		eric.PopulateTabular();  // should be done automagically via Draw
		},
		autoOpen: false, 
		modal :true,
		width : 800,
		resizable : true,
		dragable : true,
		dialogClass: "edit-dialog",
		buttons : {
			"Save": function() {
				eric.ProcessTabular();
				 $( this ).dialog( "close" );
			},
			"Add": function() {
				eric.followup_request="open_tabular_dialog";
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


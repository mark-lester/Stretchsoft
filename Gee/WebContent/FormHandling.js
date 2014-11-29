
Eric.prototype.initInputForm = function (formId){
//	$('#'+formId).validate().form();
	// set the pickers
	$('#'+formId+" input").each(function() {
    	switch ($(this).attr('picker')){
    		case 'date':
    		$(this).datepicker({
    		    showAnim: 'slideDown',
    		    dateFormat: 'yyyymmdd'
    		});
    		break;
    		
    		case 'time':
	    	$(this).timepicker({
	    	    timeFormat: 'Z:i:s',
	    	    step:1,
    		    minTime:0,
    		    maxTime:172800
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
    			var target=$(this).parent().find('#'+$(this).attr('greaterthan'));
    			if (!$(target).val() || $(this).val() < $(target).val())
    				$(target).val($(this).val());
    		});
    	}
    	
    	if ($(this).attr('lessthan')){
    		$(this).change(function(){
    			var target=$(this).parent().find('#'+$(this).attr('lessthan'));
    			if (!$(target).val() || $(this).val() > $(target).val())
    				$(target).val($(this).val());
    		});
    	}    
    });
	$('#'+formId+" select").each(function() {
		// want timezones but way too many to stick in the HTML, so allow  <select json="name.of.json"> 
		// TODO, could extend to enable option values and display values
    	if ($(this).attr('json')){
    		select=this;
    		select_list_array=$.getJSON($(this).attr('json'),function (data){
        		var i;
        		for (i=0;i<data.length;i++){
        			$(select).append("<option>"+data[i]+"</option>");
        		}   			
    		});
    		
    	}
    });

};

//RUN TIME FORM HANDLING, THIS STUFF GETS RUN EVERY TIME YOU CLICK EDIT


Eric.prototype.init_edit_values = function (){
	var record=[];
	if (this.edit_flag){
		record=this.currentRecord();
		if (record == null){
			console.log("oh, no data");
			record=[];
		}
	} else {
		record=[];
	}
	var element = $('#edit-'+this.name);
	this.init_edit_values_over_element(element,record);	
};

Eric.prototype.init_tabular_values = function (){
	this.edit_flag=true;
};

Eric.prototype.init_edit_values_over_element = function (element,record){
	var eric=this;
    this.populate_selects_in_form_over_element(element);
    var relations=this.relations;

    $(element).find("input").each(function() {
    	if (this.id == relations.key && eric.edit_flag){			    	
			// dont let them edit the key on edit else any kids will be orphaned 
    		//(actually constraints stop nasty stuff happening, but we stil dont want them trying to edit it)

    		//			$(this).attr("readonly",true);			        
    		$(this).val(record[this.id]);
    	} else if (this.id == relations.parentKey){
    		$(this).attr("readonly",true);			        
	        $(this).val(eric.parent.value());        
	    } else if (this.id == relations.secondParentKey && eric.edit_flag){
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
       				if (record != null && record[this.id] != null ){
        				$(this).val(record[this.id]);
        				$(this).spectrum("set",record[this.id]);       					
       				}
    		    break;
    		    
       			default:
       				if ($(this).attr("table")){
       		    		$(this).attr("readonly",true);
           				var from = $KingEric.get($(this).attr("table"));
           				var from_record=from.getrecord(record[from.relations.key]);
           				if (from_record) $(this).val(from_record[this.id]);
           			} else {
           				if (record != null && record[this.id] != null )
           					$(this).val(record[this.id]);           				
           			}
        		}    			
    		} else { // we're in create, this is an editable field, so zap it
	    		$(this).val("");
	    		$(this).attr("readonly",false);
	    		if (eric.dialogs.edit.data[this.id]){
		    		$(this).val(eric.dialogs.edit.data[this.id]);
	    		}
    		}
        }
    });

    if (DEBUG) console.log("finding selects ");

    $(element).find('select').each(function() {
		if (DEBUG) console.log("detected select "+this.id);

    	if (record != null && record[this.id] != null ){
    		if (DEBUG) console.log("setting select "+this.id+" to "+record[this.id]);
    		$(this).val(record[this.id]);    		
    	}
    });	    
};

Eric.prototype.populate_selects_in_form_over_element = function (element){
	var eric=this;
	$(element).find('select').each(function(){
		this_select=this;
		var tableName=$(this).attr('table');
		if (!tableName) return;
		$(this).empty();
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
};


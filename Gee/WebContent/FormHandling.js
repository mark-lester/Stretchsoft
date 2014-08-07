
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
};

//RUN TIME FORM HANDLING, THIS STUFF GETS RUN EVERY TIME YOU CLICK EDIT

//this is just for any select lists inside the edit/create forms
Eric.prototype.populate_selects_in_form_dep = function (form){
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

Eric.prototype.init_edit_values_dep = function (){
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
    				console.log("about to bomb but i shouldnt be here I presume");
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

Eric.prototype.init_edit_values = function (){
	var record=[];
	if (this.edit_flag){
		record=this.currentRecord(this.value());
		if (record == null){
			console.log("oh shit");
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
			$(this).attr("readonly",true);			        
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

    $(element).find('select').each(function() {
    	$(this).val(record[this.id]);
    });	    
};

Eric.prototype.populate_selects_in_form_over_element = function (element){
	$(element).find('select').each(function(){
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
};


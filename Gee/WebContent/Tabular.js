/*
 * find the table lines from the parent and this, under #table
 * create dialog with row for each record in this entity
 * 
 in Trip
   <div id="table">
    <input id="routeId" size=30 maxlength=30 required><br>
    <input id="tripId" name="tripId" size=20 maxlength=20 required key display>
    <select id="serviceId" name="serviceId" table="Calendar"></select>
    <input id="tripHeadsign" size=30 maxlength=100 required>
    <input id="tripShortName" name="tripShortName" size=60 maxlength=60 >
    <input id="shapeId" name="shapeId" size=60 maxlength=60 >
   </div>
 
 
 in StopTimes
   <div id="table">
    <input id="stopId" name="stopId" readonly><br>
    <input id="arrivalTime" name="arrivalTime"  type=text picker=time required display lessthan="departureTime">
    <input id="departureTime" name="departureTime" type=text picker=time required greaterthan="arrivalTime">
   </div>
   
   will output a tabular form, with the Trip at the top, and a line for each record in the current data set
   with a <input id=row value=$$ROW$$ readonly>
   or maybe
   <div id="row-$$ROW$$>
   
   
   
   
   the pickers need processing, and we need to think about my lassthan.greaterthan as it's assuming unique instance of fields
   
 */


/*
 * <div id="table-row">
    <input id="stopId" name="stopId" readonly><br>
    <input id="arrivalTime" name="arrivalTime"  type=text picker=time required display lessthan="departureTime">
    <input id="departureTime" name="departureTime" type=text picker=time required greaterthan="arrivalTime">
   </div>
 */
var MAX_TABULAR_ROWS=200;

Eric.prototype.MakeTabularTemplate = function (){
	var elem = document.createElement( "div" );
	$(elem).attr('id',"tabular-"+this.name)
	.attr("title",this.title)
	.append($("#tabular-template").clone())
	.appendTo(this.ED);
};

Eric.prototype.PopulateTabular = function (){
	var eric=this;
	if (this.data.length > MAX_TABULAR_ROWS){
		alert("Sorry, we can only handle "+MAX_TABULAR_ROWS+
				" in tabulare editing, you will have to edit them indivudually");
		return false;
	}
	$("#tabular-"+this.name+" #parent").empty();
	this.edit_flag=true;
	if(this.parent){
		var parent_row=$(this.parent.ED).find("#table-row").clone();
		parent_rec= this.parent.currentRecord();
		this.init_edit_values_over_element(parent_row,parent_rec);
		$(parent_row).appendTo("#tabular-"+this.name+" #parent");				
	}
	
	row_container = $("#tabular-template #table").clone();
	var table_row=$(this.ED).find("#table-row").clone();
	$("#tabular-"+this.name+" #table").empty();
	
	var table_header=$(this.ED).find("#table-header").clone();
	$(table_header).appendTo("#tabular-"+this.name+" #table");	
	for (row in this.data){
		var table_row=$(this.ED).find("#table-row").clone();
		table_row.attr('count',row);
		this.init_edit_values_over_element(table_row,this.data[row]);
		button=$("#tabular-row-delete-button button").clone();	
		var fieldset=$(table_row).find("fieldset");
//		$(button).attr('id',$(button).attr('id')+"-"+row);
		this.add_button_click(button,this.data[row]);
		$(button).appendTo(table_row);
		$(table_row).appendTo("#tabular-"+this.name+" #table");	
		
	}
	var table_footer=$(this.ED).find("#table-footer").clone();
	$(table_footer).appendTo("#tabular-"+this.name+" #table");	

	this.initInputForm("tabular-"+this.name);
	return true;
};


Eric.prototype.add_button_click = function (button,record){
	var eric=this;
	$(button).click(function(e) {
		e.preventDefault();
		eric.request("remove_entity",record);
	});
};

Eric.prototype.FillInputs = function (object,record){
	if (!record) return;
	$(object).find("input,select").each(function(){
		$(this).val(record[this.id]);
		record['changed']=false;
	});
};

Eric.prototype.FillOutputs = function (object,record){
	if (!record) return;
	$(object).find("input,select").each(function(){
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



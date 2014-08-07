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
	
	$template.find('#template-opener-tabulate')
	.attr('id',"opener-tabulate-"+this.name)
	.click(function(e) {
		e.preventDefault();
		eric.request("Load",true);
		eric.request("open_tabular_dialog",true);
	});

	
	$template.find('label').text(
				$(this.ED).find("#select label").text()
				);
	this.UIobject = $("#"+this.name+".Eric_Place_Holder");
	$template.appendTo(this.UIobject);
	return this.UIobject;
};	

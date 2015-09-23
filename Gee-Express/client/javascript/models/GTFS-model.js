/**
 * base model class
 */
define(['models/plurals.js'], function(plurals){
	 return Backbone.RelationalModel.extend({
		 apiBase:'/api/',
         urlRoot:function(){
        	 var url=this.apiBase;
        	 if (this.parent){
        		 url+=this.parent+'/'+this.parent_id+'/';
        	 }
        	 return url+this.objectPlural
         },
		 parse:function(content){
			 return content.data != undefined ? content.data : content;
		 },
	     initialze:function(){
	         this.objectPlural=plurals[this.entity_name];
	     },
     });
});

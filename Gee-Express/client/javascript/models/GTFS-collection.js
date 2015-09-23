/**
 * base Collection class
 */
define(['models/plurals.js'], function(plurals){
	 return Backbone.Collection.extend({
		 apiBase:'/api/',
		 display:'name',
         url:function(){
        	 var url=this.apiBase;
        	 if (this.parent){
        		 url+=plurals[this.parent]+'/'+this.parent_id+'/';
        	 }
        	 return url+this.objectPlural
        },

		 parse:function(content){
			 return content.data != undefined ? content.data : content;
		 },
        initialize:function(){
            this.objectPlural=plurals[this.entity_name];
        }
     });
});

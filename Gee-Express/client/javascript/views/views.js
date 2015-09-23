define(['models/models.js','models/plurals.js','handlebars'], function(Schema,plurals,Handlebars){
	var Views={};
	function resolve(text){
				Handlebars.registerHelper('$',resolve);
				return Handlebars.compile('{{'+text+'}}')(this);
			}
	Handlebars.registerHelper('$', function (text){
		return Handlebars.compile('{{'+text+'}}')(this);
	});
	Handlebars.registerHelper('SET', function (left,right){
		this[left]=right;
		return;
	});
	Handlebars.registerHelper('LOOKUP', function (name,show){
		return Schema.Collections[name].where({id:this[name+'Id']})[0].attributes[show];
	});
	
	var Generic=Marionette.ItemView.extend({
		// allow access to all the view's content
		templateHelpers:function(){
			return jQuery.extend(this,{
				'$':function (text){
					return Handlebars.compile('{{'+text+'}}')(this);
				}
			});
		},
		template: '#NavigationTemplate',
		value:"unset",
		
		init_general: function(){
			this.name=this.collection.entity_name;
			this.select_id=this.name+'_select';
			this.parent=this.collection.parent;
			this.nice_name=this.nice_name||this.name;
			
			var self=this;
			this.listenTo(this.collection,"change",function(){
				self.render();
				$('#'+self.select_id).change(function(){
					self.value=$(this).val();
					self.trigger('change');
				});
				
				$('#'+self.select_id).trigger("change");
			});

			// go get the top one 
			if (!this.parent){
				this.collection.fetch().then(function(){
					self.collection.trigger("change");
				});
			}
			
			if (this.parent){
				// dont get til the parent has done
				this.listenTo(Views[this.parent],"change",function(){
					this.collection['parent_id']=Views[this.parent].value;
					var self=this;
					this.collection.fetch().then(function(){
						self.collection.trigger("change");
					});
				});
			}
		},
		// allows the initialiser to be easily appended to
		initialize:function(){
			this.init_general();
		},
		/*
	     serializeData: function () {
	    	  var data = Marionette.ItemView.prototype.serializeData.apply(this);
	    	  for (var i in data.items){
		    	  data.items[i].display = 
		    		  this.collection.display ? 
		    				  (this.collection.display.constructor === 'Array' ?
		    						  this.collection.display.map(function(field){
		    							  resolve_display(data.items[i],field); 
		    						  }).join(' ')
		    						  :
		    						  resolve_display(data.items[i],this.collection.display)
		    				  )
			    			  :
		    				  data.items[i].name;	    		  
	    	  }
	    	  return data;
	    	}
	    	*/
	});
	
	function resolve_display(row,field){
		// Entity.field, row must reference the associated table with EntityId, as per Sequelize
		var c=field.split('.');
		if (c.length == 2){
			var key=c[0] + 'Id';
			return Schema.Collections[c[0]].where({key:row[key]})[c[1]];
		}
		// else as normal, just look up the field
		return row[field];
	}
	
	// cheap way of churning these out
	for (table in plurals){
		if (table == 'User') continue;
		Views[table]=new (Generic.extend({
			entity_name:table,
			collection:Schema.Collections[table],
		}))();
	}

	return Views;
});


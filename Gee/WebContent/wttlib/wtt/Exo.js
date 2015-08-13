define(['jquery','backbone','underscore','mustache','populate'],function(jQuery,B,U,Mustache){
	
    var Exo={};
    var build=function(){
			console.log("build");
			var _this=this;
			
			$('div.Exo[type=Template]').each(function(){
				console.log("adding templateName="+this.id)
				Mustache.parse(
				  Exo.templateStore[this.id]=$(this).html()
				);
			});
			$('div.Exo[type=Module]').each(function(){
				console.log("adding templateName="+this.id)
				Mustache.parse(
				  Exo.templateStore[this.id]=$(this).html()
				);
			});
			
			$('div.Exo[type=Module]').each(function(){
				var name=this.id;
				var parent=$(this).attr('parent');
				console.log("adding module="+this.id)
				
				var Model = Backbone.Model.extend(
					Exo.readModel(this)
					);
				
				_this.models[name]=new Model();				
				
				var Collection=Exo.Collection.extend({
						model:Model,
						url:function(){
							return '/Gee/Entity?entity='+name;
						}
					});
				
				var collection = new Collection();
	//			this.collection.bind("change reset add remove", this.setIndex, this);
				
				$('div.Exo[type=View]').each(function(){
					var View=Exo.View.extend({
						el:this,
						collection:collection,
						parent:parent,
						templateName:name});
					var view=new View();
					_this.views.push(view);
					console.log("about to fetch");
					view.collection.fetch();
					view.render();
				});
				
				console.log("name="+$(this).attr('id'));
			});
		};
		var readModel=function(model){
			var _this=this;
			var keyname,display_field;
			
			$(model).find('.Exo [type=View]').each(function(){
				$(this).find('input').each(function(){
					if ($(this).attr('key')){
						keyname=$(this).id();
					}
					if ($(this).attr('display')){
						display_field=$(this).id();
					}
				});
			});
			return {
					idAttribute:keyname,	
					displayField:display_field
			};
		};
		
    
	Exo={
		views:[],
		models:[],
		templateStore:[],

		Exo:function(){
			
		},
		main:function(){
			this.build();
		},
			
        build:build,
		readModel:readModel,
				
		
		Collection:Backbone.Collection.extend({
			cursor:{
				index:null,
				value:null,
				keyname:null
			},
			currentRecord:function(options){
				return this.at(this.cursor.index);
			},
			currentValue:function(){
				return this.cursor.value;
			},
			
			setKeyname:function(keyname){
				this.cursor.keyname=keyname;
			},
			initialize:function(){
				this.setIndex();
			},
			setIndex:function(){
				var size=this.size();
				if (!size) return;
				
				if (!this.cursor.index){
					this.cursor.index=0;
					return;
				}
				if (this.cursor.index >= size){
					this.cursor.index--;
				}
				
			},
			
		}),

		View:Backbone.View.extend({	
			module:null,
			intialise:function(){
				this.listenTo(this.collection, "change", this.render);
			},
			render:function(){
				$(this.el).html(this.executeTemplate(this.templateName,this.el,this.collection));
				$(this.el).populate(this.collection.currentRecord());
				return this;
			},
			resolve:function(){
	            return function(text,render){
	                return render("{{" + render(text) + "}}");
	            };
	        },
			populate:function(){
				var _view=this;
	            return function(text,render){
				 	$(_view.el).populate(_view.currentRecord());
	                return 
	            };
	        },

			executeTemplate:function(templateName,context){
				$(context).html(Mustache.render(Exo.templateStore[templateName],this));
				var _this=this;
			 	
			 	$(context).find('div.Exo-Execute').each(function(){
			 		$(_this).html(_this.executeTemplate($(this).attr("name"),this));
			 	});
				return context;
			},
			
		}),			
		currentRecord:function(){
//			fetch_by_key(this.collection,this.keyname,this.value);
			return this.collection.at(0);
		},
	};
	return Exo;
});

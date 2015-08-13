define(['leaflet'],function(leaflet){
	var KingEric = function  (){
		this.typeByName=[];
		var _this=this;
		
		require(['wtt/Eric'], function(Eric) {
			console.log("fetched Eric.js ="+Eric);
			var dummy=new Eric();
			console.log("dummy="+dummy);
		    _this.typesByName['Eric']=Eric;
		});
//		require(['wtt/MapEric'], function(MapEric) {
//		    _this.typesByName[MapEric]=MapEric;
//		});
		console.log("name length="+this.typesByName.length+ " from:"+this.typesByName);
		this.subjects = {};
		this.orphans = [];
		this.name ="King Eric";
		this.Init();

		// cant find a way to incrementally build this, so have to add it after building the map layers
		if (this.layercontrol){
			L.Control.EasyButtons = L.Control.extend({
			    options: {
			        position: 'topright'
			    },

			    onAdd: function () {
			        this.container=$("#mapbutton_container").clone();
			        for (var o in this.overlays){
			            row_content=$("#mapbutton_rowcontent").clone();
			            set_row_content(row_content,overlays[o]);
			            $(this.container).append(row_content);
			        }
			        
			        return this.container[0];
			    }
			});

			for (key in overlays){
				console.log("overlay -"+key+"="+overlays[key]);
			}
			if (false) layercontroler=L.control.layers(baseMaps,overlays).addTo(GeeMap);
			console.log("done layer control");	
		}
		for (var index in this.orphans){
			this.orphans[index].PrintTree(0);
		}
		// need to set the database. yucky I know
		this.subjects["Instance"].seed=databaseName;
		
		// there would normally by one orphan, but i guess you can have multiple trees
		// send the top a "Load" request and it should cascade down the tree
	};

	KingEric.prototype.extend({
   Load:function (){
		for (var index in this.orphans){
			this.orphans[index].request("Load");
		}	
	},

	Empty:function (){
		for (var index in this.orphans){
			this.orphans[index].Empty();
		}	
	},


	add:function (eric){
		if (this.subjects[eric.name]){
			// assertion failure, we already have one of this name
			return null;
		}
		if (!eric.parent_name){
			this.orphans.push(eric);
		}
		return this.subjects[eric.name]=eric;
	},

	get:function (name){
		return this.subjects[name];
	},

// I'm not currently envisaging a dynamic eric tree, but it's possible
	remove:function (name){
		this.subjects[name]=undefined;
		for (var i in this.orphans){
			if (this.orphans[i].name == name){
				this.orphans.splice(i,1);
			}
		}
	},
	


	Init:function (){
		var king = this;
		// go find stuff and build the tree
		$('.Eric').each(function(){
			var $className = $(this).attr('type');
			if (!$className) $className = "Eric";
			console.log("window="+window+" className="+$className+ " =="+window[$className]);
			//var eric = new window[className](this);
			var eric = new this.typesByName[$className]();
			
			if (eric.parent_name){
				eric.parent=king.get(eric.parent_name);
			}
			if (eric.relations.secondParentTable){
				eric.secondParent=king.get(eric.relations.secondParentTable);
			}
			
			if (eric.parent)
				eric.parent.addChild(eric);
			king.add(eric);
		});	
	}});
   return KingEric;
});





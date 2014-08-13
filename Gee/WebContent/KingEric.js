function KingEric (){
	this.subjects = {};
	this.orphans = [];
	this.name ="King Eric";
	this.Init();

	// cant find a way to incrementally build this, so have to add it after building the map layers
	if (layercontrol){
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
}


KingEric.prototype.Load = function (eric){
	for (var index in this.orphans){
		this.orphans[index].request("Load");
	}	
};


KingEric.prototype.add = function (eric){
	if (this.subjects[eric.name]){
		// assertion failure, we already have one of this name
		return null;
	}
	if (!eric.parent_name){
		this.orphans.push(eric);
	}
	return this.subjects[eric.name]=eric;
};

KingEric.prototype.get = function (name){
	return this.subjects[name];
};

// I'm not currently envisaging a dynamic eric tree, but it's possible
KingEric.prototype.remove = function (name){
	this.subjects[name]=undefined;
	for (var i in this.orphans){
		if (this.orphans[i].name == name){
			this.orphans.splice(i,1);
		}
	}
};


KingEric.prototype.Init = function (){
	var king = this;
	// go find stuff and build the tree
	$('.Eric').each(function(){
		var className = $(this).attr('type');
		if (!className) className = "Eric";
		var eric = new window[className](this);
		
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
};




/************************************************************************/

// MapEric is the base "class" for maps, extending Eric, which is set up for All Stops
var allStationsLayer=L.featureGroup();
// all the paths NOT on the currently edited trip
var tripPathsLayer=L.featureGroup();
//the path AND the stations of the currently edited trip
var tripStationsLayer=L.featureGroup();
// all the trips 
var allTripsLayer=L.featureGroup();


MapEric.prototype = Object.create(Eric.prototype);
MapEric.prototype.constructor = MapEric;

function MapEric(ED){
	this.objectToValue={};
	Eric.call(this, ED);
}

MapEric.prototype.type_specific = function (){
// stuff to do with creating laye
	this.featureGroup=L.featureGroup();
	console.log("I just made a feature group for"+this.title+" = "+	this.featureGroup);
	this.objectstore=[];
	console.log("leaflet stuff "+this.name+"="
			+JSON.stringify(this.featureGroup));
	overlays[this.title]=this.featureGroup;
//	this.featureGroup.addTo(GeeMap);
};


MapEric.prototype.Load = function (){
	// stuff to do with fetching any extra data, e.g for the full route map
	// if we exceed some kind of limit on data fetch, we can turn this object (an Eric of subclass Map) off
	//this.queue.clear();
	// nothing to do for stops, it's all in the parent
	this.request("Draw");
};

var first_call=true; 
MapEric.prototype.Draw = function (){
	// stuff to do with playing about with map objects, using either (normally) the parents data store
	// or in the case of the route map, local data
	this.featureGroup.clearLayers();
	this.objectstore=[];
	var eric=this;
    var data = eric.parent.data;
	
	$.each( data, function( key, val ) {
		var mapobject=L.marker([val['stopLat'],val['stopLon']], {icon: smallTrainIcon, draggable: true});
		eric.objectstore.push(mapobject);
		eric.objectToValue[L.stamp(mapobject)]=val[eric.parent.relations.key];
		eric.stop_event_handlers(mapobject,val['stopName']);
		eric.featureGroup.addLayer(mapobject);
	});
	
	if (data.length>0){
		if (first_call || !this.featureGroup.getBounds().contains(GeeMap.getBounds())){
			GeeMap.fitBounds(this.featureGroup.getBounds());		
		}		
	}
	
	first_call=false;
	// we are politey issuing a 'Changed' request incase we have further descendants
	this.featureGroup.bringToFront();
	this.featureGroup.addTo(GeeMap);
	this.request("Changed");
};

MapEric.prototype.stop_event_handlers = function (mapobject,stopName){
	var eric=this;
	if (mapobject == null){
		return;
	}
	mapobject.on('dragend', function(e) {
	    var marker = e.target;  // you could also simply access the marker through the closure
	    var coords = marker.getLatLng();  // but using the passed event is cleaner
	    var values = eric.parent.getrecord(eric.objectToValue[L.stamp(e.target)]);
		values['stopLat']=coords['lat'];
		values['stopLon']=coords['lng'];
		values['action']="update";
		values['entity']='Stops';
		
		$KingEric.get("Stops").request("create_or_update_entity",values,function(){
			$KingEric.get("StopTimes").request("Load",true);
		});
	});

	mapobject.on("click", function(e){
		// set the parent value to this stopId
		eric.parent.value(eric.objectToValue[L.stamp(e.target)]);
		});
		
	mapobject.on("dblclick", function(e){
		eric.parent.value(eric.objectToValue[L.stamp(e.target)]);
		$KingEric.get("StopTimes").request("open_edit_dialog",false);
		});
	
   	var popup_val=stopName;
	popup=mapobject.bindPopup(popup_val);
	mapobject.on('mouseover', function(e) {
		console.log("You're hovering on "+popup_val);
		popup.openPopup();
		});
};

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
	Eric.call(this, ED);
	this.objectToValue={};
	this.layer=null;
	this.objectstore=[];
	this.featureGroup=L.featureGroup();	
	overlays.push(this);
	this.draw_flag=true;
}

MapEric.prototype.type_specific = function (){
// stuff to do with creating layers, it's defunct right now
	
	if (layercontrol){
		this.layerGroup=L.layerGroup();		
		this.featureGroup=L.featureGroup();		
		overlays[this.title]=this.layerGroup;
		console.log("I just made a feature group for"+this.title+" = "+	this.featureGroup);
		console.log("leaflet stuff "+this.name+"="
				+JSON.stringify(this.featureGroup));

		console.log("added to map");
	}
};


MapEric.prototype.Load = function (){
	// stuff to do with fetching any extra data, e.g for the full route map
	// if we exceed some kind of limit on data fetch, we can turn this object (an Eric of subclass Map) off
	//this.queue.clear();
	// nothing to do for stops, it's all in the parent
	this.request("Draw");
};



MapEric.prototype.stop_event_handlers = function (mapobject,stopName){
	var eric=this;
	if (mapobject == null){
		return;
	}
   	var popup_val=stopName;
	popup=mapobject.bindPopup(popup_val);
	var latlng=mapobject.getLatLng();

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
		this.openPopup();
		// set the parent value to this stopId
		eric.parent.value(eric.objectToValue[L.stamp(e.target)]);
		});
		
	mapobject.on("dblclick", function(e){
		eric.parent.value(eric.objectToValue[L.stamp(e.target)]);
		$KingEric.get("StopTimes").request("open_edit_dialog",false);
		});
	
	mapobject.on('mouseover', function(e) {
		this.openPopup();
		});
};

MapEric.prototype.Hide = function (){
	this.Clear();
	this.draw_flag=false;
};

MapEric.prototype.Clear = function (){
	for (var o in this.objectstore){
		GeeMap.removeLayer(this.objectstore[o]);
	}
};

MapEric.prototype.Show = function (){
	this.Clear();  //make sure we arent adding stuff twice
	for (var o in this.objectstore){
		GeeMap.addLayer(this.objectstore[o]);
	}
	this.draw_flag=true;
};

MapEric.prototype.ToggleDraw = function(){
	if (this.draw_flag){
		this.Hide();
	} else {
		this.Show();		
	}
};


var first_call=true; 
MapEric.prototype.initDraw = function (){
	this.featureGroup.clearLayers();
	this.Clear();
	for (var o in this.objectstore){
		GeeMap.removeLayer(this.objectstore[o]);
	}
	this.objectstore=[];
};

MapEric.prototype.Draw = function (){
	// stuff to do with playing about with map objects, using either (normally) the parents data store
	// or in the case of the route map, local data
	this.initDraw();
	var eric=this;
    var data = eric.parent.data;
    var last;
	$.each( data, function( key, val ) {
		if (DEBUG) console.log("adding "+val.stopName);
		var mapobject=L.marker([val['stopLat'],val['stopLon']], 
				{
				icon: smallTrainIcon, 
				draggable: true,
				riseOnHover : true,
				zIndexOffset : 1000
				});
		last=mapobject;
		eric.objectstore.push(mapobject);
		eric.objectToValue[L.stamp(mapobject)]=val[eric.parent.relations.key];
		eric.stop_event_handlers(mapobject,val['stopName']);
		eric.featureGroup.addLayer(mapobject);
		if (eric.draw_flag)	mapobject.addTo(GeeMap);			
	});
	
	if (this.draw_flag)
		if (first_call || !GeeMap.getBounds().contains(this.featureGroup.getBounds())){
			GeeMap.fitBounds(this.featureGroup.getBounds());		
		}		
   
	first_call=false;
	// we are politely issuing a 'Changed' request incase we have further descendants
	this.request("Changed");		
};

MapEric.prototype.Draw_openlayers = function (){
	this.objectstore=[];
	var eric=this;
    var data = eric.parent.data;
    var last;
	var size = new OpenLayers.Size(16,16);
	var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
	var icon = new OpenLayers.Icon('http://gee.chalo.org.uk:8080/Gee/img/railway-station-16.jpg', size, offset);
	$.each( data, function( key, val ) {
	    var myLocation = new OpenLayers.Geometry.Point(val['stopLon'], val['stopLat']).transform('EPSG:4326', 'EPSG:3857');
	    eric.layer.addFeatures([
	                         new OpenLayers.Feature.Vector(myLocation, {tooltip: 'OpenLayers'})
	                     ]);

/*
		var station_marker= new OpenLayers.Marker(
						new OpenLayers.LonLat(
								val['stopLon'],
								val['stopLat'],
								icon.clone()
								)
						);
		eric.layer.addMarker(station_marker);
*/
	});
	GeeMap.zoomToExtent(this.layer.getDataExtent());
};


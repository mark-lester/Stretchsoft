/************************************************************************/

MapEricShape.prototype = Object.create(MapEric.prototype);
MapEricShape.prototype.constructor = MapEricShape;
function MapEricShape(ED){
	MapEric.call(this, ED);
}

MapEricShape.prototype.Draw = function (){
	this.featureGroup.clearLayers();    
    for (var o in this.objectstore){
    	GeeMap.removeLayer(this.objectstore[o]);
    }
    
	this.objectstore=[];

	var eric=this;
    var data = eric.parent.data;
	var mapobject=null;
	//Get latlng from first marker
	if (data.length < 1){
		return null; // dont try any leaflet stuff with nothing
	}

	var previous=null;
	$.each( data, function( key, val ) {
		mapobject=L.marker([val['shapePtLat'],val['shapePtLon']], {icon: shapenodeIcon, draggable: true});
		eric.objectToValue[L.stamp(mapobject)]=val[eric.parent.relations.key];
		eric.node_event_handlers(mapobject,val);
		eric.featureGroup.addLayer(mapobject);
		this.objectstore.push(mapobject);
		if (previous){	
			mapobject=L.polyline( [
		                        [previous.shapePtLat,previous.shapePtLon],
		                        [val.shapePtLat,     val.shapePtLon]
		                       ],
		                       {color: 'blue', opacity : 1});
			eric.line_event_handlers(mapobject,val);
			eric.featureGroup.addLayer(mapobject);
			mapobject.addTo(GeeMap);
			this.objectstore.push(mapobject);
		}
		previous=val;
	});
	
	GeeMap.fitBounds(this.featureGroup.getBounds());
	// we are politey issuing a 'Changed' request incase we have further descendants
	if (layercontrol)
		this.featureGroup.addTo(GeeMap);
	this.request("Changed");
	return null;
};


MapEricShape.prototype.line_event_handlers = function (mapobject,values){
	if (mapobject == null){
		return;
	}
	mapobject.on("dblclick",function(e) {
	    add_shape_point_after(values.shapePtSeq, this.parent.data[0].shapeId,[e.latlng.lat,e.latlng.lng] );
	});
};

function add_shape_point_after(after, shapeId, coords){
	var $url="/Gee/Mapdata";
	var values={};
	values['after']=""+after;
	values['action']='add_shape_point_after';
	values['shapeId']=shapeId;
	values['shapePtLat']=""+coords[0];
	values['shapePtLon']=""+coords[1];
			
    var datastring = JSON.stringify(values);
	return $.ajax({
		method:"POST",
		dataType: 'JSON',
		data: {values: datastring},
		url: $url,
		success: function(response){
			$KingEric.get('Shapes').request("Draw");
		},
		error: function (xhr, ajaxOptions, thrownError) {
			request_error_alert(xhr);
		}
	});
}


MapEricShape.prototype.node_event_handlers = function (mapobject,values){
	if (mapobject == null){
		return;
	}
	mapobject.on('dragend', function(e) {
	    var result = e.target.getLatLng();  
	    values.shapePtLat = result.lat;
	    values.shapePtLon = result.lng;
	    $KingEric.get("Shapes").request("create_or_update_entity",values);
	});
	mapobject.on('dblclick', function(e) {
		$KingEric.get("Shapes").request("remove_entity",values);
	});
};

MapEricTrip.prototype.line_event_handlers = function (mapobject,index){
	if (mapobject == null){
		return;
	}
	mapobject.on("dblclick",function(e) {
	    add_shape_point_after(index, this.parent.data[0].shapeId,[e.latlng.lat,e.latlng.lng] );
	});
};


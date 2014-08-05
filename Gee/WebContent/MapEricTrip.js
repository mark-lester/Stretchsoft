/************************************************************************/

MapEricTrip.prototype = Object.create(MapEric.prototype);
MapEricTrip.prototype.constructor = MapEricTrip;
function MapEricTrip(ED){
	MapEric.call(this, ED);
}

MapEricTrip.prototype.Draw = function (){
	this.featureGroup.clearLayers();
	var eric=this;
    var data = eric.parent.data;
	var stops_eric=$KingEric.get("Stops");
	var latlngs = Array();
	var mapobject=null;
	//Get latlng from first marker
	if (data.length < 1){
		return null; // dont try any leaflet stuff with nothing
	}
	$.each( data, function( key, val ) {
		var StopRecord = stops_eric.getrecord(val['stopId']); 
		mapobject=L.marker([StopRecord['stopLat'],StopRecord['stopLon']], {icon: boldTrainIcon, draggable: true});
		latlngs.push(mapobject.getLatLng());
		eric.objectToValue[L.stamp(mapobject)]=val[eric.parent.relations.key];
		eric.stop_event_handlers(mapobject,StopRecord.stopName + "<br> A:"+val.arrivalTime+" D:"+val.departureTime);
		eric.featureGroup.addLayer(mapobject);
	});
	mapobject=L.polyline( latlngs,  {
		color: 'red',
		opacity : 1
	});
	eric.featureGroup.addLayer(mapobject);		
	
	mapobject.on("dblclick",function(e) {
		create_shape_from_trip($KingEric.get("Trips").value());
	});
	
	GeeMap.fitBounds(this.featureGroup.getBounds());
	// we are politey issuing a 'Changed' request incase we have further descendants
	this.featureGroup.addTo(GeeMap);
	this.request("Changed");
};

function create_shape_from_trip(tripId){
	var $url="/Gee/Mapdata";
	values={};
	values['action']='create_shape_from_trip';
	values['tripId']=tripId;
    var datastring = JSON.stringify(values);
	return $.ajax({
		method:"POST",
		dataType: 'JSON',
		data: {values: datastring},
		url: $url,
		success: function(response){
			$KingEric.get("Shapes").request("Load",true);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			request_error_alert(xhr);
		}
	});
	
}

MapEricTrip.prototype.stop_event_handlers = function (mapobject,stopName){
	var eric=this;
	if (mapobject == null){
		return;
	}
	mapobject.on('dragend', function(e) {
	    var marker = e.target;  // you could also simply access the marker through the closure
	    var coords = marker.getLatLng();  // but using the passed event is cleaner
	    var values = $KingEric.get("Stops").getrecord(eric.objectToValue[L.stamp(e.target)]);
		values['stopLat']=coords['lat'];
		values['stopLon']=coords['lng'];
		values['action']="update";
		values['entity']='Stops';
		
		$KingEric.get("Stops").request("create_or_update_entity",values,function(){
			$KingEric.get("Trips").request("Draw",true);
		});
		
	});

	mapobject.on("click", function(e){
		// set the parent value to this stopId
		eric.parent.value(eric.objectToValue[L.stamp(e.target)]);
		});
		
	mapobject.on("dblclick", function(e){
		eric.parent.value(eric.objectToValue[L.stamp(e.target)]);
		$KingEric.get("StopTimes").request("open_edit_dialog",true);
		});
	
   	var popup_val=stopName;
	mapobject.bindPopup(popup_val);
	mapobject.on('mouseover', function(e) {
		this.openPopup();
		});
};


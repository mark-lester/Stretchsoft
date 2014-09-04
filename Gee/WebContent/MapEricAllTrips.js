/************************************************************************/


MapEricAllTrips.prototype = Object.create(MapEric.prototype);
MapEricAllTrips.prototype.constructor = MapEricAllTrips;
function MapEricAllTrips(ED){
	MapEric.call(this, ED);
	this.total_records=0;
	this.off=false;
	this.tripIds=[];
	this.max_records = $(ED).attr("max_records");
	if (!this.max_records)
		this.max_records=10000;	
}

MapEricAllTrips.prototype.Load = function (force){
	this.off=false;
	if (layercontrol)
	GeeMap.addLayer(this.featureGroup);
	this.request("Draw",force);
};

MapEricAllTrips.prototype.Draw = function (force){
	this.initDraw();
    
	var eric=this;
	this.tripIds=[];
	if (this.off){
if(DEBUG)console.log("All Trips Turned Off Cos Too Big");
		return;		
	}
	if (layercontrol)
	this.featureGroup.clearLayers();
	tripsUrl= "/Gee/Entity?entity=Trips";
	return $.getJSON(tripsUrl, 
			function( data ) {			
				$.each( data, function( key, val ) {
					eric.idstore.push(val.tripId);
				});
			}
	).done(function(){
		eric.request("AllTripCycle");		
	});
	
};

MapEricAllTrips.prototype.AllTripCycle = function(){
	var eric=this;
	if (tripId=this.idstore.shift()){
		setTimeout(function(){
			eric.request("GetTrip",tripId);
			},3);
	}
};

function TripStruct(){
	var tripStruct= {};
	tripStruct['Trip']=[];
	tripStruct['shape_points']=[];
	tripStruct['station_points']=[];
	return tripStruct;
}


MapEricAllTrips.prototype.GetTrip = function(tripId){
	var tripStruct= {};
	tripStruct['Trip']=[];
	tripStruct['shape_points']=[];
	tripStruct['station_points']=[];

	var tripUrl="/Gee/Entity?entity=Trips&field=tripId&join_table=Routes&join_key=routeId&value="+tripId;
	var stopTimesUrl= "/Gee/Entity?entity=Stops&parent_order=stopSequence&join_table=StopTimes&join_key=stopId&parent_field=tripId&value="+tripId;
	var shapePointsUrl="/Gee/Entity?entity=Shapes&parent_field=tripId&order=shapePtSequence&join_key=shapeId&join_table=Trips&value="+tripId;
	if (this.off)
		return null;
	var eric=this;
	trip_df = $.getJSON(tripUrl, 
			function( data ) {
				$.each( data, function( key, val ) {
					// hibernate returns an array of two records on a join
					$.extend(val[0],val[1],val[2]);					
					tripStruct.Trip=val[0];
				});
			}
			);
	
	stops_df = $.getJSON(stopTimesUrl, 
			function( data ) {
				$.each( data, function( key, val ) {
					// hibernate returns an array of two records on a join
					$.extend(val[0],val[1]);
					tripStruct.station_points.push([val[0]['stopLat'],val[0]['stopLon']]);
					eric.record_count++;
				});
			}
			);
	
	shapes_df = $.getJSON(shapePointsUrl, 
			function( data ) {
				$.each( data, function( key, val ) {
					// hibernate returns an array of two records on a join
					$.extend(val[1],val[0]);  // we need the right hibernateId, so watch the merge
					tripStruct.shape_points.push([val[0]['shapePtLat'],val[0]['shapePtLon']]);
					eric.record_count++;
				});
			}
			);
	var all_dfd= new $.Deferred();
	$.when(stops_df,trip_df,shapes_df).done(function(){
		if (this.total_records > this.max_records){
			this.off=true;
			alert("Ooops, this one has more than "+this.max_records+" geo data points, I am turning off the Route Map Layer");
			GeeMap.removeLayer(this.featureGroup);
		}
		eric.request("DrawTrip",tripStruct);
		all_dfd.resolve();
	});
	return all_dfd;
};

MapEricAllTrips.prototype.DrawTrip = function (tripStruct){
	this.total_records+=tripStruct.record_count;
    colour=tripStruct.Trip.routeColor;
    if (tripStruct.shape_points.length > 0){
		mapobject=L.polyline( tripStruct.shape_points,  {
			color: 'black',
			zIndexOffset : -1000
		});		
	} else {
		mapobject=L.polyline( tripStruct.station_points,  {
			color: 'black',
			zIndexOffset : -1000
		});	
	}
	
	mapobject.on("click",function(e) {
		$KingEric.get("Agency").seed = tripStruct.Trip.agencyId;
		$KingEric.get("Routes").seed = tripStruct.Trip.routeId;
		$KingEric.get("Trips").seed = tripStruct.Trip.tripId;
		$KingEric.get("Agency").request("Draw",true);
	});	
	mapobject.bindPopup("Route "+tripStruct.Trip.routeId);
	mapobject.on('mouseover', function(e) {
		this.openPopup();
		});

	this.objectstore.push(mapobject);
	if (this.draw_flag) mapobject.addTo(GeeMap);
	this.request("AllTripCycle");
};

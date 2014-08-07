/************************************************************************/

MapEricSingleTrip.prototype = Object.create(Eric.prototype);
MapEricSingleTrip.prototype.constructor = MapEricSingleTrip;
function MapEricSingleTrip(ED){
	Eric.call(this, ED);	
}

MapEricSingleTrip.prototype.Load = function (force){
	this.request("Draw",force);
};
MapEricSingleTrip.prototype.Draw = function (force){
	$KingEric.get("MapEricAllTrips").request("GetTrip",$KingEric.get("Trips").value());
};

MapEricSingleTrip.prototype.type_specific = function (){
};


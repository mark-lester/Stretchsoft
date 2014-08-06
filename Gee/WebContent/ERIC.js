/*
 *  * 
 * 
*/

/* my stuff has assignments in it, in aprticular to establish the class stuff 
 * of ajax is asynch, so you could be loading in say MapEricTrip.js ,wjich inherits from MapEric, 
 * and MapEric hasnt beenevaluated, and it will blow up, and ye wil not know why
 */

/*    
function loadScripts(scripts){
	var script;
	var dfd= new $.Deferred();
	var queue = jQuery.jqmq({    
        // Next item will be processed only when queue.next() is called in callback.
        delay: -1,
        // Process queue items one-at-a-time.
        batch: 1,
        callback: function( request ) {        		
        	$.when($getScript(request)).done(function (){
            	queue.next(); 
            	if (queue.size() == 0){
            		dfd.resolve();
            	}
        	});
        }
    });
	while (script=scripts.shift()){
		queue.add(script);		
	}
	return dfd;
}

loadScripts([
            "SetupMenu.js",
            "KingEric.js",
            "BaseEric.js",
            "MapEric.js",
            "MapEricTrip.js",
            "MapEricShape.js",
            "MapEricSingleTrip.js",
            "MapEricAllTrips.js"]);


*/



var DEBUG=false;
var databaseName="gtfs";

function SetUp(){
	$.ajaxSetup({
		beforeSend:upcount,
		complete:downcount
	});
	$(document).ajaxStop(function () {
		load_count=0;
		$("#loading").hide();
	});
	$("#template-select").show();
	$("#interface").show();
	$("#welcome").hide();
	dfd = new $.Deferred();
	initDBCookie();
	FBSetup(dfd);
	MapSetup();
	SetupMenu();
//	console.log("waiting for facebook");
//	$.when(dfd).done(function(){
//		console.log("got facebook");
		$KingEric= new KingEric();	

//	});
}


// utility stuff
var load_count=0;
function upcount(){
	// show gif here, eg:
	$("#loading").show();
	load_count++;
}
function downcount(){
	// hide gif here, eg:
	load_count--;
	if (load_count < 1)
		zerocount();
}
function zerocount(){
	// hide gif here, eg:
	load_count=0;
	$("#loading").hide();
}

function initDBCookie(){
	databaseName=getURLParameter('databaseName') || getCookie("gee_databasename") || "gtfs";
if(DEBUG)console.log("Database ="+databaseName);
	if (!check_exists_db(databaseName)) databaseName="gtfs";
	setCookie("gee_databasename",databaseName);
}
var database_permissions=[];
function check_exists_db(databaseName){
	get_permissions(databaseName); // blocking, synchronous
	return database_permissions[databaseName]['exists'] == "1";	
}

// this has to go
function get_permissions(databaseName){
	var $url="/Gee/User?entity=Permissions&databaseName="+databaseName;
	return $.ajax({
		method:"GET",
		dataType: 'JSON',
		url: $url,
		async: false,
		success: function(response){
if(DEBUG)console.log("database permissions for "+databaseName+"rec="+response+
					" exists="+response['exists']);
			database_permissions[databaseName]=response;
		 },
		error: function (xhr, ajaxOptions, thrownError) {
			request_error_alert(xhr);
		}		 
	});	
}

function getURLParameter(name) {
	  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
};

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i].trim();
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}

function setCookie(cname,value){
if(DEBUG)console.log("setting cookie "+cname+"="+value);
	document.cookie=cname+"="+value;				
}


function request_error_alert(xhr){
	if (xhr.status == 404){
        alert(jQuery.parseJSON(xhr.responseText)['message']);
      } else {
    	alert("Internal Error: An error has been logged");
      }
}

// MAP STUFF
var GeeMap=null;
var smallTrainIcon=null;
var bigTrainIcon=null;
var boldTrainIcon=null;
var shapenodeIcon=null;
var basemaps={};
var overlays={};
var layercontrol;

function MapSetup(){
	GeeMap = L.map('map', { zoomControl:false });
	var osm_tiles='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var baselayer = L.tileLayer(osm_tiles, {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
	});
	var Stamen_TonerLabels = L.tileLayer('http://{s}.tile.stamen.com/toner-labels/{z}/{x}/{y}.png', {
		attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
		subdomains: 'abcd',
		minZoom: 0,
		maxZoom: 20
	});
	
	smallTrainIcon = L.icon({
	    iconUrl: 'img/railway-station-16.jpg',
	    iconSize:     [16, 16], // size of the icon
	    iconAnchor:   [8, 8], // point of the icon which will correspond to marker's location
	    popupAnchor:  [0, -16] // point from which the popup should open relative to the iconAnchor
	});

	bigTrainIcon = L.icon({
	    iconUrl: 'img/steamtrain.png',
	    iconSize:     [44, 44], // size of the icon
	    iconAnchor:   [22, 44], // point of the icon which will correspond to marker's location
	    popupAnchor:  [0, -44] // point from which the popup should open relative to the iconAnchor
	});

	boldTrainIcon = L.icon({
	    iconUrl: 'img/steamtrain-bold.png',
	    iconSize:     [44, 44], // size of the icon
	    iconAnchor:   [22, 44], // point of the icon which will correspond to marker's location
	    popupAnchor:  [0, -44] // point from which the popup should open relative to the iconAnchor
	});

	shapenodeIcon = L.icon({
	    iconUrl: 'img/node.png',
	    iconSize:     [22, 22], // size of the icon
	    iconAnchor:   [11, 11], // point of the icon which will correspond to marker's location
	    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
	});
	var OpenStreetMap_DE = L.tileLayer('http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
	});
	baseMaps={
		    "OSM": baselayer,
		    "Stoner":Stamen_TonerLabels,
		    "OSM/DE":OpenStreetMap_DE
		};
	baselayer.addTo(GeeMap);
}

var DEBUG=true;
var layercontrol=false;
var openlayers=false;
var layercontroler=null;
var databaseName="gtfs";
var $KingEric=null;

function SetUp(){
	$.ajaxSetup({
		beforeSend:upcount,
		complete:downcount
	});
	$(document).ajaxStop(function () {
		zerocount();
	});
	CheckLogin();
	initDBCookie();
	SetupMenu();
	$KingEric= new KingEric();	
	if (openlayers){
		MapSetup_openlayers($KingEric);
	} else {
		MapSetup_Leaflet($KingEric);
	}
	$KingEric.Load();
	$("#welcome").hide();
	$("#interface").show();		
	$("#menu").show();		
}

function CheckLogin(){
	var userId=getCookie("gee_user");
	if (userId == null || userId == "guest"){
		$("#logged_in").hide();
		$("#login_button").show();
	} else {
		$("#logged_in").text("Logged in as "+userId);
		$("#logged_in").show();
		$("#login_button").hide();	
	}
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
if(DEBUG)console.log("Setting Database Cookie ="+databaseName);
//	if (!check_exists_db(databaseName)) databaseName="gtfs";
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
	deleteCookie(cname);
	document.cookie=cname+"="+value;				
}
function deleteCookie( cname ) {
	  document.cookie = cname + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
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
var overlays=[];

function MapSetup_openlayers(king){
//	GeeMap = new OpenLayers.Map('map',{maxResolution: 0.703125} );
//    var newLayer = new OpenLayers.Layer.OSM("OSM", "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {numZoomLevels: 19});
//    GeeMap = new OpenLayers.Map('map', { controls: [] });
 //   GeeMap.addLayer(newLayer);
    //GeeMap = new OpenLayers.Map('map');
    
    GeeMap = new OpenLayers.Map({
        div: "map", projection: "EPSG:3857",
        layers: [new OpenLayers.Layer.OSM(), king.get("Map_Stops").layer], 
        zoom: 15
    });
 
  //  var layer = new OpenLayers.Layer.WMS( "OpenLayers WMS", 
   //     "http://vmap0.tiles.osgeo.org/wms/vmap0", {layers: 'basic'} );
    //var mapnik = new OpenLayers.Layer.OSM();
  
    //GeeMap.addLayer(mapnik);
   // GeeMap.addLayer(layer);
//    GeeMap.setCenter(new OpenLayers.LonLat(0, 0), 0);

    GeeMap.addControl(new OpenLayers.Control.LayerSwitcher());
    GeeMap.addControl(new OpenLayers.Control.PanZoomBar());
}

function MapSetup_Leaflet(){

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
	var newControl = new L.Control.EasyButtons;
    GeeMap.addControl(newControl);
	GeeMap.on('dblclick',function(e) {
		console.log("got a double click event");
		var Stops=$KingEric.get("Stops");
		Stops.dialogs.edit.data["stopLat"]=e.latlng.lat;
		Stops.dialogs.edit.data["stopLon"]=e.latlng.lng;
		Stops.request("open_edit_dialog",false);
	});

}

function set_row_content(row_content,eric){
	$(row_content).find('label').text(eric.title);
	$(row_content).find('#checkbox').prop('checked', this.draw_flag);
	
	$(row_content).find('#checkbox').change(function(){
		eric.ToggleDraw();
		//  belt and braces, just make sure the checkbox matches what the draw_flag now says
		$(row_content).find('#checkbox').prop('checked', this.draw_flag);		
	});
}

L.Control.EasyButtons = L.Control.extend({
    options: {
        position: 'topright'
    },

    onAdd: function () {
        this.container=$("#mapbutton_container").clone();
        for (var o in overlays){
            row_content=$("#mapbutton_rowcontent").clone();
            set_row_content(row_content,overlays[o]);
            $(this.container).append(row_content);
        }
        
        return this.container[0];
    }
});


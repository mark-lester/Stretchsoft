define(['jquery','leaflet','wtt/KingEric','wtt/SetupMenu'],function(jquery,L,KingEric,SetupMenu){

return {
	DEBUG:false,
	layercontrol:false,
	openlayers:false,
	layercontroler:null,
	databaseName:"gtfs",
	KingEric:null,
	MAX_STOPS_TO_VIEW:500,
	// utility stuff
	load_count:0,
	database_permissions:[],
	
	Main:function(){
				
		$("#logged_in").hide();
        var _this=this;
		$( document ).ready(function() {
			$("#welcome").show();
			$("#Eric_Declarations").hide();
			$("#loading").hide();
			$("#interface").hide();
			$("#dialogs").hide();
			console.log("this="+_this);
			_this.SetUp();	
			$("#welcome").hide();
			$("#interface").show();		
			$("#menu").show();		
		});
	},

	
	SetUp: function(){
		$.ajaxSetup({
			beforeSend:this.upcount,
			complete:this.downcount
		});
		var _this=this;
		$(document).ajaxStop(function () {
			_this.zerocount();
		});
		this.CheckLogin();
		this.initDBCookie();
		console.log("about to setup");
		require(['wtt/SetupMenu'],function(S){
			S.SetupMenu();			
		});
		console.log("about to kingeric");
		var _this=this;
		require(['wtt/KingEric'],function(KingEric){
			console.log("loaded kingeric="+KingEric);
			_this.KingEric=new KingEric();	
			console.log("made kingeric="+_this.KingEric);
			_this.KingEric.Load();
		});
		console.log("done kingeric="+this.KingEric);
		if (this.openlayers){
			this.MapSetup_openlayers();
		} else {
			this.MapSetup_Leaflet();
		}
	},

	CheckLogin:function (){
		var userId=this.getCookie("gee_user");
		if (userId == null || userId == "" || userId == "guest"){
			$("#logged_in").hide();
			$("#logged_out").show();
		} else {
			$("#logged_in_text").text('Logged in as <'+userId+'>');
			$("#logged_in").show();
			$("#logged_out").hide();	
		}	
	},

	upcount:function (){
		// show gif here, eg:
		$("#loading").show();
		this.load_count++;
	},
	
	downcount:function (){
		// hide gif here, eg:
		this.load_count--;
		if (this.load_count < 1)
			this.zerocount();
	},
	
	zerocount:function(){
		// hide gif here, eg:
		this.load_count=0;
		$("#loading").hide();
    },

	 initDBCookie:function(){
		this.databaseName=this.getURLParameter('databaseName') || this.getCookie("gee_databasename") || "gtfs";
		if(this.DEBUG)console.log("Setting Database Cookie ="+this.databaseName);
//			if (!check_exists_db(databaseName)) databaseName="gtfs";
				this.setCookie("gee_databasename",this.databaseName);
	 },
	 
	 getURLParameter: function (name) {
		  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
	 },

	 check_exists_db:function (databaseName){
			this.get_permissions(databaseName); // blocking, synchronous
			return this.database_permissions[databaseName]['exists'] == "1";	
	 },

// this has to go
	 get_permissions:function (databaseName){
		 var $url="/Gee/User?entity=Permissions&databaseName="+databaseName;
		 var _this=this;
		 return $.ajax({
				method:"GET",
				dataType: 'JSON',
				url: $url,
				async: false,
				success: function(response){
		if(this.DEBUG)console.log("database permissions for "+_this.databaseName+"rec="+response+
							" exists="+response['exists']);
					_this.database_permissions[databaseName]=response;
				 },
				error: function (xhr, ajaxOptions, thrownError) {
					request_error_alert(xhr);
				}		 
		 });	
	 },

	 getURLParameter:function (name) {
		  return decodeURIComponent(
				  (new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
	 },

	 getCookie:function (cname) {
		    var name = cname + "=";
		    var ca = document.cookie.split(';');
		    for(var i=0; i<ca.length; i++) {
		        var c = ca[i].trim();
		        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
		    }
		    return "";
	 },

	 setCookie:function (cname,value){
		 if(this.DEBUG)console.log("setting cookie "+cname+"="+value);
			this.deleteCookie(cname);
			document.cookie=cname+"="+value;				
	},
	
	deleteCookie: function ( cname ) {
		  document.cookie = cname + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
	},

	request_error_alert:function(xhr){
		if (xhr.status == 404){
	        alert(jQuery.parseJSON(xhr.responseText)['message']);
	      } else {
	    	alert("Internal Error: An error has been logged");
	      }
	},

	// MAP STUFF
	GeeMap:null,
	smallTrainIcon:null,
	bigTrainIcon:null,
	boldTrainIcon:null,
	shapenodeIcon:null,
	basemaps:{},
	overlays:[],

	MapSetup_openlayers:function(king){
	    
		this.GeeMap = new OpenLayers.Map({
	        div: "map", projection: "EPSG:3857",
	        layers: [new OpenLayers.Layer.OSM(), king.get("Map_Stops").layer], 
	        zoom: 15
		});
 
	    this.GeeMap.addControl(new OpenLayers.Control.LayerSwitcher());
	    this.GeeMap.addControl(new OpenLayers.Control.PanZoomBar());
	},

	MapSetup_Leaflet:function (){
		this.GeeMap = L.map('map', { zoomControl:false });
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
		
		this.smallTrainIcon = L.icon({
		    iconUrl: 'img/railway-station-16.jpg',
		    iconSize:     [16, 16], // size of the icon
		    iconAnchor:   [8, 8], // point of the icon which will correspond to marker's location
		    popupAnchor:  [0, -16] // point from which the popup should open relative to the iconAnchor
		});

		this.bigTrainIcon = L.icon({
		    iconUrl: 'img/steamtrain.png',
		    iconSize:     [44, 44], // size of the icon
		    iconAnchor:   [22, 44], // point of the icon which will correspond to marker's location
		    popupAnchor:  [0, -44] // point from which the popup should open relative to the iconAnchor
		});

		this.boldTrainIcon = L.icon({
		    iconUrl: 'img/steamtrain-bold.png',
		    iconSize:     [44, 44], // size of the icon
		    iconAnchor:   [22, 44], // point of the icon which will correspond to marker's location
		    popupAnchor:  [0, -44] // point from which the popup should open relative to the iconAnchor
		});

		this.shapenodeIcon = L.icon({
		    iconUrl: 'img/node.png',
		    iconSize:     [22, 22], // size of the icon
		    iconAnchor:   [11, 11], // point of the icon which will correspond to marker's location
		    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
		});
		var OpenStreetMap_DE = L.tileLayer('http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
		});
		
		this.baseMaps={
			    "OSM": baselayer,
			    "Stoner":Stamen_TonerLabels,
			    "OSM/DE":OpenStreetMap_DE
			};
		baselayer.addTo(this.GeeMap);
	//	var newControl = new L.Control.EasyButtons;
	//    this.GeeMap.addControl(newControl);
		this.GeeMap.on('dblclick',function(e) {
			if (this.DEBUG)console.log("got a double click event");
			var Stops=this.KingEric.get("Stops");
			Stops.dialogs.edit.data["stopLat"]=e.latlng.lat;
			Stops.dialogs.edit.data["stopLon"]=e.latlng.lng;
			Stops.request("open_edit_dialog",false);
		});
	    this.GeeMap.on('zoomend', this.map_view_changed);
	    this.GeeMap.on('dragend', this.map_view_changed);
	},

	map_view_changed:function (){
		if (this.DEBUG)console.log("map view changed");
		this.KingEric.get("Stops").request("Load");
		this.KingEric.get("Shapes").request("Load");
	},

	set_row_content:function (row_content,eric){
		$(row_content).find('label').text(eric.title);
		$(row_content).find('#checkbox').prop('checked', this.draw_flag);
		
		$(row_content).find('#checkbox').change(function(){
			eric.ToggleDraw();
			//  belt and braces, just make sure the checkbox matches what the draw_flag now says
			$(row_content).find('#checkbox').prop('checked', this.draw_flag);		
		});
}

// END OF METHOD DECLARATION BLOCK
};		
}
);





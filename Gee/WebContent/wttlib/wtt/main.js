require.config({
    baseUrl: "js",
    paths: {
        wtt: "../wttlib/wtt",
        jquery: 'jquery-1.10.2',
        underscore: 'underscore-min',
        backbone: 'backbone-min',
        mustache: 'mustache.min',
        populate: 'jquery.populate.pack',
        
    },
    shim: {
        leaflet: {
            exports: 'L'
        },
        mustache: {
            exports: 'Mustache'
        },
        backbone: {
            exports: 'Backbone'
        },
        underscore: {
            exports: '_'
        },
        markercluster: {
            deps: ['leaflet']
        },
        app: { exports:'DEBUG'},
    },
    config:{
    	app:{DEBUG:0}
    }
  });
  
define(['wtt/Exo'],function (Exo) {
    // Load any app-specific modules
    // with a relative require call,
    // like:
	console.log("hello exo");
	Exo.main();
	console.log("goodbye");
});

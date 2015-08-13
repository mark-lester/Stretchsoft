require.config({
    baseUrl: "js",
    paths: {
        wtt: "../wttlib/wtt",
        jquery: 'jquery-1.10.2',
        underscore: 'underscore-min',
        backbone: 'backbone-min',
        mustache: 'mustache.min',
        populate: 'jquery.propulate.pack.js',
        
    },
    shim: {
        jquery: {
            exports: '$'
        },
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
  
define(['jquery','mustache'],function ($,Mustache) {
    // Load any app-specific modules
    // with a relative require call,
    // like:
	var view = {
		    display_name: 'name',
		    resolve:function(){
		    	return function(text,render){
		    		return render(
		    				"{{" + render(text) + "}}",
		    				data);
		    	};
		    },
		    collection: [
			        {"name": 'test script'},
			        {"name": 'another script 2'}
		           ]
		    };

		var html = Mustache.to_html($('#123').html(), view);

		$('#123').html(html);
});

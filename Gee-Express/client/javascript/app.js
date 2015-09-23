requirejs.config({
	paths: {
		jquery:'/jquery/dist/jquery',
		underscore:'/underscore/underscore',
		backbone:'/backbone/backbone',
		backbone_relational:'/backbone-relational/backbone-relational',
		marionette:'/backbone.marionette/lib/backbone.marionette',
		handlebars:'/handlebars/dist/handlebars'
	},
    shim: {
	    jquery: {
	        exports: '$'
	    },
	    underscore: {
	          exports: '_'
	    },
        backbone: {
            deps: ["underscore", "jquery"],
            exports: "Backbone"
          },
        marionette: {
            deps: ["backbone"],
            exports: "Backbone.Marionette"
          },
        backbone_relational: {
            deps: ["backbone"],
            exports: "Backbone.Relational"
          },
        handlebars: {
            deps: ["underscore", "jquery"],
            exports: "Handlebars"
          }
  }
});

require(['jquery','underscore','backbone','handlebars','marionette','backbone_relational'],
		function(jquery,_,Backbone,Handlebars,Marionette,Backbone_Relational){
	
	// use Handlebars
	Marionette.TemplateCache.prototype.compileTemplate = function(rawTemplate, options) {
		  // use Handlebars.js to compile the template
		  return Handlebars.compile(rawTemplate);
		}

	require(['views/views'],function(Views){
		var app=new Marionette.Application();
		app.addRegions({
			instance:'#instance',
			agency:'#agency',
			stop:'#stop',
			calendar:'#calendar',
			calendar_date:'#calendar_date',
			fare_attribute:'#fare_attribute',
			fare_rule:'#fare_rule',
			route:'#route',
			trip:'#trip',
			stop_time:'#stop_time',
			shape:'#shape',
			maparea:'#map'
		});
		app.instance.show(Views.Instance);			
		app.agency.show(Views.Agency);			
		app.stop.show(Views.Stop);			
		app.calendar.show(Views.Calendar);			
		app.calendar_date.show(Views.CalendarDate);			
		app.fare_attribute.show(Views.FareAttribute);			
		app.route.show(Views.Route);			
		app.trip.show(Views.Trip);			
		app.stop_time.show(Views.StopTime);			
		app.shape.show(Views.Shape);
		
		app.start();
	});
});

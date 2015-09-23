/*
requirejs(["underscore","jszip","fs","csv","command-line-args","./models","Loader"],
function(_,            JSZip,  fs,  csv,  commandLineArgs,    models,    Loader){
*/
var _=require("underscore"),
JSZip=require("jszip"),
Q=require("q"),
fs=require("fs"),
csv=require("csv"),
commandLineArgs= require("command-line-args"),
name = require('node-name'),
models =require("./models"); 
Loader =require("./Loader.js"); 


var cli = commandLineArgs([
   { name: "zip_file", alias: "z", type: String, defaultValue:"gtfs.zip", defaultOption: true },
   { name: "instance", alias: "i", type: String, defaultValue : null },
   { name: "sync", alias: "s", type: Boolean , defaultValue : false},
   { name: "force", alias: "f", type: Boolean , defaultValue : false},
   { name: "user", alias: "u", type: String, defaultValue:'robot' },
   { name: "dump", alias: "d", type: Boolean, defaultValue:false },
   { name: "help", alias: "h", type: Boolean, defaultValue:false },
]);

var options = cli.parse();
if (options.help){
	console.log(cli.getUsage());
	process.exit();
}
options.instance = options.instance || name.file(options.zip_file);

var sync=Q.defer();
if (options.sync){
	models.sequelize.sync({ force: options.force }).success(function(err) {
		  sync.resolve();
		});
} else {
	sync.resolve();
}

Q.when(sync.promise).then(function(){
	
if (!options.dump){
	console.log("USERNAME="+options.user);
    var createD=findOrCreate(models.User,{
        username: options.user
    }).then(function (user){
            findOrCreate(models.Instance,{
                name: options.instance,
                UserId:user.id
            }).then(function(instance){
//                var name = process.argv[1] === 'debug' ? process.argv[3] : process.argv[2];
                fs.readFile(options.zip_file, function (err, data) {
                  if(err) {
                    throw err; // or handle err
                  }
                  Loader.Load(data,instance).then(function (){
                	  console.log("load done");
                  });
                });

            }); // findone then
    }); //user create then
} else {
	models.User.findOne({where:{username:options.user}}).then(function(user){
		models.Instance.findOne({where:{name:options.instance,UserId:user.id}}).then(function(instance){
		    Loader.Dump(instance).then(function(){
		    	fs.writeFile(options.zip_file,this.data,function(err){
				    console.log("dump done");	    		
		    	});
	    	});
		});
	});
}

});

function findOrCreate(entity,data){
	var deferred=Q.defer();
	entity.findOne({where:data}).then( function (user){
		if (user){
			deferred.resolve(user);
		} else {
			entity.create(data).then( function (user){
			deferred.resolve(user);				
			});
		}
	});
	return deferred.promise;
}

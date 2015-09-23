/**
 * Loader interface
require(["underscore","jszip","csv",'csv-stringify',"./models"],function(
		 _,            JSZip,  csv,  stringify,      models 
){
 */
var _=require("underscore"),
JSZip=require("jszip"),
Q=require("q"),
csv=require("csv"),
name = require('node-name'),
models =require("./models"); 

// order needed for insert. should/maybe be able to generate this from sequelize def
var entities=[
   {order:1,file_name:'agency',entity_name:'Agency'},
   {order:2,file_name:'calendar',entity_name:'Calendar'},
   {order:3,file_name:'routes',entity_name:'Route'},
   {order:4,file_name:'stops',entity_name:'Stop'},
   {order:5,file_name:'trips',entity_name:'Trip'},
   {order:6,file_name:'stop_times',entity_name:'StopTime'},
   {order:7,file_name:'transfers',entity_name:'Transfers'},
];

var index=[];
for (var e in entities){
	for (var field in entities[e]){
		if (index[field] === undefined){
			index[field]=[];
		}
		index[field][entities[e][field]]=entities[e];
	}
}

//data == raw content of a zip file
module.exports.Load = function (data,instance){
    var zip = new JSZip(data);
    
    var file_array=zip.file(/.*/);
    for (var i in file_array){
      var filename = name.file(file_array[i].name);
      if (index.file_name[filename] != undefined){
          index.file_name[filename].content=zip.file(file_array[i].name).asText();    	  
      }
    }
    // all the content for each file had been unzipped and the contents in .content
    // so call the top
    var all_jobs=Q.defer();
	LoadWrapper(1,instance,all_jobs);
	return all_jobs.promise; // will resolve when all done
}

//data == raw content of a zip file
module.exports.Dump = function (instance){
    var zip = new JSZip();
    var job_complete=Q.defer();
    
    for (var i in entities){
    	var entity_handler=models[entities[i].entity_name];
		var csv_mapping = entity_handler.csv_mapping;
		var job=Q.defer();
    	promises.push(job.promse);
    	entity_handler.findAll({where:{InstanceId:instance.id}},function(records){
    		//make header row
    		var header_row=[];
    		for (var e in csv_mapping){
    			header_row.push(e);
    		}
    		rows.push(header_row);
    		
    		for (var j in records){
    			var row=[];
        		for (e in csv_mapping){
        			row.push(records[j][csv_mapping[e]]);
        		}
        		rows.push(row);
    		}
    		csv.stringify(records, function(err, data){
        		zip.file(entities[i].file_name+".csv", data);
    	      });
    		job.resolve();
    	});
    }
    Q.allDone(promises).then(function(){
    	job_complete.data=zip.generate({type:"blob"});
    	job_complete.resolve();
    });
    return job_complete;
 } 



function LoadWrapper(i,instance,d){
	LoadBody(i,instance).then(function(){
		if (i<entities.length){
			LoadWrapper(i+1,instance,d);
		} else {
			d.resolve();
		}
	});
}

function LoadBody(i,instance){
	var entity_name = index.order[i].entity_name;
	var entity_handler=models[entity_name];
	var csv_mapping = entity_handler.csv_mapping;
	var  pk_mapping = entity_handler.parent_key_mapping(models); // returns a hash
    var job_complete=new Q.defer();
	var KeyStore={};
    
    csv.parse(index.order[i].content,function (err,data){
        var first=true;
        var header=[];
        var record_block=[];
        // load data into record block
        for (var row in data){
            if (first){
                header=data[row];
                first=false;
            } else {
                var record={};
                
                for (var field_index in header){
                    var input=data[row];
                    if (input[field_index]){
                    	if (csv_mapping[header[field_index]]){
                            record[csv_mapping[header[field_index]]]=input[field_index];                    	                    		
                    	} else {
                    		record[header[field_index]]=input[field_index];
                    	}
                    }
                }
                var s="";
                for (var e in record){
                	s+=e+":"+record[e]+",";
                }
                record.InstanceId=instance.id;
                record_block.push(record);
            }
        }  // end load data

        var parent_key_jobs=[];
        // for each parent key that we need to resolve
        for (var parent_key in pk_mapping){
        	var O=pk_mapping[parent_key];
        	var W={};
        	// unique set of values for the "parent_key" field *(parent_key ='name' or 'code', 
        	// we want all the unique values of that field so we can go fetch that set 
			var key_array=_.uniq(record_block.map(function(R){
				return R[parent_key];
			}));
			W[O.foreign_key]={'in':key_array};
			W['InstanceId']=instance.id;

    		var job=new Q.defer();
    		job.O=O;
    		job.parent_key = parent_key;
    		job.KeyStore=KeyStore;
            parent_key_jobs.push(job.promise);
            var callback=callbackFactory(job);
        	O.entity.findAll({where:W}).then(callback);
        	
        } // end parent key processing

        // when all the primary key stuff has done
        Q.allSettled(parent_key_jobs).then( function(){
    		for (i in record_block){
    	        for (var parent_key in pk_mapping){
    	        	var O=pk_mapping[parent_key];
                	record_block[i][O.native_key]=KeyStore[ record_block[i][parent_key] ];

    	        }
    		}
    	  // block insert
    			
    	  entity_handler.bulkCreate(record_block).then(function(){
        	  job_complete.resolve();        		
    	  });
        });
      
    }); // end csv.parse()
    return job_complete.promise;
}// end insert_table()


function callbackFactory(job){
	
return  function(parents){
	var Oo=job.O;
	var KeyStore=job.KeyStore;
	// map the key value (which is one of those unique values above) to the id
	for (i in parents){
		KeyStore[parents[i][Oo.foreign_key]]=parents[i].id;
	}
	job.resolve();
  }
}
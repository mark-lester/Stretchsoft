var express = require('express');
var app = express();
var fs = require("fs");
//wikitimetable.ck0qtom20qbe.eu-west-1.rds.amazonaws.com:3306
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'wikitimetable.ck0qtom20qbe.eu-west-1.rds.amazonaws.com;dbname=wikitimetable',
  user     : 'wikiadmin',
  password : 'cantona1',
  port 	   : '3306'
});

var bodyParser = require('body-parser');
var multer  = require('multer');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
var upload = multer({ dest: '/tmp/' });
//app.use(multer({ dest: '/tmp/'}));

app.get('/index.htm', function (req, res) {
   res.sendFile( __dirname + "/" + "index.htm" );
});

app.post('/file_upload', upload.single('avatar'), function (req, res, next) {
   console.log(req.file.name);
   console.log(req.file.path);
   console.log(req.file.type);

   var file = __dirname + "/" + req.file.name;
   fs.readFile( req.file.path, function (err, data) {
        fs.writeFile(file, data, function (err) {
        var response;
         if( err ){
              console.log( err );
         }else{
               response = {
                   message:'File uploaded successfully',
                   filename:req.file.name
              };
          }
          console.log( response );
          res.end( JSON.stringify( response ) );
       });
   });
});
module.exports = app;

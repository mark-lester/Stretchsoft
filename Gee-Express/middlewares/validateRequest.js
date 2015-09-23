module.exports = function(){
	  var InstanceId=1; // get it from the req.url when we've worked that out

	  models.Instance.findOne({where:{id:InstanceId},include : models.User},function (instance){
		  if (
				  (instance.User.name == req.session.user) ||
				  (req.method == "GET" && instance.read) ||
				  instance.write  // so you could have read off and write on, and you'd still be able to read
				  ){
				  next();
		  } else {
			  res.status(401);
			  res.json({
				  "status": 401,
				  "message": "Invalid credentials"
			  });		  
		  }
	  });
	
};
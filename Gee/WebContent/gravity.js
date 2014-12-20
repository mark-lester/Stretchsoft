var CANVAS_WIDTH=1000;
var CANVAS_HEIGHT=600;
var forces=[
"InverseCube",
"InverseSquare",
"Inverse",
"InverseSquareRoot",
"Constant",
"Log",
"SquareRoot",
"Linear",
"Squared",
"Cubed",
"Sine"];

var playback_config_index=-1;
var playback_configs=[
                  {
                	  sun_flag : true,
                	  sun_size : 500000,
                	  centrifugal_flag : true,
                	  random_position_flag : true,
                	  random_radii_flag : true,
                	  random_colours_flag : true,
                	  numberOfPlanets : 9,
                	  averageEnergy : 10000,
                	  iterations_per_auto_change : 500
                  },
                  {
                	  numberOfPlanets : 200 , 
                	  iterations_per_auto_change : 500                	  
                  },
                  {
                	  random_position_flag : false,
                	  random_radii_flag : false,
                	  random_colours_flag : false,
                	  averageEnergy : 10000,
                	  numberOfPlanets : 494
                  },
                  {
                	  sun_flag : false,
                	  centrifugal_flag : false,
         			  numberOfPlanets : 493,
                	  iterations_per_auto_change : 500
                  },
           ];
           
$( document ).ready(function() {
	$("#myCanvas").attr('width',CANVAS_WIDTH);
	$("#myCanvas").attr('height',CANVAS_HEIGHT);
	var c = document.getElementById("myCanvas");
	var ctx = c.getContext("2d");
	attach_event_handlers();

	var simulator = new GravitySim(ctx);
});

function attach_event_handlers(){
	$("#system_options select").change(function(){
		GS[this.id]=$(this).val();
		GS.restart_flag=true;
	});
	$("#system_options input").change(function(){
		GS.restart_flag=true;
		switch ($(this).attr('type')){
		case 'checkbox':
			GS[this.id]=$(this).prop('checked');
			break;
		default:	
			GS[this.id]=$(this).val();
		}
	});
}

var GS;
var solar_system_scale;
// OBJECT : GravitySim
function GravitySim(context) {
	this.context=context;

	this.width=CANVAS_WIDTH;
	this.height=CANVAS_HEIGHT;
	solar_system_scale=this.width/8;


	this.forceName="InverseSquare";
	this.averageEnergy=10000;
	this.random_position_flag=false;
	this.random_radii_flag=false;
	this.centrifugal_flag=false;
	this.random_colour_flag=false;
	this.sun_flag=false;
	this.sun_size=500000;
	this.numberOfPlanets = 493;
	this.iterations_per_auto_change=500;
	this.iterations=0;
	this.current_force=-1;
	this.auto_flag=true;

	GS=this;

	$("#system_options input").each(function(){
		switch ($(this).attr('type')){
		case 'checkbox':
			$(this).prop('checked',GS[this.id]);
			break;
		default:	
			$(this).val(GS[this.id]);
		}
	});
	$("#system_options select").each(function(){
		$(this).val(GS[this.id]);
	});

	this.SetSolarSystem();
	var count=0;
	animate();
}

var count=0;
var SCALE=1;

function animate(){
//	console.log("animation loop "+count++);
//	alert("animation loop "+count++);

	if (GS.restart_flag){
		GS.SetSolarSystem(GS);
		GS.restart_flag=false;
	} else if (GS.auto_flag && 
				(GS.iterations > GS.iterations_per_auto_change || (GS.current_force==-1))
				){
		GS.current_force++;
		GS.current_force %= forces.length;

		if (GS.current_force == 0){
			playback_config_index++;
			playback_config_index %= playback_configs.length;
			for (var key in playback_configs[playback_config_index]){
				if (playback_configs[playback_config_index].hasOwnProperty(key)) {
					GS[key]=playback_configs[playback_config_index][key];
					switch ($("#"+key).attr('type')){
					case 'checkbox':
						$("#"+key).prop('checked',GS[key]);
						break;
					default:
						$("#"+key).val(GS[key]);					
					}
				}
			}
		}
		GS.forceName=forces[GS.current_force];
		$("#forceName").val(GS.forceName);
		GS.SetSolarSystem(GS);
		GS.iterations=0;
	}
	GS.iterations++;	
	GS.SolarSystem.Animate();
	GS.SolarSystem.Draw();	
	setTimeout(function(){ 
		animate(); 
		}, 
	5);	
}


GravitySim.prototype.SetSolarSystem = function(){

	switch (this.forceName){
	case "InverseCube":
		this.gravity=new GravityInverseCube();
		break;
	case "Normal":
	case "InverseSquare":
		this.gravity=new GravityInverseSquare();
		break;
	case "Inverse":
		this.gravity=new GravityInverse();
		break;
	case "InverseSquareRoot":
		this.gravity=new GravityInverseSquareRoot();
		break;
	case "Constant":
		this.gravity=new GravityConstant();
		break;
	case "Log":
		this.gravity=new GravityLog();
		break;
	case "SquareRoot":
		this.gravity=new GravitySquareRoot();
		break;
	case "Linear":
		this.gravity=new GravityLinear();
		break;
	case "Squared":
		this.gravity=new GravitySquared();
		break;
	case "Cubed":
		this.gravity=new GravityCubed();
		break;
	case "Sine":
		this.gravity=new GravitySine();
		break;
	}
	$("#title").text("Gravity as a function of distance = "+this.forceName);
	this.SolarSystem = new SolarSystem(this);
};
   
   
//OBJECT : SolarSystem
function SolarSystem(gs){
	var i,j;
	var colour;
	var number_row,spacing;
	
	this.gs=gs;
	this.total_mass = 0;
	this.centre_of_mass_x = 0;
	this.centre_of_mass_y = 0;
	this.originalEnergy = 0;
	this.potentialEnergy = 0;
	this.kineticEnergy = 0;
	this.momentumX = 0;
	this.momentumY = 0;
	this.planets=[];

	colour="red";
	this.centreOfMass = new Planet(0,0,5,0,colour);
	if (!gs.random_position_flag){
		number_per_row = Math.round(Math.sqrt(gs.numberOfPlanets * gs.width / gs.height)+0.5);
		spacing = Math.round(gs.width / (2 * number_per_row));
	}

	for(i = 0; i < gs.numberOfPlanets; i++) {
		var x,y,radius,mass;

		if (gs.random_position_flag){
			x = (Math.random()*gs.width % (gs.width/2)) + (gs.width/4);
			y = (Math.random()*gs.width % (gs.height/2)) + (gs.height/4);
		} else {
			x = (gs.width/4) + (i % number_per_row) * spacing;
			y = (gs.height/4) + Math.round((i / number_per_row)+0.5) * spacing;
//			alert("I="+i+" X="+x+" Y="+y+ " N="+number_per_row+" S="+spacing);
		}
		if (gs.random_radii_flag) {
			radius = (Math.random()*gs.width % 15) + 1;
		} else {
			radius = 5;
		}
		colour=getRandomColour();

		// Set the first two up at nice spots and sizes, handy for debugging force behaviour
		if (i == 0 && gs.random_position_flag){
			x = 3 * gs.width / 8 ;
			y = 3 * gs.height / 8;
			radius = 5;
			colour="yellow";
		}
		if (i == 1 && gs.random_position_flag){
			x = 5 * gs.width / 8;
			y = 5 * gs.height / 8;
			radius = 5;
			colour="green";
		}

		mass = radius*radius*radius;

		if (gs.sun_flag && (i == gs.numberOfPlanets -1) ){ // make it the last one so it renders on top
			x=this.centre_of_mass_x;
			y=this.centre_of_mass_y;
			radius = 25;
			mass = gs.sun_size;
			colour = "white";
		}
		this.planets[i] = new Planet(x,y,radius,mass,colour);
		this.total_mass += mass;
		this.centreOfMass.posX = this.centre_of_mass_x+=(mass/this.total_mass)*(x-this.centre_of_mass_x);
		this.centreOfMass.posY = this.centre_of_mass_y+=(mass/this.total_mass)*(y-this.centre_of_mass_y);
		if (gs.sun_flag && (i == gs.numberOfPlanets -1) ){ // make it the last one so it renders on top
			this.planets[i].sun_flag=true;
		}
	}

	// do a dummy run to add up the potential energy at start
	var potential_minimum=0;
	var potential_maximum=0;

	SCALE=1;
	this.potentialEnergy=0;
	for(i = 0; i < gs.numberOfPlanets; i++) {
		for(j = i +1 ; j < gs.numberOfPlanets; j++) {
			var this_potential=Math.abs(this.planets[i].Attract(this.planets[j],gs.gravity));
			this.potentialEnergy += this_potential;
			this.planets[i].potential+=this_potential;
			this.planets[j].potential+=this_potential;
		}
		if (!this.planets[i].sun_flag){
			if (i == 0){potential_minimum = this.planets[i].potential;} 
			potential_minimum= Math.min(potential_minimum, this.planets[i].potential);
			if (i == 0){potential_maximum = this.planets[i].potential;} 
			potential_maximum= Math.max(potential_maximum, this.planets[i].potential);	
		}
		// zap the velocity and acceleration back to zero after the dummy run to get the potential
		this.planets[i].velocityX=0;
		this.planets[i].velocityY=0;
		this.planets[i].deltaVelocityX=0;
		this.planets[i].deltaVelocityY=0;
	}

	// now we know the total energy, we can scale 
	// else when you bump up the number of planets, 
	// the energy in the system goes exponentially up and the animation goes bonkers.
	// square the number of planets as the total energy is tied up in X * X mutual attractions
	SCALE = gs.averageEnergy * gs.numberOfPlanets / this.potentialEnergy;
	SCALE *= gs.gravity.scale_factor();
	
//	alert("SCALE = "+SCALE+" pot engergy = "+this.potentialEnergy);
	this.potentialEnergy=this.averageEnergy * gs.numberOfPlanets;

	if (gs.centrifugal_flag){  // get stuff to orbit the centre of mass, using the sun's mass as an attractor
		var momentum_x = 0;
		var momentum_y = 0;
		var SunMass=this.planets[gs.numberOfPlanets-1].mass;

		for(i = 0; i < gs.numberOfPlanets-1; i++) {
			// distance to centre of mass
			var distCoM = Math.sqrt(
				(this.planets[i].posY - this.centre_of_mass_y) * (this.planets[i].posY - this.centre_of_mass_y) +
				(this.planets[i].posX - this.centre_of_mass_x) * (this.planets[i].posX - this.centre_of_mass_x));
			var v=gs.gravity.Centrifugal(distCoM,this.planets[i].mass,gs.sun_size);

			this.planets[i].velocityX += (this.planets[i].posY - this.centre_of_mass_y) * v / distCoM;
			this.planets[i].velocityY +=-(this.planets[i].posX - this.centre_of_mass_x) * v / distCoM;
			momentum_x += this.planets[i].mass * this.planets[i].velocityX;
			momentum_y += this.planets[i].mass * this.planets[i].velocityY;
			this.kineticEnergy += (this.planets[i].velocityX * this.planets[i].velocityX) + 
					(this.planets[i].velocityY * this.planets[i].velocityY) * 
					this.planets[i].mass/2 ;
		}
		// i = last one, which might be a sun, so shift it to balance the momentum
		this.planets[i].velocityX -= momentum_x / this.planets[i].mass;
		this.planets[i].velocityY -= momentum_y / this.planets[i].mass;
		this.kineticEnergy += (this.planets[i].velocityX * this.planets[i].velocityX) + 
				(this.planets[i].velocityY * this.planets[i].velocityY) * 
				this.planets[i].mass/2 ;
	}
	if (!gs.random_colour_flag){  
		for(i = 0; i < gs.numberOfPlanets; i++) {
			if (!this.planets[i].sun_flag){
//				alert (" planet pot "+this.planets[i].potential+" min="+potential_minimum);
				var hue = (this.planets[i].potential-potential_minimum) / ( potential_maximum - potential_minimum);
				var bright = 0.5 + ( (this.planets[i].potential - potential_minimum) / ( potential_maximum - potential_minimum)) * 0.5;
				this.planets[i].colour= (new HSLColour(250.0*hue,100,99.9*bright)).getCSSHexadecimalRGB();
//				alert("set random colour to "+this.planets[i].colour+ " from hue "+hue+" and bright "+bright);
			}
		}
	}
	
	this.originalEnergy=this.potentialEnergy+this.kineticEnergy;
}

SolarSystem.prototype.Animate = function (){
	var i,j;
	
	this.potentialEnergy = 0;
	this.kineticEnergy = 0;		
	this.momentumX = 0;
	this.momentumY = 0;
	this.centre_of_mass_x=this.planets[0].posX;
	this.centre_of_mass_y=this.planets[0].posY;
	this.total_mass = 0; // used for Centre of Mass

	for(i = 0; i < this.gs.numberOfPlanets; i++) {
//only do this once, so for j > i. attract will work out the new incremental velocity vectors for both objects 
//and return the total potential energy
		for(j = i +1 ; j < this.gs.numberOfPlanets; j++) {
			this.potentialEnergy += this.planets[i].Attract(this.planets[j],this.gs.gravity);
		}

		this.planets[i].Move();
		this.total_mass += this.planets[i].mass;
		this.centreOfMass.posX = this.centre_of_mass_x+=(this.planets[i].mass/this.total_mass)*(this.planets[i].posX-this.centre_of_mass_x);
		this.centreOfMass.posY = this.centre_of_mass_y+=(this.planets[i].mass/this.total_mass)*(this.planets[i].posY-this.centre_of_mass_y);

			// add up kinetic energy
		this.kineticEnergy += (	(this.planets[i].velocityX * this.planets[i].velocityX) + 
					(this.planets[i].velocityY * this.planets[i].velocityY)) * 
					(this.planets[i].mass/2);
		this.momentumX += this.planets[i].mass * this.planets[i].velocityX;
		this.momentumY += this.planets[i].mass * this.planets[i].velocityY;
	}
	
	$("#energy").text("T="+(Math.round(this.potentialEnergy)+Math.round(this.kineticEnergy))+" P="+Math.round(this.potentialEnergy)+" K="+Math.round(this.kineticEnergy));

};

SolarSystem.prototype.Draw = function (){
	var context=this.gs.context;
	context.clearRect(0,0,this.gs.width,this.gs.height);
	context.fillStyle="black";
	context.fillRect(0,0,this.gs.width,this.gs.height);
	context.font="20px Georgia";
	context.fillStyle="white";	
	context.fillText(this.gs.forceName,10,20);


	//ctx.fillRect(20,20,150,100); 

	for(i = 0; i < this.gs.numberOfPlanets; i++) {
		this.planets[i].Draw(context);
	}	
}

// OBJECT : PLANET
function Planet (x, y,radius,mass,colour){
	this.radius = radius;
	this.posX=x;
	this.posY=y;
	this.colour = colour;
	this.mass = mass;
	this.velocityX=0;
	this.velocityY=0;
	this.deltaVelocityX=0;
	this.deltaVelocityY=0;
	this.potential=0;
}

Planet.prototype.Draw = function (context){
	context.beginPath();
	context.fillStyle=this.colour;
	context.arc(this.posX,this.posY,this.radius,0,Math.PI*2,true);
	context.closePath();
	context.fill();
};

// calc the increments in acceleration, return the potential energy
Planet.prototype.Attract = function(to,gravity){
	var distanceX = this.posX - to.posX;
	var distanceY = this.posY - to.posY;

	var distance = Math.sqrt((distanceX * distanceX) + (distanceY * distanceY));
	var attraction = gravity.Force(distance,this.mass,to.mass,this.radius + to.radius);
	var potential = gravity.Potential(distance,this.mass,to.mass,this.radius + to.radius);

		this.deltaVelocityX -= (attraction * distanceX)/(distance * this.mass);
		this.deltaVelocityY -= (attraction * distanceY)/(distance * this.mass);
		to.deltaVelocityX += (attraction * distanceX)/(distance * to.mass);
		to.deltaVelocityY += (attraction * distanceY)/(distance * to.mass);
	return potential;
};

// execute the movement
Planet.prototype.Move = function(){
	this.velocityX += this.deltaVelocityX;
	this.velocityY += this.deltaVelocityY;
	this.posX += this.velocityX;
	this.posY += this.velocityY;
//we've moved, so clear down the accumulated acceleration for next time
	this.deltaVelocityX=0;
	this.deltaVelocityY=0;
};

// get tangential velocity req to orbit a 'mass' from a 'distance
/*
Planet.prototype.Centrifugal = function (distance,mass, gravity){
	return gravity.centrifugal(distance,mass);
};
*/

// CLASS: Force

function Force(){
	this.offset=0;
}

Force.prototype.Force=function(distance,massA,massB,combined_radii){
	return SCALE * this.force(distance/*-this.offset*/, massA, massB,combined_radii);
}


Force.prototype.Potential=function(distance,massA,massB,combined_radii){
	return SCALE * this.potential(distance/*-this.offset*/, massA, massB, combined_radii);
}

Force.prototype.Centrifugal=function(distance,massA,massB){ 		
	return Math.sqrt(
				Math.max(
						0,	
						distance * this.Force(distance,massA,massB,0)/ massA  
						)
					);
}
Force.prototype.scale_factor=function(){
	return 1;
}

//FORCE: inverse cube
GravityInverseCube.prototype = Object.create(Force.prototype);
GravityInverseCube.prototype.constructor = GravityInverseCube;

function GravityInverseCube(){
}
	
GravityInverseCube.prototype.force=function(distance,massA,massB,combined_radii){
	distance=Math.max(combined_radii/2, Math.abs(distance));
	return Math.abs((massA * massB) /  (distance * distance * distance));
}
	
GravityInverseCube.prototype.potential=function(distance,massA,massB,combined_radii){
		distance=Math.max(combined_radii/2, Math.abs(distance));
		return (massA * massB) / (2 * distance * distance);
}


// FORCE: CONSTANT
GravityConstant.prototype = Object.create(Force.prototype);
GravityConstant.prototype.constructor = GravityConstant;

function GravityConstant(){
}
	
GravityConstant.prototype.force=function(distance,massA,massB,combined_radii){
		return massA * massB;
}
	
GravityConstant.prototype.potential=function(distance,massA,massB,combined_radii){
		return massA * massB * distance;
}

//FORCE: inverse square
GravityInverseSquare.prototype = Object.create(Force.prototype);
GravityInverseSquare.prototype.constructor = GravityInverseSquare;

function GravityInverseSquare(){
}
	
GravityInverseSquare.prototype.force=function(distance,massA,massB,combined_radii){
	distance=Math.max(combined_radii, distance);
	return (massA * massB) / (distance * distance);
}
	
GravityInverseSquare.prototype.potential=function(distance,massA,massB,combined_radii){
		distance=Math.max(1, distance);
 		return massA * massB / distance;
}
GravityInverseSquare.prototype.scale_factor=function(){
	return 1;
}


//FORCE: DIRECTLY PROPORTIONAL, 
GravityInverse.prototype = Object.create(Force.prototype);
GravityInverse.prototype.constructor = GravityInverse;

function GravityInverse(){
}
	
GravityInverse.prototype.force=function(distance,massA,massB,combined_radii){
	distance=Math.max(SMALL, Math.abs(distance));
	return massA * massB / distance; 
}
	
GravityInverse.prototype.potential=function(distance,massA,massB,combined_radii){
		distance=Math.max(SMALL, Math.abs(distance));
		return massA * massB * Math.log(distance);
}

GravityInverse.prototype.scale_factor=function(){
	return 1;
}


//FORCE: DIRECTLY PROPORTIONAL, 
GravityLinear.prototype = Object.create(Force.prototype);
GravityLinear.prototype.constructor = GravityLinear;

function GravityLinear(){
}
	
GravityLinear.prototype.force=function(distance,massA,massB,combined_radii){
	return massA * massB * distance;
}
	
GravityLinear.prototype.potential=function(distance,massA,massB,combined_radii){
	return massA * massB * distance * distance /2;
}


//FORCE: inverse sqr root
GravityInverseSquareRoot.prototype = Object.create(Force.prototype);
GravityInverseSquareRoot.prototype.constructor = GravityInverseSquareRoot;
var SMALL=0.01;
function GravityInverseSquareRoot(){
}
	
GravityInverseSquareRoot.prototype.force=function(distance,massA,massB,combined_radii){
	distance=Math.max(SMALL, distance);
	return massA * massB / Math.sqrt(distance);
}
	
GravityInverseSquareRoot.prototype.potential=function(distance,massA,massB,combined_radii){
	distance=Math.max(SMALL, distance);
	return 2 * massA * massB * Math.sqrt(distance);
}

//FORCE: Log
GravityLog.prototype = Object.create(Force.prototype);
GravityLog.prototype.constructor = GravityLog;
function GravityLog(){
}
	
GravityLog.prototype.force=function(distance,massA,massB,combined_radii){
		distance=Math.max(3, distance);
		return massA * massB * Math.log(distance);
}
	
GravityLog.prototype.potential=function(distance,massA,massB,combined_radii){
		distance=Math.max(3, distance);
		return massA * massB * 
					(distance*Math.log(distance) - distance);
}

//FORCE: Squared
GravitySquared.prototype = Object.create(Force.prototype);
GravitySquared.prototype.constructor = GravitySquared;
function GravitySquared(){
}
	
GravitySquared.prototype.force=function(distance,massA,massB,combined_radii){
	return massA * massB * distance * distance ;
}
	
GravitySquared.prototype.potential=function(distance,massA,massB,combined_radii){
	return massA * massB * distance * distance * distance/3;
}

//FORCE: SquareRoot
GravitySquareRoot.prototype = Object.create(Force.prototype);
GravitySquareRoot.prototype.constructor = GravitySquareRoot;
function GravitySquareRoot(){
}
	
GravitySquareRoot.prototype.force=function(distance,massA,massB,combined_radii){
		distance=Math.max(1, distance);
		return massA * massB * Math.sqrt(distance);
}
	
GravitySquareRoot.prototype.potential=function(distance,massA,massB,combined_radii){
	distance=Math.max(1, distance);
	return massA * massB * distance * Math.sqrt(distance) * 2 /3 ;
}

//FORCE: Cubed
GravityCubed.prototype = Object.create(Force.prototype);
GravityCubed.prototype.constructor = GravityCubed;

function GravityCubed(){
}
	
GravityCubed.prototype.force=function(distance,massA,massB,combined_radii){
	return massA * massB * distance * distance * distance;
}
	
GravityCubed.prototype.potential=function(distance,massA,massB,combined_radii){
	return massA * massB * distance * distance *distance *distance /4;
}


//FORCE: Sine
GravitySine.prototype = Object.create(Force.prototype);
GravitySine.prototype.constructor = GravitySine;

function GravitySine(){
}
	
GravitySine.prototype.force=function(distance,massA,massB,combined_radii){
		distance=Math.max(3, distance);
		return massA * massB * Math.sin(distance * Math.PI/solar_system_scale);
}
	
GravitySine.prototype.potential=function(distance,massA,massB,combined_radii){
	distance=Math.max(3, distance);
	return 0 -  massA * massB * Math.cos(distance*Math.PI/solar_system_scale);
}

GravitySine.prototype.scale_factor=function(){
	return 0.01;
}

//FORCE: SineDivX
GravitySineDivX.prototype = Object.create(Force.prototype);
GravitySineDivX.prototype.constructor = GravitySineDivX;

function GravitySineDivX(){
}
	
GravitySineDivX.prototype.force=function(distance,massA,massB,combined_radii){
		distance=Math.max(3, distance);
		return massA * massB * Math.sin(distance * Math.PI/solar_system_scale)/distance;
}
	
GravitySineDivX.prototype.potential=function(distance,massA,massB,combined_radii){
	distance=Math.max(1, distance);
	return 0 -  massA * massB * (
			Math.cos(distance*Math.PI/solar_system_scale)/distance -
			Math.sin(distance*Math.PI/solar_system_scale)/(distance*distance) 
			);
}

GravitySineDivX.prototype.scale_factor=function(){
	return 0.01;
}


// UTILS
function getRandomColour() {
    var letters = '0123456789ABCDEF'.split('');
    var colour = '#';
    for (var i = 0; i < 6; i++ ) {
        colour += letters[Math.floor(Math.random() * 16)];
    }
    return colour;
}

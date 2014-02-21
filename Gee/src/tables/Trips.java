package tables;
import javax.persistence.*;
import java.util.*;
import java.text.SimpleDateFormat;
import java.text.ParseException;

@Entity
@Table(name = "trips")

public class Trips extends GtfsBase {

String tripId;
String routeId;
String serviceId;
String tripHeadsign;
String tripShortName;
int directionId;
String blockId;
String shapeId;
int wheelchairAccessible;
public Trips(){}

public Trips(
		String tripId,
		String routeId,
		String serviceId,
		String tripHeadsign,
		String tripShortName,
		int directionId,
		String blockId,
		String shapeId,
		int wheelchairAccessible
		){
		this.tripId=tripId;
		this.routeId=routeId;
		this.serviceId=serviceId;
		this.tripHeadsign=tripHeadsign;
		this.tripShortName=tripShortName;
		this.directionId=directionId;
		this.blockId=blockId;
		this.shapeId=shapeId;
		this.wheelchairAccessible=wheelchairAccessible;
	}

public Trips(Hashtable <String,String> record){
	this.update(record);
}

public void update(Hashtable <String,String> record){
		this.tripId=record.get("tripId");
		this.routeId=record.get("routeId");
		this.serviceId=record.get("serviceId");
		this.tripHeadsign=record.get("tripHeadsign");
		this.tripShortName=record.get("tripShortName");
		try {
			this.directionId=Integer.parseInt(record.get("directionId"));
		} catch (NumberFormatException ex){
//			System.err.println(ex);		
			this.directionId=0;
		}
		this.blockId=record.get("blockId");
		this.shapeId=record.get("shapeId");
		try {
			this.wheelchairAccessible=Integer.parseInt(record.get("wheelchairAccessible"));
		} catch (NumberFormatException ex){
//			System.err.println(ex);		
			this.wheelchairAccessible=0;
		}
	}

public Hashtable <String,String> hash(){
	Hashtable <String,String> record=new Hashtable<String,String> ();
	record.put("tripId",this.tripId);
	record.put("routeId",this.routeId);
	record.put("serviceId",this.serviceId);
	record.put("tripHeadsign",this.tripHeadsign);
	record.put("tripShortName",this.tripShortName);
	record.put("directionId",Integer.toString(this.directionId));
	record.put("blockId",this.blockId);
	record.put("shapeId",this.shapeId);
	record.put("wheelchairAccessible",Integer.toString(this.wheelchairAccessible));
	return record;
}


public void settripId(String tripId){
		this.tripId = tripId;
	}

public String gettripId(){
		return this.tripId;
	}
public void setrouteId(String routeId){
		this.routeId = routeId;
	}

public String getrouteId(){
		return this.routeId;
	}
public void setserviceId(String serviceId){
		this.serviceId = serviceId;
	}

public String getserviceId(){
		return this.serviceId;
	}
public void settripHeadsign(String tripHeadsign){
		this.tripHeadsign = tripHeadsign;
	}

public String gettripHeadsign(){
		return this.tripHeadsign;
	}
public void settripShortName(String tripShortName){
		this.tripShortName = tripShortName;
	}

public String gettripShortName(){
		return this.tripShortName;
	}
public void setdirectionId(int directionId){
		this.directionId = directionId;
	}

public int getdirectionId(){
		return this.directionId;
	}
public void setblockId(String blockId){
		this.blockId = blockId;
	}

public String getblockId(){
		return this.blockId;
	}
public void setshapeId(String shapeId){
		this.shapeId = shapeId;
	}

public String getshapeId(){
		return this.shapeId;
	}
public void setwheelchairAccessible(int wheelchairAccessible){
		this.wheelchairAccessible = wheelchairAccessible;
	}

public int getwheelchairAccessible(){
		return this.wheelchairAccessible;
	}
}

package tables;
import javax.persistence.*;
import java.util.Date;
import java.util.Calendar;
import java.util.Hashtable;
import java.util.Locale;


import java.text.SimpleDateFormat;
import java.text.ParseException;

@Entity
@Table(name = "stop_times")

public class StopTimes extends GtfsBase{

String tripId;
String arrivalTime;
String departureTime;
String stopId;
int stopSequence;
String stopHeadsign;
int pickUpType;
int dropOffType;
double shapeDistTraveled;
public StopTimes(){}

public StopTimes(
		String tripId,
		String arrivalTime,
		String departureTime,
		String stopId,
		int stopSequence,
		String stopHeadsign,
		int pickUpType,
		int dropOffType,
		double shapeDistTraveled
		){
		this.tripId=tripId;
		this.arrivalTime=arrivalTime;
		this.departureTime=departureTime;
		this.stopId=stopId;
		this.stopSequence=stopSequence;
		this.stopHeadsign=stopHeadsign;
		this.pickUpType=pickUpType;
		this.dropOffType=dropOffType;
		this.shapeDistTraveled=shapeDistTraveled;
	}

public StopTimes(Hashtable <String,String> record) throws ParseException{
	this.update(record);
}

public void update(Hashtable <String,String> record) throws ParseException{
	
	if (record.get("arrivalTime") == null ||
			record.get("arrivalTime").isEmpty() 
			){
		if (record.get("departureTime") != null &&
				!record.get("departureTime").isEmpty()){
			record.put("arrivalTime", record.get("departureTime"));
		} else {
			record.put("arrivalTime", "");			
		}
	}
	
	if (record.get("departureTime") == null ||
			record.get("departureTime").isEmpty() 
			){
		record.put("departureTime", record.get("arrivalTime"));
	}
			
		this.tripId=record.get("tripId");
		this.arrivalTime=record.get("arrivalTime");
		this.departureTime=record.get("departureTime");
		this.stopId=record.get("stopId");
		try {
			this.stopSequence=Integer.parseInt(record.get("stopSequence"));
		} catch (NumberFormatException ex){
//			System.err.println(ex);		
			this.stopSequence=0;
		}

		this.stopHeadsign=record.get("stopHeadsign");

		try {
			this.pickUpType=Integer.parseInt(record.get("pickUpType"));
		} catch (NumberFormatException ex){
//			System.err.println(ex);		
			this.pickUpType=0;
		}

		try {
			this.dropOffType=Integer.parseInt(record.get("dropOffType"));
		} catch (NumberFormatException ex){
//			System.err.println(ex);		
			this.dropOffType=0;
		}
		
		// paseDouble freaks out on an empty string
		if (!record.containsKey("shapeDistTraveled") || record.get("shapeDistTraveled").isEmpty()){
			record.put("shapeDistTraveled","0");
		}
		try {
			this.shapeDistTraveled=Double.parseDouble(record.get("shapeDistTraveled"));
		} catch (NumberFormatException ex){
//			System.err.println(ex);		
			this.shapeDistTraveled=0;
		}
	}

public Hashtable <String,String> hash(){
	Hashtable <String,String> record=new Hashtable<String,String> ();
	record.put("tripId",this.tripId);   
	record.put("arrivalTime",this.arrivalTime);	
	record.put("departureTime",this.departureTime);
	record.put("stopId",this.stopId);
	record.put("stopSequence",Integer.toString(this.stopSequence));
	if (this.stopHeadsign == null)this.stopHeadsign = "";
	record.put("stopHeadsign",this.stopHeadsign);
	record.put("pickUpType",Integer.toString(this.pickUpType));
	record.put("dropOffType",Integer.toString(this.dropOffType));
	record.put("shapeDistTraveled",Double.toString(this.shapeDistTraveled));
	return record;
}

private String df_format(Date d){
    SimpleDateFormat df = new SimpleDateFormat(":mm:ss");  
    Calendar cal = Calendar.getInstance();    
    cal.setTime(d);
    return String.format("%02d",cal.DAY_OF_YEAR * 24 + cal.HOUR_OF_DAY) +df.format(d);
}


public void settripId(String tripId){
		this.tripId = tripId;
	}

public String gettripId(){
		return this.tripId;
	}
public void setarrivalTime(String arrivalTime){
		this.arrivalTime = arrivalTime;
	}

public String getarrivalTime(){
		return this.arrivalTime;
	}
public void setdepartureTime(String departureTime){
		this.departureTime = departureTime;
	}

public String getdepartureTime(){
		return this.departureTime;
	}
public void setstopId(String stopId){
		this.stopId = stopId;
	}

public String getstopId(){
		return this.stopId;
	}
public void setstopSequence(int stopSequence){
		this.stopSequence = stopSequence;
	}

public int getstopSequence(){
		return this.stopSequence;
	}
public void setstopHeadsign(String stopHeadsign){
		this.stopHeadsign = stopHeadsign;
	}

public String getstopHeadsign(){
		return this.stopHeadsign;
	}
public void setpickUpType(int pickUpType){
		this.pickUpType = pickUpType;
	}

public int getpickUpType(){
		return this.pickUpType;
	}
public void setdropOffType(int dropOffType){
		this.dropOffType = dropOffType;
	}

public int getdropOffType(){
		return this.dropOffType;
	}
public void setshapeDistTraveled(double shapeDistTraveled){
		this.shapeDistTraveled = shapeDistTraveled;
	}

public double getshapeDistTraveled(){
		return this.shapeDistTraveled;
	}
}

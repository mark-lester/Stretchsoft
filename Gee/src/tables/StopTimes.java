package tables;
import javax.persistence.*;
import java.util.*;
import java.text.SimpleDateFormat;
import java.text.ParseException;

@Entity
@Table(name = "stop_times")

public class StopTimes extends GtfsBase {

String tripId;
Date arrivalTime;
Date departureTime;
String stopId;
int stopSequence;
String stopHeadsign;
int pickUpType;
int dropOffType;
double shapeDistTraveled;
public StopTimes(){}

public StopTimes(
		String tripId,
		Date arrivalTime,
		Date departureTime,
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

public StopTimes(Hashtable <String,String> record){
	this.update(record);
}

public void update(Hashtable <String,String> record){
		this.tripId=record.get("tripId");
		try {
			this.arrivalTime=new SimpleDateFormat("HH:mm:ss",Locale.getDefault()).parse(record.get("arrivalTime"));
		} catch (ParseException ex){
					System.err.println(ex);		
		}
		try {
			this.departureTime=new SimpleDateFormat("HH:mm:ss",Locale.getDefault()).parse(record.get("departureTime"));
		} catch (ParseException ex){
					System.err.println(ex);		
		}
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

		try {
			this.shapeDistTraveled=Double.parseDouble(record.get("shapeDistTraveled"));
		} catch (NumberFormatException ex){
//			System.err.println(ex);		
			this.shapeDistTraveled=0;
		}
	}

public void settripId(String tripId){
		this.tripId = tripId;
	}

public String gettripId(){
		return this.tripId;
	}
public void setarrivalTime(Date arrivalTime){
		this.arrivalTime = arrivalTime;
	}

public Date getarrivalTime(){
		return this.arrivalTime;
	}
public void setdepartureTime(Date departureTime){
		this.departureTime = departureTime;
	}

public Date getdepartureTime(){
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

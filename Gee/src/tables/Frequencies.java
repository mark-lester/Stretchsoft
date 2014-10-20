package tables;
import javax.persistence.*;
import java.util.*;
import java.text.SimpleDateFormat;
import java.text.ParseException;

@Entity
@Table(name = "frequencies")

public class Frequencies extends GtfsBase {

String tripId="";
String startTime;
String endTime;
int headwaySecs=0;
public Frequencies(){}

public Frequencies(
		String tripId,
		String startTime,
		String endTime,
		int headwaySecs
		){
		this.tripId=tripId;
		this.startTime=startTime;
		this.endTime=endTime;
		this.headwaySecs=headwaySecs;
	}

public Frequencies(Hashtable <String,String> record){
	this.update(record);
}

public void update(Hashtable <String,String> record){
	this.tripId=record.get("tripId");
	this.startTime=record.get("startTime");
	this.endTime=record.get("endTime");
	this.headwaySecs=Integer.parseInt(record.get("headwaySecs"));
	}

public Hashtable <String,String> hash(){
	Hashtable <String,String> record=new Hashtable<String,String> ();
	record.put("tripId",this.tripId);
	record.put("startTime",this.startTime);
	record.put("endTime",this.endTime);
	record.put("headwaySecs",Integer.toString(this.headwaySecs));

	return record;
}


public void settripId(String tripId){
		this.tripId = tripId;
	}

public String gettripId(){
		return this.tripId;
	}
public void setstartTime(String startTime){
		this.startTime = startTime;
	}

public String getstartTime(){
		return this.startTime;
	}
public void setendTime(String endTime){
		this.endTime = endTime;
	}

public String getendTime(){
		return this.endTime;
	}
public void setheadwaySecs(int headwaySecs){
		this.headwaySecs = headwaySecs;
	}

public int getheadwaySecs(){
		return this.headwaySecs;
	}
}

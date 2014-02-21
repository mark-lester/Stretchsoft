package tables;
import javax.persistence.*;
import java.util.*;
import java.text.SimpleDateFormat;
import java.text.ParseException;

@Entity
@Table(name = "frequencies")

public class Frequencies extends GtfsBase {

String tripId;
Date startTime;
Date endTime;
int headwaySecs;
public Frequencies(){}

public Frequencies(
		String tripId,
		Date startTime,
		Date endTime,
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
		try {
			this.startTime=new SimpleDateFormat("HH:mm:ss",Locale.getDefault()).parse(record.get("startTime"));
		} catch (ParseException ex){
					System.err.println(ex);		
		}
		try {
			this.endTime=new SimpleDateFormat("HH:mm:ss",Locale.getDefault()).parse(record.get("endTime"));
		} catch (ParseException ex){
					System.err.println(ex);		
		}
		this.headwaySecs=Integer.parseInt(record.get("headwaySecs"));
	}

public Hashtable <String,String> hash(){
	Hashtable <String,String> record=new Hashtable<String,String> ();
	record.put("tripId",this.tripId);
    SimpleDateFormat df = new SimpleDateFormat("HH:mm:ss");  
    
	record.put("startTime",df.format(this.startTime));
	record.put("endTime",df.format(this.endTime));
	
	record.put("headwaySecs",Integer.toString(this.headwaySecs));

	return record;
}


public void settripId(String tripId){
		this.tripId = tripId;
	}

public String gettripId(){
		return this.tripId;
	}
public void setstartTime(Date startTime){
		this.startTime = startTime;
	}

public Date getstartTime(){
		return this.startTime;
	}
public void setendTime(Date endTime){
		this.endTime = endTime;
	}

public Date getendTime(){
		return this.endTime;
	}
public void setheadwaySecs(int headwaySecs){
		this.headwaySecs = headwaySecs;
	}

public int getheadwaySecs(){
		return this.headwaySecs;
	}
}

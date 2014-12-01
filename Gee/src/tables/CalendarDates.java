package tables;
import javax.persistence.*;
import java.util.*;
import java.text.SimpleDateFormat;
import java.text.ParseException;

@Entity
@Table(name = "calendar_dates")

public class CalendarDates extends GtfsBase {

String serviceId="";
String date;
int exceptionType;
public CalendarDates(){}

public CalendarDates(
		String serviceId,
		String date,
		int exceptionType
		){
		this.serviceId=serviceId;
		this.date=date;
		this.exceptionType=exceptionType;
	}

public CalendarDates(Hashtable <String,String> record){
	this.update(record);
}

public void update(Hashtable <String,String> record){
boolean parse_failed=false;
	this.serviceId=record.get("serviceId");
	this.date=record.get("date");
	
	try {
		this.exceptionType=Integer.parseInt(record.get("exceptionType"));
	} catch (NumberFormatException ex){
		System.err.println(ex);		
		this.exceptionType=0;
	}
}

public Hashtable <String,String> hash(){
	Hashtable <String,String> record=new Hashtable<String,String> ();

	this.serviceId=record.put("serviceId",this.serviceId);
    SimpleDateFormat df = new SimpleDateFormat("yyyyMMdd");  
    if (this.date != null)
    	record.put("date",this.date);
	record.put("exceptionType",Integer.toString(this.exceptionType));
	return record;
}

public void setserviceId(String serviceId){
		this.serviceId = serviceId;
	}

public String getserviceId(){
		return this.serviceId;
	}
public void setdate(String date){
		this.date = date;
	}

public String getdate(){
		return this.date;
	}
public void setexceptionType(int exceptionType){
		this.exceptionType = exceptionType;
	}

public int getexceptionType(){
		return this.exceptionType;
	}
}

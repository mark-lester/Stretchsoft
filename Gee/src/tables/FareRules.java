
package tables;
import javax.persistence.*;
import java.util.*;
import java.text.SimpleDateFormat;
import java.text.ParseException;

@Entity
@Table(name = "fare_rules")

public class FareRules extends GtfsBase {
	String fareId="";
	String routeId="";
	String originId="";
	String destinationId="";
	String containsId="";
public FareRules(){}

public FareRules(
		String fareId,
		String routeId,
		String originId,
		String destinationId,
		String containsId){
	this.fareId=fareId;
	this.routeId=routeId;
	this.originId=originId;
	this.destinationId=destinationId;
	this.containsId=containsId;
	}

public FareRules(Hashtable <String,String> record){
	this.update(record);
}

public void update(Hashtable <String,String> record){
	this.fareId=record.get("fareId");
	this.routeId=record.get("routeId");
	this.originId=record.get("originId");
	this.destinationId=record.get("destinationId");
	this.containsId=record.get("containsId");
	}

public Hashtable <String,String> hash(){
	Hashtable <String,String> record=new Hashtable<String,String> ();
	record.put("fareId",this.fareId);
	record.put("routeId",this.routeId);
	record.put("originId",this.originId);
	record.put("destinationId",this.destinationId);
	record.put("containsId",this.containsId);
	return record;
}


public void setfareId(String fareId){
	this.fareId = fareId;
}

public String getfareId(){
	return this.fareId;
}

public void setrouteId(String routeId){
	this.routeId = routeId;
}

public String getrouteId(){
	return this.routeId;
}

public void setoriginId(String originId){
	this.originId = originId;
}

public String getoriginId(){
	return this.originId;
}

public void setdestinationId(String destinationId){
	this.destinationId = destinationId;
}

public String getdestinationId(){
	return this.destinationId;
}

public void setcontainsId(String containsId){
	this.containsId = containsId;
}

public String getcontainsId(){
	return this.containsId;
}

}
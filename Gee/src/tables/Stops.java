package tables;
import javax.persistence.*;
import java.util.*;
import java.text.SimpleDateFormat;
import java.text.ParseException;

@Entity
@Table(name = "stops")

public class Stops extends GtfsBase {

String stopId;
String stopCode;
String stopName;
String stopDesc;
float stopLat;
float stopLon;
String zoneId;
String stopUrl;
int locationType;
String parentStation;
public Stops(){}

public Stops(
		String stopId,
		String stopCode,
		String stopName,
		String stopDesc,
		float stopLat,
		float stopLon,
		String zoneId,
		String stopUrl,
		int locationType,
		String parentStation
		){
		this.stopId=stopId;
		this.stopCode=stopCode;
		this.stopName=stopName;
		this.stopDesc=stopDesc;
		this.stopLat=stopLat;
		this.stopLon=stopLon;
		this.zoneId=zoneId;
		this.stopUrl=stopUrl;
		this.locationType=locationType;
		this.parentStation=parentStation;
	}

public Stops(Hashtable <String,String> record){
	this.update(record);
}

public void update(Hashtable <String,String> record){
		this.stopId=record.get("stopId");
		this.stopCode=record.get("stopCode");
		this.stopName=record.get("stopName");
		this.stopDesc=record.get("stopDesc");
		this.zoneId=record.get("zoneId");
		this.stopUrl=record.get("stopUrl");
		
		try {
			this.locationType=Integer.parseInt(record.get("locationType"));
		} catch (NumberFormatException ex){
//			System.err.println(ex);		
			this.locationType=0;
		}
		try {
			this.stopLat=Float.parseFloat(record.get("stopLat"));
		} catch (NumberFormatException ex){
//			System.err.println(ex);		
			this.stopLat=0;
		}
		
		try {
			this.stopLon=Float.parseFloat(record.get("stopLon"));
		} catch (NumberFormatException ex){
//			System.err.println(ex);		
			this.stopLon=0;
		}
		
		this.parentStation=record.get("parentStation");
	}

public Hashtable <String,String> hash(){
	Hashtable <String,String> record=new Hashtable<String,String> ();
	record.put("stopId",this.stopId);
	record.put("stopCode",this.stopCode);
	record.put("stopName",this.stopName);
	record.put("stopDesc",this.stopDesc);
	record.put("zoneId",this.zoneId);
	record.put("stopUrl",this.stopUrl);
	record.put("locationType",Integer.toString(this.locationType));
	record.put("stopLat",Float.toString(this.stopLat));
	record.put("stopLon",Float.toString(this.stopLon));
	return record;
}

public void setstopId(String stopId){
		this.stopId = stopId;
	}

public String getstopId(){
		return this.stopId;
	}
public void setstopCode(String stopCode){
		this.stopCode = stopCode;
	}

public String getstopCode(){
		return this.stopCode;
	}
public void setstopName(String stopName){
		this.stopName = stopName;
	}

public String getstopName(){
		return this.stopName;
	}
public void setstopDesc(String stopDesc){
		this.stopDesc = stopDesc;
	}

public String getstopDesc(){
		return this.stopDesc;
	}
public void setstopLat(float stopLat){
		this.stopLat = stopLat;
	}

public float getstopLat(){
		return this.stopLat;
	}
public void setstopLon(float stopLon){
		this.stopLon = stopLon;
	}

public float getstopLon(){
		return this.stopLon;
	}
public void setzoneId(String zoneId){
		this.zoneId = zoneId;
	}

public String getzoneId(){
		return this.zoneId;
	}
public void setstopUrl(String stopUrl){
		this.stopUrl = stopUrl;
	}

public String getstopUrl(){
		return this.stopUrl;
	}
public void setlocationType(int locationType){
		this.locationType = locationType;
	}

public int getlocationType(){
		return this.locationType;
	}
public void setparentStation(String parentStation){
		this.parentStation = parentStation;
	}

public String getparentStation(){
		return this.parentStation;
	}
}

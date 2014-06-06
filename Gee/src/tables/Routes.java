package tables;
import javax.persistence.*;
import java.util.*;
import java.text.SimpleDateFormat;
import java.text.ParseException;

@Entity
@Table(name = "routes")

public class Routes extends GtfsBase {

String routeId="";
String agencyId="";
String routeShortName="";
String routeLongName="";
String routeDesc="";
int routeType=0;
String routeUrl="";
String routeColor="";
String routeTextColor="";
public Routes(){}

public Routes(
		String routeId,
		String agencyId,
		String routeShortName,
		String routeLongName,
		String routeDesc,
		int routeType,
		String routeUrl,
		String routeColor,
		String routeTextColor
		){
		this.routeId=routeId;
		this.agencyId=agencyId;
		this.routeShortName=routeShortName;
		this.routeLongName=routeLongName;
		this.routeDesc=routeDesc;
		this.routeType=routeType;
		this.routeUrl=routeUrl;
		this.routeColor=routeColor;
		this.routeTextColor=routeTextColor;
	}

public Routes(Hashtable <String,String> record){
	this.update(record);
}

public void update(Hashtable <String,String> record){
		this.routeId=record.get("routeId");
		this.agencyId=record.get("agencyId");
		this.routeShortName=record.get("routeShortName");
		this.routeLongName=record.get("routeLongName");
		this.routeDesc=record.get("routeDesc");
		this.routeType=Integer.parseInt(record.get("routeType"));
		this.routeUrl=record.get("routeUrl");
		this.routeColor=record.get("routeColor");
		this.routeTextColor=record.get("routeTextColor");
	}

public Hashtable <String,String> hash(){
	Hashtable <String,String> record=new Hashtable<String,String> ();
	if (this.routeId != null)
		record.put("routeId",this.routeId);
	if (this.agencyId != null)
		record.put("agencyId",this.agencyId);
	if (this.routeShortName != null)
		record.put("routeShortName",this.routeShortName);
	if (this.routeLongName != null)
		record.put("routeLongName",this.routeLongName);
	if (this.routeDesc != null)
		record.put("routeDesc",this.routeDesc);
	record.put("routeType",Integer.toString(this.routeType));
	if (this.routeUrl != null)
		record.put("routeUrl",this.routeUrl);
	if (this.routeColor != null)
		record.put("routeColor",this.routeColor);
	if (this.routeTextColor != null)
		record.put("routeTextColor",this.routeTextColor);
	return record;
}


public void setrouteId(String routeId){
		this.routeId = routeId;
	}

public String getrouteId(){
		return this.routeId;
	}
public void setagencyId(String agencyId){
		this.agencyId = agencyId;
	}

public String getagencyId(){
		return this.agencyId;
	}
public void setrouteShortName(String routeShortName){
		this.routeShortName = routeShortName;
	}

public String getrouteShortName(){
		return this.routeShortName;
	}
public void setrouteLongName(String routeLongName){
		this.routeLongName = routeLongName;
	}

public String getrouteLongName(){
		return this.routeLongName;
	}
public void setrouteDesc(String routeDesc){
		this.routeDesc = routeDesc;
	}

public String getrouteDesc(){
		return this.routeDesc;
	}
public void setrouteType(int routeType){
		this.routeType = routeType;
	}

public int getrouteType(){
		return this.routeType;
	}
public void setrouteUrl(String routeUrl){
		this.routeUrl = routeUrl;
	}

public String getrouteUrl(){
		return this.routeUrl;
	}
public void setrouteColor(String routeColor){
		this.routeColor = routeColor;
	}

public String getrouteColor(){
		return this.routeColor;
	}
public void setrouteTextColor(String routeTextColor){
		this.routeTextColor = routeTextColor;
	}

public String getrouteTextColor(){
		return this.routeTextColor;
	}
}

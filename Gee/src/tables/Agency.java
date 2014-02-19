package tables;
import javax.persistence.*;
import java.util.*;

@Entity
@Table(name = "agency")

public class Agency extends GtfsBase {

String agencyId;
String agencyName;
String agencyUrl;
String agencyTimezone;
String agencyLang;
String agencyPhone;
public Agency(){}

public Agency(
		String agencyId,
		String agencyName,
		String agencyUrl,
		String agencyTimezone,
		String agencyLang,
		String agencyPhone
		){
		this.agencyId=agencyId;
		this.agencyName=agencyName;
		this.agencyUrl=agencyUrl;
		this.agencyTimezone=agencyTimezone;
		this.agencyLang=agencyLang;
		this.agencyPhone=agencyPhone;
	}

public Agency(Hashtable <String,String> record){
	this.update(record);
}

public void update(Hashtable <String,String> record){
	this.agencyId=record.get("agencyId");
	this.agencyName=record.get("agencyName");
	System.err.println("updated agencyname to "+this.agencyName);

	this.agencyUrl=record.get("agencyUrl");
	this.agencyTimezone=record.get("agencyTimezone");
	this.agencyLang=record.get("agencyLang");
	this.agencyPhone=record.get("agencyPhone");
}

public void setagencyId(String agencyId){
		this.agencyId = agencyId;
	}

public String getagencyId(){
		return this.agencyId;
	}
public void setagencyName(String agencyName){
		this.agencyName = agencyName;
	}

public String getagencyName(){
		return this.agencyName;
	}
public void setagencyUrl(String agencyUrl){
		this.agencyUrl = agencyUrl;
	}

public String getagencyUrl(){
		return this.agencyUrl;
	}
public void setagencyTimezone(String agencyTimezone){
		this.agencyTimezone = agencyTimezone;
	}

public String getagencyTimezone(){
		return this.agencyTimezone;
	}
public void setagencyLang(String agencyLang){
		this.agencyLang = agencyLang;
	}

public String getagencyLang(){
		return this.agencyLang;
	}
public void setagencyPhone(String agencyPhone){
		this.agencyPhone = agencyPhone;
	}

public String getagencyPhone(){
		return this.agencyPhone;
	}
}

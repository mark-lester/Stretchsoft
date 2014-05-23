package admin;
import javax.persistence.*;
import java.util.*;

@Entity
@Table(name = "instance")

public class Instance extends AdminBase {

String databaseName;
String ownerUserId;
String publicRead;
String publicWrite;
String agencyLang;
String agencyPhone;
public Instance(){}

public Instance (
		String databaseName,
		String ownerUserId,
		String publicRead,
		String publicWrite
		){
		this.databaseName=databaseName;
		this.ownerUserId=ownerUserId;
		this.publicRead=publicRead;
		this.publicWrite=publicWrite;
	}

public Instance(Hashtable <String,String> record){
	this.update(record);
}

public void update(Hashtable <String,String> record){
	this.databaseName=record.get("databaseName");
	this.ownerUserId=record.get("ownerUserId");
	this.publicRead=record.get("publicRead");
	this.publicWrite=record.get("publicWrite");
}

public Hashtable <String,String> hash(){
	Hashtable <String,String> record=new Hashtable<String,String> ();
	record.put("databaseName",this.databaseName);
	record.put("ownerUserId",this.ownerUserId);
	record.put("publicRead",this.publicRead);
	record.put("publicWrite",this.publicWrite);
	return record;
}
public void setdatabaseName(String databaseName){
	this.databaseName = databaseName;
}

public String getdatabaseName(){
	return this.databaseName;
}

public void setownerUserId(String ownerUserId){
	this.ownerUserId = ownerUserId;
}

public String getownerUserId(){
	return this.ownerUserId;
}

public void setpublicRead(String publicRead){
	this.publicRead = publicRead;
}

public String getpublicRead(){
	return this.publicRead;
}

public void setpublicWrite(String publicWrite){
	this.publicWrite = publicWrite;
}

public String getpublicWrite(){
	return this.publicWrite;
}


}
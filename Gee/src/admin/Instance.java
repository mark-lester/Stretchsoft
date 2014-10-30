package admin;
import javax.persistence.*;
import java.util.*;

@Entity
@Table(name = "instance")

public class Instance extends AdminBase {

String databaseName;
String description;
String gitHubName;
String ownerUserId;
int publicRead;
int publicWrite;

public Instance(){}

public Instance (
		String databaseName,
		String description,
		String gitHubName,
		String ownerUserId,
		int publicRead,
		int publicWrite
		){
		this.databaseName=databaseName;
		this.description=description;
		this.gitHubName=gitHubName;
		this.ownerUserId=ownerUserId;
		this.publicRead=publicRead;
		this.publicWrite=publicWrite;
	}

public Instance(Hashtable <String,String> record){
	this.update(record);
}

public void update(Hashtable <String,String> record){
	this.databaseName=record.get("databaseName");
	this.gitHubName=record.get("gitHubName");
	this.ownerUserId=record.get("ownerUserId");
	this.description=record.get("description");
	
	try {
		this.publicRead=Integer.parseInt(record.get("publicRead"));
	} catch (NumberFormatException ex){
		System.err.println(ex);		
		this.publicRead=0;
	}

	try {
		this.publicWrite=Integer.parseInt(record.get("publicWrite"));
	} catch (NumberFormatException ex){
		System.err.println(ex);		
		this.publicWrite=0;
	}
}

public Hashtable <String,String> hash(){
	Hashtable <String,String> record=new Hashtable<String,String> ();
	record.put("databaseName",this.databaseName);
	record.put("description",this.description);
	record.put("gitHubName",this.gitHubName);
	record.put("ownerUserId",this.ownerUserId);
	record.put("publicRead",Integer.toString(this.publicRead));
	record.put("publicWrite",Integer.toString(this.publicWrite));
	return record;
}
public void setdatabaseName(String databaseName){
	this.databaseName = databaseName;
}

public String getdatabaseName(){
	return this.databaseName;
}

public void setgitHubName(String gitHubName){
	this.gitHubName = gitHubName;
}

public String getgitHubName(){
	return this.gitHubName;
}

public void setdescription(String description){
	this.description = description;
}

public String getdescription(){
	return this.description;
}

public void setownerUserId(String ownerUserId){
	this.ownerUserId = ownerUserId;
}

public String getownerUserId(){
	return this.ownerUserId;
}

public void setpublicRead(int publicRead){
	this.publicRead = publicRead;
}

public int getpublicRead(){
	return this.publicRead;
}

public void setpublicWrite(int publicWrite){
	this.publicWrite = publicWrite;
}

public int getpublicWrite(){
	return this.publicWrite;
}


}
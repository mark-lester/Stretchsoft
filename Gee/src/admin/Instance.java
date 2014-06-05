package admin;
import javax.persistence.*;
import java.util.*;

@Entity
@Table(name = "instance")

public class Instance extends AdminBase {

String databaseName;
String description;
String ownerUserId;
int publicRead;
int publicWrite;

public Instance(){}

public Instance (
		String databaseName,
		String description,
		String ownerUserId,
		int publicRead,
		int publicWrite
		){
		this.databaseName=databaseName;
		this.description=description;
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
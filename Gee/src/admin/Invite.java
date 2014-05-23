
package admin;
import javax.persistence.*;
import java.util.*;

@Entity
@Table(name = "invite")

public class Invite extends AdminBase {
String fromUserId;
String toUserId;
String databaseName;
String accessKey;
String grantEdit;
String grantAdmin;

public Invite(){}

public Invite ( 
String fromUserId,
String toUserId,
String databaseName,
String accessKey,
String grantEdit,
String grantAdmin){
 this.fromUserId=fromUserId;
 this.toUserId=toUserId;
 this.databaseName=databaseName;
 this.accessKey=accessKey;
 this.grantEdit=grantEdit;
 this.grantAdmin=grantAdmin;
}
public Invite(Hashtable <String,String> record){
	this.update(record);
}

public void update(Hashtable <String,String> record){
this.fromUserId=record.get("fromUserId");
this.toUserId=record.get("toUserId");
this.databaseName=record.get("databaseName");
this.accessKey=record.get("accessKey");
this.grantEdit=record.get("grantEdit");
this.grantAdmin=record.get("grantAdmin");
}

public Hashtable <String,String> hash(){
	Hashtable <String,String> record=new Hashtable<String,String> ();
record.put("fromUserId",this.fromUserId);
record.put("toUserId",this.toUserId);
record.put("databaseName",this.databaseName);
record.put("accessKey",this.accessKey);
record.put("grantEdit",this.grantEdit);
record.put("grantAdmin",this.grantAdmin);
 return record;
}
public void setfromUserId(String fromUserId){
		this.fromUserId = fromUserId;
	}

public String getfromUserId(){
		return this.fromUserId;
	}

public void settoUserId(String toUserId){
		this.toUserId = toUserId;
	}

public String gettoUserId(){
		return this.toUserId;
	}

public void setdatabaseName(String databaseName){
		this.databaseName = databaseName;
	}

public String getdatabaseName(){
		return this.databaseName;
	}

public void setaccessKey(String accessKey){
		this.accessKey = accessKey;
	}

public String getaccessKey(){
		return this.accessKey;
	}

public void setgrantEdit(String grantEdit){
		this.grantEdit = grantEdit;
	}

public String getgrantEdit(){
		return this.grantEdit;
	}

public void setgrantAdmin(String grantAdmin){
		this.grantAdmin = grantAdmin;
	}

public String getgrantAdmin(){
		return this.grantAdmin;
	}


}
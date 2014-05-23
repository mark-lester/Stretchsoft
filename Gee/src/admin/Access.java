
package admin;
import javax.persistence.*;
import java.util.*;

@Entity
@Table(name = "access")

public class Access extends AdminBase {
String databaseName;
String userId;
String editFlag;
String writeFlag;
String adminFlag;

public Access(){}

public Access ( 
String databaseName,
String userId,
String editFlag,
String writeFlag,
String adminFlag){
 this.databaseName=databaseName;
 this.userId=userId;
 this.editFlag=editFlag;
 this.writeFlag=writeFlag;
 this.adminFlag=adminFlag;
 
}
public Access(Hashtable <String,String> record){
	this.update(record);
}

public void update(Hashtable <String,String> record){
this.databaseName=record.get("databaseName");
this.userId=record.get("userId");
this.editFlag=record.get("editFlag");
this.writeFlag=record.get("writeFlag");
}

public Hashtable <String,String> hash(){
	Hashtable <String,String> record=new Hashtable<String,String> ();
record.put("databaseName",this.databaseName);
record.put("userId",this.userId);
record.put("editFlag",this.editFlag);
record.put("writeFlag",this.writeFlag);
 return record;
}
public void setdatabaseName(String databaseName){
		this.databaseName = databaseName;
	}

public String getdatabaseName(){
		return this.databaseName;
	}

public void setuserId(String userId){
		this.userId = userId;
	}

public String getuserId(){
		return this.userId;
	}

public void seteditFlag(String editFlag){
		this.editFlag = editFlag;
	}

public String geteditFlag(){
		return this.editFlag;
	}

public void setwriteFlag(String writeFlag){
		this.writeFlag = writeFlag;
	}

public String getwriteFlag(){
		return this.writeFlag;
	}

public void setadminFlag(String adminFlag){
	this.adminFlag = adminFlag;
}

public String getadminFlag(){
	return this.adminFlag;
}


}

package admin;
import javax.persistence.*;
import java.util.*;

@Entity
@Table(name = "users")

public class Users extends AdminBase {
String userId;
String loginType;
String userName;
String email;

public Users(){}

public Users ( 
String userId,
String loginType,
String userName,
String email){
 this.userId=userId;
 this.loginType=loginType;
 this.userName=userName;
 this.email=email;
}
public Users(Hashtable <String,String> record){
	this.update(record);
}

public void update(Hashtable <String,String> record){
this.userId=record.get("userId");
this.loginType=record.get("loginType");
this.userName=record.get("userName");
this.email=record.get("email");
}

public Hashtable <String,String> hash(){
	Hashtable <String,String> record=new Hashtable<String,String> ();
record.put("userId",this.userId);
record.put("loginType",this.loginType);
record.put("userName",this.userName);
record.put("email",this.email);
return record;
}
public void setuserId(String userId){
		this.userId = userId;
	}

public String getuserId(){
		return this.userId;
	}

public void setloginType(String loginType){
		this.loginType = loginType;
	}

public String getloginType(){
		return this.loginType;
	}

public void setuserName(String userName){
		this.userName = userName;
	}

public String getuserName(){
		return this.userName;
	}

public void setemail(String email){
		this.email = email;
	}

public String getemail(){
		return this.email;
	}


}
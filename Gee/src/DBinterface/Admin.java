package DBinterface;
import java.util.Hashtable;
import admin.*;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;
 
import javax.xml.parsers.*;
import org.xml.sax.*;
import sax.*;

import org.hibernate.HibernateException;
import org.hibernate.Session;

import admin.*;


public class Admin extends Generic {
/*
 * GetUser userId
 * 	  check user exists, if not then implicitly create user.
 * CreateUser userId
 * 	 insert userId and create default database <userId>.default
 * CreateDatabase ownerId,databaseName
 * 	
 * ListDatabasesForUser userId
 * 	owned, permissioned and public
 * VerifyUserReadAccess userId,databaseName
 * 	check user has access to given DB, via ownership, permissions or publicly available
 * VerifyUserWriteAccess userId,databaseName
 *   as above
 * VerifyUserAdminAccess userId,databaseName
 *   as above  
 *   
 * CreateInstance ownerId,databaseName
 * 
 * GrantUserReadAccess adminId,userId,databaseName,[true,false]
 * GrantUserWriteAccess adminId,userId,databaseName,[true,false]
 * GrantUserAdminAccess adminId,userId,databaseName,[true,false]
 *   
 */
	public Admin(){
		super("/home/Gee/config/admin","admin");
	}
	
	public Admin(String hibernateConfigDirectory,String databaseName){
		super(hibernateConfigDirectory,databaseName);
	}
	

	public String getUser(Hashtable <String,String> record){
		return getUser(record,0);
	}
	
	public String getUser(Hashtable <String,String> record,int recursion_count){
		if (recursion_count > 1){
			// ASSERTION FAILURE
			return null;			
		}
		Session session = null;
	    session = factory.openSession();
		String query = null;
		Users user=null;

		Object entities[] = session.createQuery("from Users where userId ='"+record.get("userId")+"'").list().toArray();
		session.close();
		if (entities.length > 1){
			// ASSERTION FAILURE
			return null;
		} else if (entities.length > 0) {
			user = (Users)entities[0];
			return user.getuserId();
		} else {
			int recordId = createRecord("admin.Users",record);
			return record.get("userId");
		    //return getUser(record,recursion_count+1);
		}
	}
	
	public Boolean verifyAdminAccess(String databaseName,String userId){
		Instance instance=null;
	    Session session = factory.openSession();

		Object instances[] = session.createQuery("from Instance where databaseName ='"+databaseName+"'").list().toArray();
		if (instances.length == 0){
			// non existent DB, grant access
			return true;	
		}
		instance = (Instance)instances[0];
		if (instance.getownerUserId().equals(userId)){
			return true;
		}
		
		Object access[] = session.createQuery("from Access where databaseName ='"+databaseName+"'and userId='"+userId+"' and adminFlag='1'").list().toArray();
		if (access.length == 0){ // no access 
			return false;	
		}
		// else yes, we have admin rights
		return false;
	}
	
	public Boolean verifyReadAccess(String databaseName,String userId){
		Instance instance=null;
	    Session session = factory.openSession();

		Object instances[] = session.createQuery("from Instance where databaseName ='"+databaseName+"'").list().toArray();
		if (instances.length == 0){
			// non existent DB, grant access
			return true;	
		}
		instance = (Instance)instances[0];
		if (instance.getownerUserId().equals(userId) || instance.getpublicRead()==1){
			return true;
		}
		
		Object access[] = session.createQuery("from Access where databaseName ='"+databaseName+"'and userId='"+userId+"'").list().toArray();
		if (access.length == 0){ // no access 
			return false;	
		}
		
		
		// else yes, we have read rights
		return false;
	}
	
	public Boolean verifyWriteAccess(String databaseName,String userId){
		Instance instance=null;
	    Session session = factory.openSession();

		Object instances[] = session.createQuery("from Instance where databaseName ='"+databaseName+"'").list().toArray();
		if (instances.length == 0){
			// non existent DB, grant access
			return true;	
		}
		instance = (Instance)instances[0];
		if (instance.getownerUserId().equals(userId)  || instance.getpublicWrite()==1){
			return true;
		}
		
		Object access[] = session.createQuery("from Access where databaseName ='"+databaseName+"'and userId='"+userId+"' and writeFlag='1'").list().toArray();
		if (access.length == 0){ // no access 
			return false;	
		}
		
		
		// else yes, we have read rights
		return false;
	}
	

	public String getInstance(Hashtable <String,String> record){
		Instance instance=null;
	    Session session = factory.openSession();

		Object entities[] = session.createQuery("from Instance where ownerId ='"+record.get("userId")+
				"' and databaseName='"+record.get("databaseName")+"'").list().toArray();
		if (entities.length > 1){
			// ASSERTION FAILURE
			return null;
		} else if (entities.length > 0) {
			instance = (Instance)entities[0];
		} else {
			int recordId = createRecord("admin.Instance",record);
			return record.get("userId");
		}
		return instance.getdatabaseName();
	}	

}// end class
  
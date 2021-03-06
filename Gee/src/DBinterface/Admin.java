package DBinterface;
import java.util.concurrent.*;

import java.io.IOException;
import java.io.InputStream;
import org.apache.commons.io.IOUtils;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Hashtable;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import org.hibernate.Session;
import admin.*;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

public class Admin extends DBinterface {
	   private static final Semaphore semaphore= new Semaphore(1);
	   static int call_count=0;
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
		super("./hibernate/admin","admin");
	}
	
	public Admin(String hibernateConfigDirectory,String databaseName,String userId,String serverName){
		super(hibernateConfigDirectory,databaseName,userId,serverName);
	}
	

	
	public String getUser(Hashtable <String,String> record){
		String userId = null;
		Session session = null;
	    session = factory.openSession();
	   
		String query = null;
		Users user=null;
		Object entities[] = session.createQuery("from Users where userId ='"+record.get("userId")+"'").list().toArray();
		session.close();
		if (entities.length > 0) {
			user = (Users)entities[0];
			userId =record.get("userId");
		} else {
			// when the user first arrives, with parallel requests we end up with two use records
			// hence this mess.
			try {
				semaphore.acquire();
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				return null;
			}
			session=factory.openSession();
			entities = session.createQuery("from Users where userId ='"+record.get("userId")+"'").list().toArray();
			session.close();
			if (entities.length > 0) {
				user = (Users)entities[0];
				userId = user.getuserId();
			} else {
				int recordId = createRecord("admin.Users",record);
				userId = record.get("userId");
			}
			semaphore.release();
		}
		return userId;
	}
	
	public Boolean verifyAdminAccess(String databaseName,String userId){
		Instance instance=null;
	    Session session = factory.openSession();
	    
		Object instances[] = session.createQuery("from Instance where databaseName ='"+databaseName+"'").list().toArray();
		session.close();
		if (instances.length == 0){
			// non existent DB, grant access
			return true;	
		}
		instance = (Instance)instances[0];
		if (instance.getownerUserId().equals(userId)){
			return true;
		}
		session = factory.openSession();
		Object access[] = session.createQuery("from Access where databaseName ='"+databaseName+"'and userId='"+userId+"' and adminFlag='1'").list().toArray();
		session.close();
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
		session.close();
		if (instances.length == 0){
			// non existent DB, grant access
			return true;	
		}
		instance = (Instance)instances[0];
		if (instance.getownerUserId().equals(userId) || instance.getpublicRead()==1){
			return true;
		}
		
		session = factory.openSession();
		Object access[] = session.createQuery("from Access where databaseName ='"+databaseName+"'and userId='"+userId+"'").list().toArray();
		session.close();
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
		session.close();
		if (instances.length == 0){
			// non existent DB, grant access
			return true;	
		}
		instance = (Instance)instances[0];
		if (instance.getownerUserId().equals(userId) || instance.getpublicWrite()==1){
			return true;
		}
		session = factory.openSession();
		Object access[] = session.createQuery("from Access where databaseName ='"+databaseName+"'and userId='"+userId+"' and editFlag='1'").list().toArray();
		session.close();
		if (access.length == 0){ // no access 
			return false;	
		}
		
		
		// else yes, we have read rights
		return false;
	}
	
	public Boolean verifyOwnership(String databaseName,String userId){
		Instance instance=null;
	    Session session = factory.openSession();

		Object instances[] = session.createQuery("from Instance where databaseName ='"+databaseName+"'").list().toArray();
		session.close();
		if (instances.length < 1){
			return false;
		}
		instance = (Instance)instances[0];
		return instance.getownerUserId().equals(userId);
	}
	
	public Boolean verifyExists(String databaseName){
		Instance instance=null;
	    Session session = factory.openSession();
	

		Object instances[] = session.createQuery("from Instance where databaseName ='"+databaseName+"'").list().toArray();
		session.close();
		if (instances.length < 1){
			System.err.println("Database "+databaseName+" does not exist");
			return false;
		}
		return true;
	}

	public Instance getInstanceO(Hashtable <String,String> record){
		Instance instance=null;
	    Session session = factory.openSession();

		Object entities[] = session.createQuery("from Instance where (ownerUserId ='"+record.get("userId")+"' or publicRead='1')"+
				" and databaseName='"+record.get("databaseName")+"'").list().toArray();
		session.close();
		if (entities.length > 1){
			// ASSERTION FAILURE
			return null;
		} else if (entities.length > 0) {
			instance = (Instance)entities[0];
		} else {
			int recordId = createRecord("admin.Instance",record);
			if (recordId > 0){
				return getInstanceO(record);
			} else {
				return null;
			}
		}
		return instance;
	}	

	public String getInstance(Hashtable <String,String> record){
		return getInstanceO(record).getdatabaseName();
	}
	
	public boolean CreateMySqlDatabase(String databaseName,InputStream s) {
	    try {
            // Create a connection to the database.
            Connection connection = DriverManager.getConnection(
            		configuration.getProperty("hibernate.connection.url"), 
            		configuration.getProperty("hibernate.connection.username"), 
            		configuration.getProperty("hibernate.connection.password"));
            
            PreparedStatement statement =
                    connection.prepareStatement("CREATE DATABASE IF NOT EXISTS "+databaseName);
            statement.execute();
            statement =
                    connection.prepareStatement("USE "+databaseName);
            statement.execute();
            String sql_commands =  getStringFromInputStream(s);

            for (String command : sql_commands.replaceAll("/\\*(?:.|[\\n\\r])*?\\*/","").split(";")){
				command = command.trim();
				if (command.length() == 0) continue;
				System.err.println("SQL COMMAND = "+command); 
				statement =
                    connection.prepareStatement(command);
				statement.execute();
			}
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
     
        return true;
    }
	
	static String readFile(String path, Charset encoding) 
			  throws IOException 
	{
		byte[] encoded = Files.readAllBytes(Paths.get(path));
		return new String(encoded, encoding);
	}


	public boolean DeleteMySqlDatabase(String databaseName) {
        try {
            // Create a connection to the database.
            Connection connection = DriverManager.getConnection(
            		configuration.getProperty("hibernate.connection.url"), 
            		configuration.getProperty("hibernate.connection.username"), 
            		configuration.getProperty("hibernate.connection.password"));
            
            PreparedStatement statement =
                    connection.prepareStatement("DROP DATABASE IF EXISTS "+databaseName);
            statement.execute();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
        return true;
    }
	// convert InputStream to String
		private static String getStringFromInputStream(InputStream is) {
	 
			BufferedReader br = null;
			StringBuilder sb = new StringBuilder();
	 
			String line;
			try {
	 
				br = new BufferedReader(new InputStreamReader(is));
				while ((line = br.readLine()) != null) {
					sb.append(line);
				}
	 
			} catch (IOException e) {
				e.printStackTrace();
			} finally {
				if (br != null) {
					try {
						br.close();
					} catch (IOException e) {
						e.printStackTrace();
					}
				}
			}
	 
			return sb.toString();
	 
		}
	 

}// end class
  
package DBinterface;
import java.util.concurrent.*;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Hashtable;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import org.hibernate.Session;
import admin.*;

public class Admin extends DBinterface {
	   private static final Semaphore semaphore= new Semaphore(1);
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
	private static String sql_commands=null;
    
	public Admin(){
		super("/home/Gee/config/admin","admin");
	}
	
	public Admin(String hibernateConfigDirectory,String databaseName){
		super(hibernateConfigDirectory,databaseName);
	}
	

	
	public String getUser(Hashtable <String,String> record){
		String userId = null;
		Session session = null;
	    session = factory.openSession();
	   
		String query = null;
		Users user=null;
		System.err.println("In getUser"); 
		Object entities[] = session.createQuery("from Users where userId ='"+record.get("userId")+"'").list().toArray();
		if (entities.length > 0) {
			user = (Users)entities[0];
			userId = user.getuserId();
		} else {
			// when the user first arrives, with parallel requests we end up with two use records
			// hence this mess.
			try {
				semaphore.acquire();
				System.err.println("got semaphore"); 
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				return null;
			}
			entities = session.createQuery("from Users where userId ='"+record.get("userId")+"'").list().toArray();
			if (entities.length > 0) {
				user = (Users)entities[0];
				userId = user.getuserId();
			} else {
				int recordId = createRecord("admin.Users",record);
				userId = record.get("userId");
				System.err.println("released semaphore");
			}
			semaphore.release();
		}
		session.close();
		return userId;
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
	
	public boolean CreateMySqlDatabase(String databaseName) {
	    try {
            // Create a connection to the database.
            Connection connection = DriverManager.getConnection(
            		hibernateConfig.properties.get("hibernate.connection.url"), 
            		hibernateConfig.properties.get("hibernate.connection.username"), 
            		hibernateConfig.properties.get("hibernate.connection.password"));
            
            PreparedStatement statement =
                    connection.prepareStatement("CREATE DATABASE IF NOT EXISTS "+databaseName);
            statement.execute();
            statement =
                    connection.prepareStatement("USE "+databaseName);
            statement.execute();
            if (sql_commands == null) sql_commands = readFile("/home/Gee/config/gtfs/create-gtfs.sql", Charset.defaultCharset());
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
            		hibernateConfig.properties.get("hibernate.connection.url"), 
            		hibernateConfig.properties.get("hibernate.connection.username"), 
            		hibernateConfig.properties.get("hibernate.connection.password"));
            
            PreparedStatement statement =
                    connection.prepareStatement("DROP DATABASE IF EXISTS "+databaseName);
            statement.execute();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
        return true;
    }

}// end class
  
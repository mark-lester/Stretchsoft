package DBinterface;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.File;
import java.io.InputStream;
import java.io.Reader;
import java.io.StringReader;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.io.ByteArrayInputStream;
import java.io.PrintWriter;
import java.io.InputStreamReader;

import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.Iterator;
import java.util.zip.*;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import java.io.ByteArrayOutputStream;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;
import org.xml.sax.InputSource;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.hibernate.service.ServiceRegistry;
import org.hibernate.service.ServiceRegistryBuilder;
import org.apache.commons.io.ByteOrderMark;
import org.apache.commons.io.input.BOMInputStream;
import org.jboss.logging.BasicLogger;

import org.hibernate.HibernateException;
import org.hibernate.AssertionFailure;
import org.hibernate.cfg.Configuration;
import org.xml.sax.SAXException;
import org.xml.sax.XMLReader;

import com.csvreader.CsvReader;
import com.csvreader.CsvWriter;

import sax.HibernateConfig;
import sax.TableMap;
import tables.*;
import DBinterface.StringOutputStream;

public class DBinterface {
    public SessionFactory factory;
    private SessionFactory sessionFactory;
    private ServiceRegistry serviceRegistry;
    public static final Hashtable <String,HibernateConfig> configStore = new  Hashtable <String,HibernateConfig>();
    public HibernateConfig hibernateConfig=null;

    public String dataDirectory="/home/Gee/gtfs/";
    public String databaseName="gtfs";
    public String serverName="gee-2";
    public String hibernateConfigDirectory="";
    public static final int ZIP_BUFFER_SIZE = 50;
    public SAXParserFactory spf;
    public SAXParser saxParser;
    public XMLReader xmlReader;
    public static int session_count=0;
    public Configuration configuration=null;
    public static final int RECORDS_PER_COMMIT=1000; 
    public boolean success=false;
    public Hashtable <String,String> load_success = new Hashtable <String,String>() ;

//    public Transaction tx = null;
//    public Session session = null;

//TODO merge these two constructors
//	GITHUB_SECRET = getServletContext().getInitParameter("GITHUB_SECRET");

    public DBinterface(String hibernateConfigDirectory,String databaseName, String userName,String serverName){
   System.err.println("DBInterface on server name "+serverName);
    	this.serverName=serverName;    	
    	this.dataDirectory="/home/Gee/users/"+userName;    	
    	this.hibernateConfigDirectory=hibernateConfigDirectory;    
    	this.databaseName=databaseName;
    	init();
    }

    public DBinterface(String hibernateConfigDirectory,String databaseName, String userName){
    	   System.err.println("DBInterface on username "+userName);
    	this.dataDirectory="/home/Gee/users/"+userName;    	
    	this.hibernateConfigDirectory=hibernateConfigDirectory;    
    	this.databaseName=databaseName;
    	init();
    }
    
    public DBinterface(String hibernateConfigDirectory,String databaseName){
    	   System.err.println("DBInterface on "+databaseName);
    	this.hibernateConfigDirectory=hibernateConfigDirectory;    	
    	this.databaseName=databaseName;
    	init();
    }
    
    public DBinterface(){
    	init();
    }
    
    public void init(){
    	 try {
             // The newInstance() call is a work around for some
             // broken Java implementations

    		 Class.forName("com.mysql.jdbc.Driver").newInstance();
    		 Class.forName("org.jboss.logging.BasicLogger").newInstance();
         } catch (Exception ex) {
             System.err.println("oops Failed to load com.mysql.jdbc.Driver. " + ex);
         }
    	 
    	try{
            factory = configureSessionFactory();
        } catch (Throwable ex) {
            System.err.println("Failed to create sessionFactory object." + ex);
            throw new ExceptionInInitializerError(ex);
        }   

        spf = SAXParserFactory.newInstance();   
        spf.setNamespaceAware(true);
        try {
			saxParser = spf.newSAXParser();
	        xmlReader = saxParser.getXMLReader();
		} catch (ParserConfigurationException | SAXException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

        if (!configStore.containsKey(hibernateConfigDirectory)){
        	configStore.put(hibernateConfigDirectory,ReadConfig(hibernateConfigDirectory));        	
        }
        hibernateConfig = configStore.get(hibernateConfigDirectory);  
    }
    
        public SessionFactory configureSessionFactory() throws HibernateException { 	
        configuration = new Configuration();   
        String databaseType = databaseName.matches("admin") ? "admin" : "gtfs";
        configuration.configure("hibernate/"+databaseType+"/hibernate.cfg.xml");
//        System.err.println("doing a session for db "+databaseName+" hosts "+serverName);
         configuration.setProperty("hibernate.connection.url", "jdbc:mysql://"+serverName+"/"+ databaseName+"?autoReconnect=true");
/*         System.err.println(" USERNAME="+
        	        configuration.getProperty("hibernate.connection.username")+
        	         " password= "+
        	        configuration.getProperty("hibernate.connection.username")
        	        );
*/
        serviceRegistry = new ServiceRegistryBuilder().
                applySettings(configuration.getProperties()).
                buildServiceRegistry();   
        
        sessionFactory = configuration.buildSessionFactory(serviceRegistry);
        return sessionFactory;
    }
    
    private HibernateConfig ReadConfig(String directory) 
    {
        // reads the config to get the list of mapping (resource) files
System.err.println("ReadConfig("+directory+")");
InputStream s = getClass().getClassLoader().getResourceAsStream(directory+"hibernate.cfg.xml");
InputSource i = new InputSource(s);
        HibernateConfig hibernateConfig=new HibernateConfig();
        try{
            xmlReader.setContentHandler(hibernateConfig);
            xmlReader.parse(i);
        } catch (SAXException ex) {
            System.err.println(ex);       
        } catch (IOException ex) {
            System.err.println(ex);               
        } 
        
        for (String resourceFile : hibernateConfig.resources) {
            // load the specific table
            System.out.println("READCONFIG "+resourceFile+"...\n"); 
            TableMap tableMap = ReadTableMap(resourceFile,directory);
            hibernateConfig.tableMaps.put(resourceFile, tableMap);
        }   
        System.out.println("HIBERNATE CONECTION STUFF :"+hibernateConfig.properties.get("hibernate.connection.url")+":\n");       
    
        return hibernateConfig;
    }
      
    private TableMap ReadTableMap(String resourceFile, String directory) 
    {
        // populates a hash of the field names, and also initialises "className" and "tableName" strings
    	InputStream s = getClass().getClassLoader().getResourceAsStream(resourceFile);
    	InputSource i = new InputSource(s);
      TableMap tableMap=new TableMap();
        try{
            xmlReader.setContentHandler(tableMap);
            xmlReader.parse(i);
        } catch (SAXException ex) {
            System.err.println(ex);       
        } catch (IOException ex) {
            System.err.println(ex);   
        }
       
        return tableMap;
    }
    
    
      
 // TODO refactor this to use the classNames from the keys of tableMaps
     public boolean LoadTable(String resourceFile, Hashtable <String,Reader> zipHash,PrintWriter out) throws HibernateException {
         // the resource file is the <table>.hbm.xml
         // read it to get the field names, for which we can make up a hashtable
         // all the table handlers have a constructor which takes a hash of <string,string>
         // and will map them accordingly (e.g. using Integer.parseInt and catching the parse exception if need be
         TableMap tableMap = hibernateConfig.tableMaps.get(resourceFile);
         Set <String> keys = tableMap.map.keySet();
         String className=tableMap.className;
         String tableName=tableMap.tableName;
         Session session = null;
         Transaction tx = null;
         int updates=0;
         int inserts=0;
         int errors=0;
         int count=0;
         
             session = factory.openSession();
             tx = session.beginTransaction();
            
        	 CsvReader csvReader=null;
             try {
            	 if (zipHash == null){
            		 csvReader = new CsvReader(dataDirectory+tableName+".txt");
            	 } else {
            		 if (zipHash.get(tableName+".txt")==null) return false;
            		 csvReader = new CsvReader(zipHash.get(tableName+".txt"));
            	 }
                 csvReader.readHeaders();
                 int row=0;
                 while (csvReader.readRecord()) {
                	 row++;
                     Hashtable<String,String> record = new Hashtable<String,String>();
                     boolean set_flag=false;
                     for (String databaseFieldName : keys) {
                    	 if (databaseFieldName == null || databaseFieldName.isEmpty()) continue;
                         String hibernateFieldName=tableMap.map.get(databaseFieldName);
                    	 if (hibernateFieldName == null || hibernateFieldName.isEmpty()) continue;
                         String csvFieldValue=csvReader.get(databaseFieldName);
                    	 if (csvFieldValue == null || csvFieldValue.isEmpty() || csvFieldValue.length() > 255) continue;
                         record.put(hibernateFieldName, csvFieldValue);
                         set_flag=true;
                     }
                     if (!set_flag) continue;
                     expandRecord(className,record);
                     int hibernateId;
                     hibernateId = existsRecord(session,className,tableMap,record);
                     
                     if (hibernateId > 0){
                    	 record.put("hibernateId",Integer.toString(hibernateId));
                    	 updateRecordInner(session,tx,className,record);
                    	 updates++;
//                         System.err.print("U");
                     } else {
                    	 try {
                    		 hibernateId=createRecordInner(session,tx,className,record);
                    		 inserts++;
                    	 } catch (AssertionFailure ex) {
                             System.err.println("Assertion Failure in "+tableName+"row number "+row+" :" + ex);                   	 
                             out.println("Assertion Failure in "+tableName+"row number "+row+" :" + ex);                   	 
                             for (String databaseFieldName : keys) {
             						System.err.println(databaseFieldName+"="+csvReader.get(databaseFieldName));
            						out.print(databaseFieldName+"="+csvReader.get(databaseFieldName)+": ");
                             }
                             out.println("");
                    		 errors++;
                    	 }
                     }
                     if (count++%RECORDS_PER_COMMIT == 0){
//                    	 System.err.println("Commiting block of records");
                    	 tx.commit();               	 
                    	 session.close();
                         session = factory.openSession();
                    	 tx = session.beginTransaction();
                     }
//                     if (count%100 == 0) System.err.println("");
                 }
                
             } catch ( FileNotFoundException ex) {
                 out.println("Failed to get csv file for "+tableName+" :" + ex);       
             }  catch ( IOException ex) {
                 out.println("Failed reading csv file for "+tableName+" :" + ex);       
             } catch (AssertionFailure|HibernateException ex) {
                 System.err.println("Failed importing "+tableName+" :" + ex);                   	 
                 out.println("Failed importing "+tableName+" :" + ex);                   	 
                 for (String databaseFieldName : keys) {
                	 try {
 						System.err.println(databaseFieldName+"="+csvReader.get(databaseFieldName));
						out.println(databaseFieldName+"="+csvReader.get(databaseFieldName));
					} catch (IOException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
                 }
             }
             tx.commit();
             session.close();  
//             System.err.println("");
             out.println(
            		 "Inserts="+Integer.toString(inserts)+ 
            		 " Updates="+Integer.toString(updates)+ 
            		 " Errors="+Integer.toString(errors) 
            		 );
             return true;
         }

//     public boolean DumpTable(String resourceFile,ZipOutputStream zipFile,CsvWriter csvWriter){
         public boolean DumpTable(String resourceFile,Hashtable <String,String> fileHash,CsvWriter csvWriter){
         // the resource file is the <table>.hbm.xml
         // read it to get the field names, for which we can make up a hashtable
         // all the table handlers have a constructor which takes a hash of <string,string>
         // and will map them accordingly (e.g. using Integer.parseInt and catching the parse exception if need be
    
        	 TableMap tableMap = hibernateConfig.tableMaps.get(resourceFile);
             Enumeration ekeys = tableMap.map.keys();
             Set <String> keys = tableMap.map.keySet();
//             String[] keyArray = keys.toArray(new String[0]);
             String[] fieldOrder = tableMap.csvFieldOrder.toArray(new String[0]);
            
             String className=tableMap.className;
             String tableName=tableMap.tableName;
             StringOutputStream os =null;
             int recno=0;
             Session session = factory.openSession();
             try {
                 Object entities[]=session.createCriteria(className).list().toArray();
                 String fileName=tableName+".txt";
                 if (fileHash != null){
                	 os = new StringOutputStream();
                	 String fileData = new String();
                	 csvWriter=new CsvWriter(os,',',StandardCharsets.UTF_8);
// csvWriter must be set as well. We have to pass both else when 
                     // the local csvWriter drops out of scope it wil close the zipFile stream as well. 
                 } else {
                     csvWriter = new CsvWriter(dataDirectory+tableName+".txt");                	 
                 }
                 csvWriter.writeRecord(fieldOrder);
                 for (Object record : entities) {
                     ArrayList <String> outrec = new ArrayList <String> ();
                     Class<?> cls = Class.forName(className);

                     Method m = cls.getMethod("hash");
                     try{
                         Hashtable <String,String> hashrecord=(Hashtable <String,String>)m.invoke(record);
                    
                         for (String cvsFieldName : fieldOrder) {
                             outrec.add(hashrecord.get(tableMap.map.get(cvsFieldName)));
                         }
                         String[] fieldArray = outrec.toArray(new String[0]);

                         csvWriter.writeRecord(fieldArray);
                     } catch (IllegalAccessException e) {
                         // TODO Auto-generated catch block
                         e.printStackTrace();
                     } catch (IllegalArgumentException e) {
                         // TODO Auto-generated catch block
                         e.printStackTrace();
                     } catch (InvocationTargetException e) {
                         // TODO Auto-generated catch block
                         e.printStackTrace();
                     } finally{}

                 }
                 csvWriter.close();
                 fileHash.put(fileName,os.toString());

                
             } catch ( FileNotFoundException ex) {
                 System.err.println("Failed to get csv file for "+tableName+" :" + ex);       
             }  catch ( IOException ex) {
                 System.err.println("Failed writing csv file for "+tableName+" :" + ex);       
             } catch (ClassNotFoundException e) {
                 // TODO Auto-generated catch block
                 e.printStackTrace();
             } catch (NoSuchMethodException e) {
                 // TODO Auto-generated catch block
                 e.printStackTrace();
             } catch (SecurityException e) {
                 // TODO Auto-generated catch block
                 e.printStackTrace();
             } finally {
                 session.close();            	 
             }
             return true;
         }
    
 // I guess we should just do this with SQL, i.e. delete from table;
     public boolean ZapTable(String resourceFile){
    	 TableMap tableMap = hibernateConfig.tableMaps.get(resourceFile);
    	 String className=tableMap.className;
    	 Session session = factory.openSession();
    	 Transaction tx = session.beginTransaction();
    	 try {
    		 Object entities[]=session.createCriteria(className).list().toArray();
    		 for (Object record : entities) {
    			 session.delete(record);
    		}
         } catch (SecurityException e) {
                 // TODO Auto-generated catch block
             e.printStackTrace();
         }
         tx.commit();
            
         return true;
     }

     // right now this is a nasty hack to heal up missing agency_id in the routes.txt
     // which google reckons is overkill
   public void expandRecord(String className, Hashtable <String,String> record)  {

	   switch (className){
	   case "tables.Routes":
		   if (record.get("agencyId") == null || 
		   		record.get("agencyId").isEmpty() ||
		   		record.get("agencyId").equals("NULL") ||
		   		record.get("agencyId").equals("null")){
				Session session = factory.openSession();
				Object agency[] = session.createQuery("From Agency").list().toArray();
				session.close();
				if (agency.length > 0) {
					tables.Agency a = (tables.Agency)agency[0];
					record.put("agencyId",a.getagencyId());
				}
	   	   }
		   break;
// both calendar dates, and potentially trips, may refer to implicit, i.e. non existent service ids, 
// which normally are defined in calendar.txt. If, and only if, calendar.txt is missing, I will insert
// an entry in Calendar for all days and from 2000 to 2030 for any of these implicit service_id
// this isnt in the google spec, unlike the missing agency_id column above in routes.txt, 
// but I have a number of cases already, so it it's in mine.
		   
	   case "tables.Trips":
	   case "tables.CalendarDates":
		   if (load_success.get("stop_times.txt") == null){  // only do this if there was no calendar.txt
				Session session = factory.openSession();
				String query="FROM Calendar where serviceId='"+record.get("serviceId")+"'";
				Object entities[] = session.createQuery(query).list().toArray();
				session.close();
				if (entities.length > 0) break;  // good it's already there

				Hashtable <String,String> calendar_rec=new Hashtable <String,String>();
				calendar_rec.put("serviceId", record.get("serviceId"));
				calendar_rec.put("monDay", "1");
				calendar_rec.put("tuesDay", "1");
				calendar_rec.put("wednesDay", "1");
				calendar_rec.put("thursDay", "1");
				calendar_rec.put("friDay", "1");
				calendar_rec.put("saturDay", "1");
				calendar_rec.put("sunDay", "1");
				calendar_rec.put("startDate", "20000101");
				calendar_rec.put("endDate", "20300101");
				createRecord("tables.Calendar",calendar_rec);
		   }		   
        }
   }
     
public int existsRecord(Session session, String className,TableMap tableMap,Hashtable <String,String> record) throws HibernateException{
	String query = new String();
	Boolean first=true;
	String entityName = className.substring(className.lastIndexOf(".")+1);
//	query += "FROM "+entityName;
	query += "select * FROM "+tableMap.tableName;
	
	if (tableMap.use_key != null){
		query += " use index("+tableMap.use_key+") ";
	}
	
	for (String keyName : tableMap.keyFields) {
        if (first){
        	query += " WHERE ";        	
        } else {
        	query += " AND ";
        }
        first=false;
//        query += keyName+"='"+record.get(keyName)+"'";
        query += tableMap.pam.get(keyName)+"='"+record.get(keyName)+"'";
    }
	if (first){ // these are no keys, nothing exists for de-duping
		return 0; 
	}
	Object entities[]=session.createSQLQuery(query).addEntity(className).list().toArray();
	if (entities.length < 1){
		return 0; // no matching entity
	}
    Class<?> cls=null;
    Method m;
    int hibernateId=0;
	try {
		cls = Class.forName(className);
		               
		m = cls.getMethod("gethibernateId");
	    hibernateId = (int)m.invoke(entities[0]);
//	    System.err.println("we got hibernate_id="+Integer.toString(hibernateId));
	} catch (ClassNotFoundException | InvocationTargetException | NoSuchMethodException | SecurityException e) {
		// TODO Auto-generated catch block
		e.printStackTrace();
	} catch (IllegalAccessException e) {
		// TODO Auto-generated catch block
		e.printStackTrace();
	} catch (IllegalArgumentException e) {
		// TODO Auto-generated catch block
		e.printStackTrace();
	}
    return hibernateId;
}

public int createRecord(String className,Hashtable <String,String> record) throws HibernateException{
     Integer recordId = null;
//     className = "tables."+className;
     Session session = factory.openSession();
     Transaction tx = session.beginTransaction();
     try {
     recordId=createRecordInner(session,tx,className,record);
     } catch (HibernateException e){
         if (tx!=null) tx.rollback();
         session.close();
         throw(e);
     }
     tx.commit();
     session.close();
     return recordId;
 }
 // hived this into an inner method so we can do mass inserts on one session, and not commit every line else it takes yonks
 // we dont really need to bother doing this for update,
 // but if we are going to allow "zap database" then delete could do with the same
 public int createRecordInner(Session session,Transaction tx, String className,Hashtable <String,String> record) throws HibernateException{
     Integer recordId = null;
 
     try{
         Object hibernateRecord;
         try {
         hibernateRecord= (Object) Class.forName(className).getConstructor(Hashtable.class).newInstance(record);   
         } catch (InvocationTargetException e){
        	 e.printStackTrace();
        	 return 0;
         }
         recordId = (Integer) session.save(hibernateRecord);
      }catch (
              ClassNotFoundException|
              NoSuchMethodException|
              IllegalAccessException|
              InstantiationException e) {
          if (tx!=null) tx.rollback();
          e.printStackTrace();
      }
      return recordId;
 }

 public int updateRecord(String entityName,Hashtable <String,String> inputRecord) throws HibernateException{
//     entityName = "tables."+entityName;
     Session session = factory.openSession();
     Transaction tx = session.beginTransaction();
     int recordId = updateRecordInner(session,tx,entityName,inputRecord);     
     tx.commit();
     session.close();    	 
     return recordId;
 }

  public int updateRecordInner(Session session, Transaction tx,String entityName,Hashtable <String,String> inputRecord) throws HibernateException{
	 int hibernateId = Integer.parseInt(inputRecord.get("hibernateId"));
//		System.err.println("In updateRecordInner after parse of hid="+inputRecord.get("hibernateId")+" class="+entityName); 

	 Integer recordId = -1;
     try {
         Class<?> cls = Class.forName(entityName);
         Method m = cls.getMethod("update", inputRecord.getClass());         
         Object hibernateRecord = (Object)session.get(cls,hibernateId);
         m.invoke(hibernateRecord,inputRecord);
         recordId = (Integer) session.save(hibernateRecord);
     } catch (NullPointerException|ClassNotFoundException|
             NoSuchMethodException|
             InvocationTargetException|
             IllegalAccessException e) {
         System.err.println(e.toString());
         e.printStackTrace();
     }
     return recordId;
  }


 public int deleteRecord(String className,Hashtable <String,String> record) throws HibernateException{
//     className = "tables."+className;
     int hibernateId = Integer.parseInt(record.get("hibernateId"));
     Session session = factory.openSession();
     Transaction tx = null;
     try{
    	 tx = session.beginTransaction();
         Object hibernateRecord =
             (Object)session.get(Class.forName(className),hibernateId);
         session.delete(hibernateRecord);
         tx.commit();
     }catch (
             ClassNotFoundException e) {
         if (tx!=null) tx.rollback();
             e.printStackTrace();
             return -1;
     } finally {
         session.close();
    }
    return hibernateId;
 }
 
}

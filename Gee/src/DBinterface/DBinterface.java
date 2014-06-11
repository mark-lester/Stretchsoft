package DBinterface;

import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.Reader;
import java.io.StringReader;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.io.ByteArrayInputStream;


import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.Map;
import java.util.Iterator;
import java.util.zip.ZipInputStream;
import java.io.ByteArrayInputStream;
import org.apache.commons.lang.ArrayUtils;
import java.util.zip.*;
import java.io.ByteArrayOutputStream;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;

import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.hibernate.service.ServiceRegistry;
import org.hibernate.service.ServiceRegistryBuilder;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.SessionFactory;
import org.hibernate.service.*;
import org.hibernate.cfg.Configuration;
import org.xml.sax.SAXException;
import org.xml.sax.XMLReader;

import com.csvreader.CsvReader;
import com.csvreader.CsvWriter;

import sax.HibernateConfig;
import sax.TableMap;
import DBinterface.StringOutputStream;
import org.hibernate.service.jdbc.connections.internal.C3P0ConnectionProvider;


public class DBinterface {
    public SessionFactory factory;
    private SessionFactory sessionFactory;
    private ServiceRegistry serviceRegistry;
    public static final Hashtable <String,HibernateConfig> configStore = new  Hashtable <String,HibernateConfig>();
    public HibernateConfig hibernateConfig=null;
    public String dataDirectory="/home/Gee/gtfs/";
    public String databaseName="gtfs";
    public String hibernateConfigDirectory="";//"/home/Gee/config/";
    public static final int ZIP_BUFFER_SIZE = 50;
    public SAXParserFactory spf;
    public SAXParser saxParser;
    public XMLReader xmlReader;

//    public Transaction tx = null;
//    public Session session = null;

//TODO merge these two constructors
    public DBinterface(String hibernateConfigDirectory,String databaseName, String userName){
    	this.dataDirectory="/home/Gee/users/"+userName;    	
    	this.hibernateConfigDirectory=hibernateConfigDirectory;    	
    	this.databaseName=databaseName;
    	init();
    }
    
    public DBinterface(String hibernateConfigDirectory,String databaseName){
    	this.hibernateConfigDirectory=hibernateConfigDirectory;    	
    	this.databaseName=databaseName;
    	init();
    }
    
    public DBinterface(){
    	init();
    }
    
    public void init(){
    	try{
            factory = configureSessionFactory();
        } catch (Throwable ex) {
            System.err.println("Failed to create sessionFactory object." + ex);
            throw new ExceptionInInitializerError(ex);
        }   

        hibernateConfig = configStore.get(hibernateConfigDirectory);  
        spf = SAXParserFactory.newInstance();   
        spf.setNamespaceAware(true);
        try {
			saxParser = spf.newSAXParser();
	        xmlReader = saxParser.getXMLReader();
		} catch (ParserConfigurationException | SAXException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    	    
        if (!configStore.containsKey("/home/Gee/config/gtfs")){
        	configStore.put("/home/Gee/config/gtfs",ReadConfig("/home/Gee/config/gtfs"));        	
        }
        
        if (!configStore.containsKey("/home/Gee/config/admin")){
        	configStore.put("/home/Gee/config/admin",ReadConfig("/home/Gee/config/admin"));        	
        }
        
        if (!configStore.containsKey(hibernateConfigDirectory)){
        	configStore.put(hibernateConfigDirectory,ReadConfig(hibernateConfigDirectory));        	
        }
    }
    
    public void runLoader(byte[] zipData) {
    	 // this is where you start, with an InputStream containing the bytes from the zip file
    	InputStream zipStream = new ByteArrayInputStream(zipData);
        ZipInputStream zis = new ZipInputStream(zipStream);
        ZipEntry entry;
        Hashtable <String,Reader> zipHash = new Hashtable <String,Reader>();
   
        try {
			while ((entry = zis.getNextEntry()) != null) {   
			    String fileName = entry.getName();
			    byte[] buffer=new byte[1024];
			    String outString ="";
			    int len;
			    while ((len = zis.read(buffer,0,1024)) != -1){			    	
			    	byte [] subArray = Arrays.copyOfRange(buffer, 0, len);
			    	String str = new String(subArray, "UTF-8");
			    	outString += str;
			    }
		    	Reader thisReader = new StringReader(outString);
		    	zipHash.put(fileName,thisReader);
			}
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        
        for (String resourceFile : hibernateConfig.resources) {
            // load the specific table
            System.out.println("Loading "+resourceFile+"...\n");       
            LoadTable(resourceFile,zipHash);
            System.out.println("Done "+resourceFile+"\n");       
        }   
    }
    
    public void runLoader() {
        // get the tables out of the hibernate.cfg.xml.
        // you can presumably do that via hibernate itself but I couldn't work out how to do that

        for (String resourceFile : hibernateConfig.resources) {
            // load the specific table
            System.out.println("Loading "+resourceFile+"...\n");       
            LoadTable(resourceFile,null);
            System.out.println("Done "+resourceFile+"\n");       
        }   
    }

    public void runZapper() {
        // get the tables out of the hibernate.cfg.xml.
        // you can presumably do that via hibernate itself but I couldn't work out how to do that

        for (String resourceFile : hibernateConfig.resources) {
            // load the specific table
            System.out.println("Loading "+resourceFile+"...\n");       
            ZapTable(resourceFile);
            System.out.println("Done "+resourceFile+"\n");       
        }   
    }

    public byte[] runDumper() {
        // get the tables out of the hibernate.cfg.xml.
        // you can presumably do that via hibernate itself but I couldn't work out how to do that
        Hashtable <String,String> files = new Hashtable <String,String>();
        
        for (String resourceFile : hibernateConfig.resources) {
            // load the specific table
            System.out.println("Dumping "+resourceFile+"...\n");       
//            DumpTable(resourceFile,zipFile,csvWriter);
            DumpTable(resourceFile,files,null);
            System.out.println("Done "+resourceFile+"\n");       
        } 
        
        ByteArrayOutputStream bos = new ByteArrayOutputStream();  
        ZipOutputStream zipfile = new ZipOutputStream(bos);  
        Iterator i = files.keySet().iterator();  
        String fileName = null;  
        ZipEntry zipentry = null;  
        while (i.hasNext()) {  
            fileName = (String) i.next();  
            zipentry = new ZipEntry(fileName);  
            try {
				zipfile.putNextEntry(zipentry);
				zipfile.write(files.get(fileName).getBytes());
			} catch (IOException e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
			}  
        }  
        try {
			zipfile.close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}  
        return bos.toByteArray();  
    }
    
    public SessionFactory configureSessionFactory() throws HibernateException {
        Configuration configuration = new Configuration();   
         configuration.configure(new File(hibernateConfigDirectory+"/hibernate.cfg.xml"));
         configuration.setProperty("hibernate.connection.url", "jdbc:mysql://localhost/"+ databaseName+"?autoReconnect=true");
        serviceRegistry = new ServiceRegistryBuilder().
                applySettings(configuration.getProperties()).
                buildServiceRegistry();   
        
        sessionFactory = configuration.buildSessionFactory(serviceRegistry);
        return sessionFactory;
    }
    
    private HibernateConfig ReadConfig(String directory) 
    {
        // reads the config to get the list of mapping (resource) files

        HibernateConfig hibernateConfig=new HibernateConfig();
        try{
            xmlReader.setContentHandler(hibernateConfig);
            xmlReader.parse(directory+"/hibernate.cfg.xml");
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
        TableMap tableMap=new TableMap();
        try{
            xmlReader.setContentHandler(tableMap);
            xmlReader.parse(directory+"/"+resourceFile);
        } catch (SAXException ex) {
            System.err.println(ex);       
        } catch (IOException ex) {
            System.err.println(ex);   
        }
       
        return tableMap;
    }
    
    
      
 // TODO refactor this to use the classNames from the keys of tableMaps
     public boolean LoadTable(String resourceFile, Hashtable <String,Reader> zipHash){
         // the resource file is the <table>.hbm.xml
         // read it to get the field names, for which we can make up a hashtable
         // all the table handlers have a constructor which takes a hash of <string,string>
         // and will map them accordingly (e.g. using Integer.parseInt and catching the parse exception if need be
             TableMap tableMap = hibernateConfig.tableMaps.get(resourceFile);
//             Enumeration<String> ekeys = tableMap.map.keys();
             Set <String> keys = tableMap.map.keySet();
             String className=tableMap.className;
             String tableName=tableMap.tableName;
     		Session session = null;

             session = factory.openSession();
             Transaction tx = session.beginTransaction();
            
             try {
            	 CsvReader csvReader=null;
            	 if (zipHash == null){
            		 csvReader = new CsvReader(dataDirectory+tableName+".txt");
            	 } else {
            		 if (zipHash.get(tableName+".txt")==null) return false;
            		 csvReader = new CsvReader(zipHash.get(tableName+".txt"));
            	 }
                 csvReader.readHeaders();
                 while (csvReader.readRecord()) {
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
                     createRecordInner(session,tx,className,record);
                 }
                
             } catch ( FileNotFoundException ex) {
                 System.err.println("Failed to get csv file for "+tableName+" :" + ex);       
             }  catch ( IOException ex) {
                 System.err.println("Failed reading csv file for "+tableName+" :" + ex);       
             }
             tx.commit();
            
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
             String[] fieldOrder = tableMap.cvsFieldOrder.toArray(new String[0]);
            
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

 public int createRecord(String className,Hashtable <String,String> record){
     Integer recordId = null;
//     className = "tables."+className;
     Session session = factory.openSession();
     Transaction tx = session.beginTransaction();
     recordId=createRecordInner(session,tx,className,record);
     tx.commit();
     session.close();
     return recordId;
 }
 // hived this into an inner method so we can do mass inserts on one session, and not commit every line else it takes yonks
 // we dont really need to bother doing this for update,
 // but if we are going to allow "zap database" then delete could do with the same
 public int createRecordInner(Session session,Transaction tx, String className,Hashtable <String,String> record){
     Integer recordId = null;
 
     try{
         Object hibernateRecord = (Object) Class.forName(className).getConstructor(Hashtable.class).newInstance(record);           
         recordId = (Integer) session.save(hibernateRecord);
      }catch (HibernateException|
              ClassNotFoundException|
              InvocationTargetException|
              NoSuchMethodException|
              IllegalAccessException|
              InstantiationException e) {
          if (tx!=null) tx.rollback();
          e.printStackTrace();
      }
      return recordId;
 }

 public int updateRecord(String entityName,Hashtable <String,String> inputRecord){
//     entityName = "tables."+entityName;
     int hibernateId = Integer.parseInt(inputRecord.get("hibernateId"));
     Session session = factory.openSession();
     Integer recordId = -1;

     try {
         Class<?> cls = Class.forName(entityName);
         Method m = cls.getMethod("update", inputRecord.getClass());
         Transaction tx = session.beginTransaction();
         System.err.println("In update record for class="+entityName);       

         Object hibernateRecord = (Object)session.get(cls,hibernateId);
         m.invoke(hibernateRecord,inputRecord);
         System.err.println("just called update");
         recordId = (Integer) session.save(hibernateRecord);
         tx.commit();
     }catch(
             ClassNotFoundException|
             NoSuchMethodException|
             InvocationTargetException|
             IllegalAccessException e) {
         System.err.println(e.toString());
     }  
     return recordId;
 }


 public int deleteRecord(String className,Hashtable <String,String> record){
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
     }catch (HibernateException|
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

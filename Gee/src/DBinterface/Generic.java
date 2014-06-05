package DBinterface;

import java.io.FileNotFoundException;
import java.io.FileOutputStream;
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
import java.io.ByteArrayInputStream;


import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Set;
import java.util.zip.ZipEntry;
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

public class Generic {
    public SessionFactory factory;
    private SessionFactory sessionFactory;
    private ServiceRegistry serviceRegistry;
    public HibernateConfig hibernateConfig;
    public String dataDirectory="/home/Gee/gtfs/";
    public String databaseName="gtfs";
    public String hibernateConfigDirectory="";//"/home/Gee/config/";
    public static final int ZIP_BUFFER_SIZE = 50;
//    public Transaction tx = null;
//    public Session session = null;

//TODO merge these two constructors
    public Generic(String hibernateConfigDirectory,String databaseName, String userName){
    	this.dataDirectory="/home/Gee/users/"+userName;    	
    	this.hibernateConfigDirectory=hibernateConfigDirectory;    	
    	this.databaseName=databaseName;
    	init();
    }
    
    public Generic(String hibernateConfigDirectory,String databaseName){
    	this.hibernateConfigDirectory=hibernateConfigDirectory;    	
    	this.databaseName=databaseName;
    	init();
    }
    
    public Generic(){
    	init();
    }
    
    public void init(){
        try{
            factory = configureSessionFactory();
        } catch (Throwable ex) {
            System.err.println("Failed to create sessionFactory object." + ex);
            throw new ExceptionInInitializerError(ex);
        }   
        hibernateConfig = ReadConfig();
    }
    
    public static byte[] unzipByteArray(byte[] file)
            throws IOException {
      byte[] byReturn = null;

      Inflater oInflate = new Inflater(false);
      oInflate.setInput(file);

      ByteArrayOutputStream oZipStream = new ByteArrayOutputStream();
      try {
        while (! oInflate.finished() ){
          byte[] byRead = new byte[ZIP_BUFFER_SIZE];
          int iBytesRead = oInflate.inflate(byRead);
          if (iBytesRead == byRead.length){
            oZipStream.write(byRead);
          }
          else {
            oZipStream.write(byRead, 0, iBytesRead);
          }
        }
        byReturn = oZipStream.toByteArray();
      }
      catch (DataFormatException ex){
        throw new IOException("Attempting to unzip file that is not zipped.");
      }
      finally {
        oZipStream.close();
      }
      return byReturn;
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
				System.err.println("In unzip, got file ["+fileName+"]\n");
			    byte[] buffer=new byte[1024];
			    String outString ="";
			    int len;
			    int tlen=0;
			    while ((len = zis.read(buffer,0,1024)) != -1){
			    	tlen+=len;
			    	byte [] subArray = Arrays.copyOfRange(buffer, 0, len);
			    	String str = new String(subArray, "UTF-8");
				    System.err.println("\n\nblock "+len+" :"+str+":");
			    	
			    	outString += str;
			    }
			    System.err.println("This is the full CSV file content");
			    System.err.write(outString.getBytes());
		    	Reader thisReader = new StringReader(outString);
			    System.err.println("\nEND OF CSV");
			    
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

    public void runDumper() {
        // get the tables out of the hibernate.cfg.xml.
        // you can presumably do that via hibernate itself but I couldn't work out how to do that

        for (String resourceFile : hibernateConfig.resources) {
            // load the specific table
            System.out.println("Dumping "+resourceFile+"...\n");       
            DumpTable(resourceFile);
            System.out.println("Done "+resourceFile+"\n");       
        }   
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
    
    private HibernateConfig ReadConfig() 
    {
        // reads the config to get the list of mapping (resource) files
        SAXParserFactory spf;
        HibernateConfig hibernateConfig=new HibernateConfig();
        try{
            spf = SAXParserFactory.newInstance();   
            spf.setNamespaceAware(true);
            SAXParser saxParser = spf.newSAXParser();
            XMLReader xmlReader = saxParser.getXMLReader();
            xmlReader.setContentHandler(hibernateConfig);
            xmlReader.parse(hibernateConfigDirectory+"/hibernate.cfg.xml");
        } catch (SAXException ex) {
            System.err.println(ex);       
        } catch (IOException ex) {
            System.err.println(ex);               
        } catch (ParserConfigurationException ex) {
            System.err.println(ex);                       
        }
        for (String resourceFile : hibernateConfig.resources) {
            // load the specific table
            System.out.println("READCONFIG "+resourceFile+"...\n"); 
            TableMap tableMap = ReadTableMap(resourceFile);
            hibernateConfig.tableMaps.put(tableMap.className, tableMap);
        }   
        System.out.println("HIBERNATE CONECTION STUFF :"+hibernateConfig.properties.get("hibernate.connection.url")+":\n");       

       
        return hibernateConfig;
    }
      
    private TableMap ReadTableMap(String resourceFile) 
    {
        // populates a hash of the field names, and also initialises "className" and "tableName" strings
        SAXParserFactory spf;
        TableMap tableMap=new TableMap();
        try{
            spf = SAXParserFactory.newInstance();   
            spf.setNamespaceAware(true);
            SAXParser saxParser = spf.newSAXParser();
            XMLReader xmlReader = saxParser.getXMLReader();
            xmlReader.setContentHandler(tableMap);
            xmlReader.parse(hibernateConfigDirectory+"/"+resourceFile);
        } catch (SAXException ex) {
            System.err.println(ex);       
        } catch (IOException ex) {
            System.err.println(ex);               
        } catch (ParserConfigurationException ex) {
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
             TableMap tableMap = ReadTableMap(resourceFile);
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
                         System.err.println("table :"+tableName+": field :"+hibernateFieldName+": length="+csvFieldValue.length()+ " value :"+csvFieldValue+":");
                     }
                     System.err.println("Record done");
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

     public boolean DumpTable(String resourceFile){
         // the resource file is the <table>.hbm.xml
         // read it to get the field names, for which we can make up a hashtable
         // all the table handlers have a constructor which takes a hash of <string,string>
         // and will map them accordingly (e.g. using Integer.parseInt and catching the parse exception if need be
             TableMap tableMap = ReadTableMap(resourceFile);
             Enumeration ekeys = tableMap.map.keys();
             Set <String> keys = tableMap.map.keySet();
//             String[] keyArray = keys.toArray(new String[0]);
             String[] fieldOrder = tableMap.cvsFieldOrder.toArray(new String[0]);
            
             String className=tableMap.className;
             String tableName=tableMap.tableName;

             Session session = factory.openSession();
             try {
                 Object entities[]=session.createCriteria(className).list().toArray();
                
                 CsvWriter csvWriter = new CsvWriter(dataDirectory+tableName+".txt");
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
                
             } catch ( FileNotFoundException ex) {
                 System.err.println("Failed to get csv file for "+tableName+" :" + ex);       
             }  catch ( IOException ex) {
                 System.err.println("Failed reading csv file for "+tableName+" :" + ex);       
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
             TableMap tableMap = ReadTableMap(resourceFile);
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
     System.err.println("start insert class="+className+"\n");
     for (String key : record.keySet()){
         System.err.println("record("+key+")="+record.get(key));    	 
     }
 
     try{
         Object hibernateRecord = (Object) Class.forName(className).getConstructor(Hashtable.class).newInstance(record);           
         recordId = (Integer) session.save(hibernateRecord);
         System.err.println("done an insert\n");
      }catch (HibernateException|
              ClassNotFoundException|
              InvocationTargetException|
              NoSuchMethodException|
              IllegalAccessException|
              InstantiationException e) {
          if (tx!=null) tx.rollback();
          e.printStackTrace();
      }
     System.err.println("ready return\n");
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

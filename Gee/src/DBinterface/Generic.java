package DBinterface;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.File;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Set;

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
    public Transaction tx = null;
    public Session session = null;

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
    
    public void runLoader() {
        // get the tables out of the hibernate.cfg.xml.
        // you can presumably do that via hibernate itself but I couldn't work out how to do that

        for (String resourceFile : hibernateConfig.resources) {
            // load the specific table
            System.out.println("Loading "+resourceFile+"...\n");       
            LoadTable(resourceFile);
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
         configuration.setProperty("hibernate.connection.url", "jdbc:mysql://localhost/"+ databaseName);
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
     public boolean LoadTable(String resourceFile){
         // the resource file is the <table>.hbm.xml
         // read it to get the field names, for which we can make up a hashtable
         // all the table handlers have a constructor which takes a hash of <string,string>
         // and will map them accordingly (e.g. using Integer.parseInt and catching the parse exception if need be
             TableMap tableMap = ReadTableMap(resourceFile);
             Enumeration ekeys = tableMap.map.keys();
             Set <String> keys = tableMap.map.keySet();
             String className=tableMap.className;
             String tableName=tableMap.tableName;
             session = factory.openSession();
             tx = session.beginTransaction();
            
             try {
                 CsvReader csvReader = new CsvReader(dataDirectory+tableName+".txt");
                 csvReader.readHeaders();
                 while (csvReader.readRecord()) {
                     Hashtable<String,String> record = new Hashtable<String,String>();
                    
                     for (String databaseFieldName : keys) {
                         String hibernateFieldName=tableMap.map.get(databaseFieldName);
                         record.put(hibernateFieldName, csvReader.get(databaseFieldName));
                     }
                     createRecordInner(className,record);
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
             tx = session.beginTransaction();

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
     session = factory.openSession();
     tx = session.beginTransaction();
     recordId=createRecordInner(className,record);
     tx.commit();
     session.close();
     return recordId;
 }
 // hived this into an inner method so we can do mass inserts on one session, and not commit every line else it takes yonks
 // we dont really need to bother doing this for update,
 // but if we are going to allow "zap database" then delete could do with the same
 public int createRecordInner(String className,Hashtable <String,String> record){
     Integer recordId = null;
     System.err.println("start insert class="+className+"\n");

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

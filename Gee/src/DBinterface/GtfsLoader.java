package DBinterface;
import java.util.Hashtable;
import java.util.List;
import tables.*;

import java.util.*; 
import java.io.*;
import java.lang.reflect.*;
 
import org.hibernate.HibernateException; 
import org.hibernate.Session; 
import org.hibernate.Transaction;
import org.hibernate.SessionFactory;
import org.hibernate.service.*;
import org.hibernate.cfg.Configuration;

import javax.xml.parsers.*;
import org.xml.sax.*;
import org.xml.sax.helpers.*; 
import sax.*;

import com.csvreader.CsvReader;
import com.csvreader.CsvWriter;



public class GtfsLoader {
	public static SessionFactory factory; 
	private static SessionFactory sessionFactory;
	private static ServiceRegistry serviceRegistry;
	public static HibernateConfig hibernateConfig;
	public static String dataDirectory="/home/Gee/gtfs/";
	public static String hibernateConfigDirectory="";//"/home/Gee/config/";
	
	
	
	public GtfsLoader(){
		try{
			factory = configureSessionFactory();
		} catch (Throwable ex) { 
			System.err.println("Failed to create sessionFactory object." + ex);
			throw new ExceptionInInitializerError(ex); 
		}	
		hibernateConfig = ReadConfig();
	}

	public static void runLoader() {
		// get the tables out of the hibernate.cfg.xml. 
		// you can presumably do that via hibernate itself but I couldn't work out how to do that

		for (String resourceFile : hibernateConfig.resources) {
			// load the specific table
			System.out.println("Loading "+resourceFile+"...\n");		
			LoadTable(resourceFile);
			System.out.println("Done "+resourceFile+"\n");		
		}	
	}

	public static void runDumper() {
		// get the tables out of the hibernate.cfg.xml. 
		// you can presumably do that via hibernate itself but I couldn't work out how to do that

		for (String resourceFile : hibernateConfig.resources) {
			// load the specific table
			System.out.println("Dumping "+resourceFile+"...\n");		
			DumpTable(resourceFile);
			System.out.println("Done "+resourceFile+"\n");		
		}	
	}
// TODO refactor this to use the classNames from the keys of tableMaps
	public static boolean LoadTable(String resourceFile){
		// the resource file is the <table>.hbm.xml
		// read it to get the field names, for which we can make up a hashtable
		// all the table handlers have a constructor which takes a hash of <string,string>
		// and will map them accordingly (e.g. using Integer.parseInt and catching the parse exception if need be 
			TableMap tableMap = ReadTableMap(resourceFile);
			Enumeration ekeys = tableMap.map.keys();
			Set <String> keys = tableMap.map.keySet();
			String className=tableMap.className;
			String tableName=tableMap.tableName;
			
			try {
				CsvReader csvReader = new CsvReader(dataDirectory+tableName+".txt");
				csvReader.readHeaders();
				while (csvReader.readRecord()) {
					Hashtable<String,String> record = new Hashtable<String,String>();
					
					for (String databaseFieldName : keys) {
						String hibernateFieldName=tableMap.map.get(databaseFieldName);
						record.put(hibernateFieldName, csvReader.get(databaseFieldName));
					}
					createRecord(className,record);
				}
				
			} catch ( FileNotFoundException ex) {
				System.err.println("Failed to get csv file for "+tableName+" :" + ex);		
			}  catch ( IOException ex) {
				System.err.println("Failed reading csv file for "+tableName+" :" + ex);		
			}
			
			return true;
		}

	public static boolean DumpTable(String resourceFile){
		// the resource file is the <table>.hbm.xml
		// read it to get the field names, for which we can make up a hashtable
		// all the table handlers have a constructor which takes a hash of <string,string>
		// and will map them accordingly (e.g. using Integer.parseInt and catching the parse exception if need be 
			TableMap tableMap = ReadTableMap(resourceFile);
			Enumeration ekeys = tableMap.map.keys();
			Set <String> keys = tableMap.map.keySet();
//			String[] keyArray = keys.toArray(new String[0]);
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

public static int createRecord(String className,Hashtable <String,String> record){
//	className = "tables."+className;
	Session session = factory.openSession();
    Transaction tx = null;
    Integer recordId = null;
    try{
       tx = session.beginTransaction();
	   Object hibernateRecord = (Object) Class.forName(className).getConstructor(Hashtable.class).newInstance(record);		    
       recordId = (Integer) session.save(hibernateRecord); 
       tx.commit();
    }catch (HibernateException|
    		ClassNotFoundException|
    		InvocationTargetException|
    		NoSuchMethodException|
    		IllegalAccessException|
    		InstantiationException e) {
        if (tx!=null) tx.rollback();
        e.printStackTrace(); 
    }finally {
       session.close(); 
    }
    return recordId;
}

public static int updateRecord(String entityName,Hashtable <String,String> inputRecord){
//	entityName = "tables."+entityName;
	int hibernateId = Integer.parseInt(inputRecord.get("hibernateId"));
	Session session = factory.openSession();
    Integer recordId = -1;

    try {
    	Class<?> cls = Class.forName(entityName);
		Method m = cls.getMethod("update", inputRecord.getClass());
		Transaction tx = session.beginTransaction();
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


/* Method to DELETE an employee from the records */
public static int deleteRecord(String className,Hashtable <String,String> record){
//	className = "tables."+className;
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

private static TableMap ReadTableMap(String resourceFile)  
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
	    xmlReader.parse(hibernateConfigDirectory+resourceFile);
	} catch (SAXException ex) {
		System.err.println(ex);		
	} catch (IOException ex) {
		System.err.println(ex);				
	} catch (ParserConfigurationException ex) {
		System.err.println(ex);						
	}
    
    return tableMap;
}
   
private static HibernateConfig ReadConfig()  
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
	    xmlReader.parse(hibernateConfigDirectory+"hibernate.cfg.xml");
	} catch (SAXException ex) {
		System.err.println(ex);		
	} catch (IOException ex) {
		System.err.println(ex);				
	} catch (ParserConfigurationException ex) {
		System.err.println(ex);						
	}
	for (String resourceFile : hibernateConfig.resources) {
		// load the specific table
		TableMap tableMap = ReadTableMap(resourceFile);
		hibernateConfig.tableMaps.put(tableMap.className, tableMap);
	}	
    
    return hibernateConfig;
}
   
public static SessionFactory configureSessionFactory() throws HibernateException {
	Configuration configuration = new Configuration();    
 	configuration.configure(/* "/home/Gee/config/hibernate.cfg.xml" */);
	serviceRegistry = new ServiceRegistryBuilder().
			applySettings(configuration.getProperties()).
			buildServiceRegistry();        
	sessionFactory = configuration.buildSessionFactory(serviceRegistry);
	return sessionFactory;
}
   
}// end class
  
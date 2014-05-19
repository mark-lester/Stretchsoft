package DBinterface;
import java.util.Hashtable;
import java.util.List;
import tables.*;

import java.util.*;
import java.io.*;
import java.lang.reflect.*;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;
 
import javax.net.ssl.HttpsURLConnection;

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
import tables.*;


import com.csvreader.CsvReader;
import com.csvreader.CsvWriter;

import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicNameValuePair;



public class GtfsLoader {
    public SessionFactory factory;
    private SessionFactory sessionFactory;
    private ServiceRegistry serviceRegistry;
    public HibernateConfig hibernateConfig;
    public String dataDirectory="/home/Gee/gtfs/";
    public String hibernateConfigDirectory="";//"/home/Gee/config/";
    public Transaction tx = null;
    public Session session = null;

   
    public GtfsLoader(){
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
   
    public void StopsImport(String north, String south, String east, String west, String stop_type) {
        String url = "http://overpass-api.de/api/interpreter";
        URL obj=null;
        try {
            obj = new URL(url);
        } catch (MalformedURLException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        HttpURLConnection con=null;
        try {
            con = (HttpURLConnection) obj.openConnection();
        } catch (IOException e1) {
            // TODO Auto-generated catch block
            e1.printStackTrace();
        }
        //add reuqest header
        try {
            con.setRequestMethod("POST");
        } catch (ProtocolException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        con.setRequestProperty("User-Agent", "Mozilla/5.0");
        con.setRequestProperty("Accept-Language", "en-US,en;q=0.5");
         
        String query="<query type=\"node\">"+
  "<has-kv k=\"railway\" v=\""+stop_type+"\"/>"+
  "<bbox-query"+
  " n=\""+north+"\""+
  " s=\""+south+"\""+
  " e=\""+east+"\""+
  " w=\""+west+"\""+
  "/>"+
"</query>"+
"<print/>";
        System.err.println("\nSending 'POST' request to URL : " + url);
        System.err.println("Post parameters : " + query);
       
        // Send post request
        con.setDoOutput(true);
        DataOutputStream wr;
        int responseCode=-1;
        try {
            wr = new DataOutputStream(con.getOutputStream());
            wr.writeBytes(query);
            wr.flush();
            wr.close();
            responseCode = con.getResponseCode();
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        System.err.println("Response Code : " + responseCode);
        SAXParserFactory spf;
        OSMStops osmStops=new OSMStops();

        try{
            spf = SAXParserFactory.newInstance();   
            spf.setNamespaceAware(true);
            SAXParser saxParser = spf.newSAXParser();
            XMLReader xmlReader = saxParser.getXMLReader();
            xmlReader.setContentHandler(osmStops);
            xmlReader.parse(new InputSource(con.getInputStream()));
        } catch (SAXException ex) {
            System.err.println(ex);       
        } catch (IOException ex) {
            System.err.println(ex);               
        } catch (ParserConfigurationException ex) {
            System.err.println(ex);                       
        }
        for (Hashtable <String,String> record : osmStops.records){
            System.err.println(
                    " node_id="+record.get("id")+
                    " stopLat="+record.get("lat")+
                    " stopLon="+record.get("lon")+
                    " stopName="+record.get("name")
                    );
            UpdateImportedStop(record);
        }
    }
   
    public boolean UpdateImportedStop(Hashtable <String,String> osmRecord){
        // should be called UpdateOrCreate..
        session = factory.openSession();
        tx = session.beginTransaction();
	
		String query ="FROM ImportedStops WHERE osmNodeId="+osmRecord.get("node_id");
//		ImportedStops importedStop[] = (ImportedStops [])session.createQuery(query).list().toArray();
		Object importedStop[] = session.createQuery(query).list().toArray();
		if (importedStop.length > 0) { // assertion, should either be 0 or 1
			// update
			ImportedStops i = (ImportedStops)importedStop.clone()[0];
			Stops stopRecord = (Stops)session.get(Stops.class,i.getstopsHibernateId());
			stopRecord.setstopLat(Float.parseFloat(osmRecord.get("lat")));
			stopRecord.setstopLon(Float.parseFloat(osmRecord.get("lon")));
			stopRecord.setstopName(osmRecord.get("name"));
			if (osmRecord.containsKey("ref")) {
				stopRecord.setstopId(osmRecord.get("ref"));
			} else {
				stopRecord.setstopId(osmRecord.get("name"));				
			}
	        session.save(stopRecord);
		} else {
			// create
		    try{
		        Stops stopRecord = new Stops();           
				stopRecord.setstopLat(Float.parseFloat(osmRecord.get("lat")));
				stopRecord.setstopLon(Float.parseFloat(osmRecord.get("lon")));
				stopRecord.setstopName(osmRecord.get("name"));	
				if (osmRecord.containsKey("ref")) {
					stopRecord.setstopId(osmRecord.get("ref"));
				} else {
					stopRecord.setstopId(osmRecord.get("name"));				
				}
				Object Stops[] = session.createQuery("FROM Stops where stopId ='"+stopRecord.getstopId()+"'").list().toArray();
				if (Stops.length!=0){
					return false;
				}
				
		        Integer hibernateId = (Integer) session.save(stopRecord);
		        
		        ImportedStops importedStopRecord = new ImportedStops();
		        importedStopRecord.setstopsHibernateId(hibernateId);
		        importedStopRecord.setosmNodeId(osmRecord.get("id"));
		        session.save(importedStopRecord);		        
		     }catch (HibernateException e) {
		         if (tx!=null) tx.rollback();
		         e.printStackTrace();
		     }
		
		}

        tx.commit();
        
        return true;
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
//            String[] keyArray = keys.toArray(new String[0]);
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
//    className = "tables."+className;
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
//    entityName = "tables."+entityName;
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


/* Method to DELETE an employee from the records */
public int deleteRecord(String className,Hashtable <String,String> record){
//    className = "tables."+className;
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
  
public SessionFactory configureSessionFactory() throws HibernateException {
    Configuration configuration = new Configuration();   
     configuration.configure(/* "/home/Gee/config/hibernate.cfg.xml" */);
    serviceRegistry = new ServiceRegistryBuilder().
            applySettings(configuration.getProperties()).
            buildServiceRegistry();       
    sessionFactory = configuration.buildSessionFactory(serviceRegistry);
    return sessionFactory;
}
  
}// end class
  
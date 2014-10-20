package DBinterface;
import java.util.Hashtable;
import tables.*;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;

import org.codehaus.jackson.map.ObjectMapper;
import org.hibernate.Session; 
import org.hibernate.Transaction;

import javax.xml.parsers.*;
import org.xml.sax.*;
import sax.*;

import org.hibernate.HibernateException;


public class Gtfs extends DBinterface {

	public Gtfs(String hibernateConfigDirectory,String databaseName,String userId){
		super(hibernateConfigDirectory,databaseName,userId);
	}
	public Gtfs(String hibernateConfigDirectory,String databaseName){
		super(hibernateConfigDirectory,databaseName);
	}
	
	public void ReplicateTrip(String sourceTripId,String targetTripId,String shiftMinutes){
	    System.err.println("doing a replication of "+sourceTripId+ " to "+targetTripId+ " mins "+shiftMinutes);
	       	
		ObjectMapper mapper = new ObjectMapper();
		String query="FROM Trips where tripId=\'"+sourceTripId+"\'";
		Session session = this.factory.openSession();
		Object entities[] = session.createQuery(query).list().toArray();
		session.close();
		tables.Trips trip = (tables.Trips) entities[0];
		trip.settripId(targetTripId);
		this.createRecord("tables.Trips",trip.hash());

		query="FROM StopTimes where tripId=\'"+sourceTripId+"\'";
		session = this.factory.openSession();
		entities = session.createQuery(query).list().toArray();
		session.close();
		for (Object o : entities){
			StopTimes s = (StopTimes)o;
			s.settripId(targetTripId);
			s.setarrivalTime(addShift(s.getarrivalTime(),shiftMinutes));
			s.setdepartureTime(addShift(s.getdepartureTime(),shiftMinutes));
			this.createRecord("tables.StopTimes",s.hash());
		}
	}
	
	public String addShift(String input,String shiftMinutes){
		String[] parts =input.split(":");
		int hours = Integer.parseInt(parts[0]);
		int minutes = Integer.parseInt(parts[1]);
		int shift_minutes = Integer.parseInt(shiftMinutes);
		minutes += shift_minutes;
		hours += minutes/60;
		minutes = minutes % 60;
		return String.format("%02d:%02d:00", hours,minutes);
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
        if (osmRecord.get("name") == null || osmRecord.get("name").length() == 0 ){
        	System.err.println("Node name not set");
        	return false;
        }
        Session session = factory.openSession();
        Transaction tx = session.beginTransaction();
		String query ="FROM ImportedStops WHERE osmNodeId="+osmRecord.get("id");
//		ImportedStops importedStop[] = (ImportedStops [])session.createQuery(query).list().toArray();
		Object importedStop[] = session.createQuery(query).list().toArray();
		if (importedStop.length > 0) { // assertion, should either be 0 or 1
			// update
			System.err.println("updating previously imported stop");
			ImportedStops i = (ImportedStops)importedStop.clone()[0];
			Stops stopRecord = (Stops)session.get(Stops.class,i.getstopsHibernateId());
			stopRecord.setstopLat(Float.parseFloat(osmRecord.get("lat")));
			stopRecord.setstopLon(Float.parseFloat(osmRecord.get("lon")));
			stopRecord.setstopName(osmRecord.get("name"));
			if (osmRecord.containsKey("ref")) {
				stopRecord.setstopId(osmRecord.get("ref"));
			} else {
				stopRecord.setstopId("node-"+osmRecord.get("id"));
			}
	        session.save(stopRecord);
		} else {
			// create
		    try{
				System.err.println("importing new stop");
		        Stops stopRecord = new Stops();           
				stopRecord.setstopLat(Float.parseFloat(osmRecord.get("lat")));
				stopRecord.setstopLon(Float.parseFloat(osmRecord.get("lon")));
				stopRecord.setstopName(osmRecord.get("name"));
				
				if (osmRecord.containsKey("ref")) {
					stopRecord.setstopId(osmRecord.get("ref"));
				} else {
					stopRecord.setstopId("node-"+osmRecord.get("id"));
				}

				Object Stops[] = session.createQuery("FROM Stops where stopId ='"+stopRecord.getstopId()+"'").list().toArray();
				if (Stops.length!=0){
					System.err.println("assertion failure, we seem to already have this stop but it's not in the imported table");
					session.close();
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
        session.close();
		System.err.println("finished import of stop");

        return true;
    }
}// end class
  
package DBinterface;
import java.util.Arrays;
import java.util.Collections;
import java.util.Iterator;
import java.util.Hashtable;
import java.util.ArrayList; 
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import tables.*;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;

import org.apache.commons.io.ByteOrderMark;
import org.apache.commons.io.input.BOMInputStream;
import org.codehaus.jackson.map.ObjectMapper;
import org.hibernate.AssertionFailure;
import org.hibernate.Session; 
import org.hibernate.Transaction;
import org.json.*;

import javax.xml.parsers.*;
import org.xml.sax.*;
import sax.*;

import org.hibernate.HibernateException;


public class Gtfs extends DBinterface {

	public Gtfs(String hibernateConfigDirectory,String databaseName,String userId,String serverName){
		super(hibernateConfigDirectory,databaseName,userId,serverName);
	}
	public Gtfs(String hibernateConfigDirectory,String databaseName,String userId){
		super(hibernateConfigDirectory,databaseName,userId);
	}
	public Gtfs(String hibernateConfigDirectory,String databaseName){
		super(hibernateConfigDirectory,databaseName);
	}
	
    public void runMakeShapes() throws IOException {
        Session session = factory.openSession();
        List<Object[]> rows=session.createQuery("from Trips t,Routes r "+
    				" WHERE t.routeId=r.routeId "+"" +
    						" AND r.routeType='3'").list();
        
    	
    	for (Object[] tu : rows){
			Trips t = (Trips)tu[0];
			System.err.println("want to import shape for "+t.gettripId());
			this.ShapeImport(t.gettripId());
    	}
    }

    public void runLoader(byte[] zipData, PrintWriter out) {
   	 // this is where you start, with an InputStream containing the bytes from the zip file
   	InputStream zipStream = new ByteArrayInputStream(zipData);
       ZipInputStream zis = new ZipInputStream(zipStream);
       ZipEntry entry;
       Hashtable <String,Reader> zipHash = new Hashtable <String,Reader>();
  
       try {
			while ((entry = zis.getNextEntry()) != null) {   
			    String fileName = entry.getName();
			    Pattern pattern = Pattern.compile("/(.*?)$");
			    Matcher matcher = pattern.matcher(fileName);
			    if (matcher.find())			    {
			        fileName=matcher.group(1);
			    }

			    byte[] buffer=new byte[1024*32];
			    int len;
			    ByteArrayOutputStream unzipped = new ByteArrayOutputStream();
			    while ((len = zis.read(buffer,0,1024*32)) != -1){
			    	unzipped.write(Arrays.copyOfRange(buffer, 0, len));
			    }
			    
//		    	Reader thisReader = new StringReader(outString);
		    	InputStream is = new ByteArrayInputStream(unzipped.toByteArray());
		    	BOMInputStream bomIn = new BOMInputStream(is,
		    			ByteOrderMark.UTF_8, 
		    			ByteOrderMark.UTF_16BE, 
		    			ByteOrderMark.UTF_16LE, 
		    			ByteOrderMark.UTF_32BE, 
		    			ByteOrderMark.UTF_32LE);
		    	Reader thisReader = new InputStreamReader(bomIn);
		    	zipHash.put(fileName,thisReader);
		    	System.err.println("unzipped "+ fileName);
			}
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
       
       for (String resourceFile : hibernateConfig.resources) {
           // load the specific table
           System.err.println("Loading "+ resourceFile+"...\n");       
           out.println("Loading "+resourceFile+"...\n");
           try {
           	boolean success = LoadTable(resourceFile,zipHash,out);
           	if (success) load_success.put(resourceFile,"DONE");
           } catch (HibernateException|AssertionFailure e){
           	out.println("aborting import from "+resourceFile);
           }
           System.err.println("Done "+resourceFile+"\n");       
           out.println("Done "+resourceFile+"\n");       
       }   
   }
   
   
   public void runZapper() {
       // get the tables out of the hibernate.cfg.xml.
       // you can presumably do that via hibernate itself but I couldn't work out how to do that
   	
   	List<String> reverse = new ArrayList<String>(hibernateConfig.resources);
   	Collections.reverse(reverse);
       for (String resourceFile : reverse) {
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
//           DumpTable(resourceFile,zipFile,csvWriter);
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
   


	
	public void ReplicateTrip(String sourceTripId,String targetTripId,String shiftMinutes,String invertFlag){
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
		query += " order by stop_sequence";			
		session = this.factory.openSession();
		entities = session.createQuery(query).list().toArray();
		ArrayList <String> arrival_times = new ArrayList<String>();
		ArrayList <String> departure_times = new ArrayList<String>();
		
		session.close();
		for (Object o : entities){
			StopTimes s = (StopTimes)o;
			s.settripId(targetTripId);
			s.setarrivalTime(addShift(s.getarrivalTime(),shiftMinutes));			
			s.setdepartureTime(addShift(s.getdepartureTime(),shiftMinutes));
			arrival_times.add(s.getarrivalTime());
			departure_times.add(s.getdepartureTime());
			this.createRecord("tables.StopTimes",s.hash());
		}
		
		if (invertFlag.matches("invert")){
			query="FROM StopTimes where tripId=\'"+targetTripId+"\'";
			query += " order by stop_sequence desc";			
			session = this.factory.openSession();
			entities = session.createQuery(query).list().toArray();
			session.close();
			boolean first=true;
			String arrival_time=null;
			String departure_time=null;
			String last_departure_time=null;
			int stopSequence=1;
			int time_to_travel;
			int time_to_wait;
			for (Object o : entities){
				StopTimes s = (StopTimes)o;
				if (!first){
					time_to_travel=timeDiff(
							departure_times.get(departure_times.size()-2),
							arrival_times.get(arrival_times.size()-1));
					
					arrival_time=addShift(last_departure_time,Integer.toString(time_to_travel));
					time_to_wait=timeDiff(
							departure_times.get(departure_times.size()-2),
							arrival_times.get(arrival_times.size()-2));
					last_departure_time=departure_time=addShift(arrival_time,Integer.toString(time_to_wait));
					
					s.setarrivalTime(arrival_time);
					s.setdepartureTime(departure_time);
					arrival_times.remove(arrival_times.size() - 1);
					departure_times.remove(departure_times.size() - 1);
				} else {
					s.setarrivalTime(arrival_times.get(0));
					s.setdepartureTime(departure_times.get(0));
					last_departure_time=departure_times.get(0);
					first=false;
				}
				s.setstopSequence(stopSequence++);
				// TODO fix the base method in GtfsBase to copy the hibernteId
				Hashtable <String,String> inputRecord=s.hash();
				inputRecord.put("hibernateId",Integer.toString(s.gethibernateId()));

				this.updateRecord("tables.StopTimes",inputRecord);
			}
		}
	}
	
	public String addShift(String input,String shiftMinutes){
		String[] parts =input.split(":");
		int hours = Integer.parseInt(parts[0]);
		int minutes = hours * 60 + Integer.parseInt(parts[1]);
		int shift_minutes = Integer.parseInt(shiftMinutes);
		minutes += shift_minutes;
		hours = minutes/60;
		minutes = minutes % 60;
		return String.format("%02d:%02d:00", hours,minutes);
	}

	public int timeDiff(String from,String to){
		String[] from_parts =from.split(":");
		String[] to_parts =to.split(":");
		int from_hours = Integer.parseInt(from_parts[0]);
		int from_minutes = Integer.parseInt(from_parts[1]);
		int to_hours = Integer.parseInt(to_parts[0]);
		int to_minutes = Integer.parseInt(to_parts[1]);
		return (to_hours * 60 + to_minutes) - (from_hours * 60 + from_minutes);
	}
	
	// zap any existing shape points
	// fetch stops in stop sequence order
	// do query for each splice
	// unpack geopoints
	// if no query results or geopoints, use the input start and end point, i.e. gen from stops
	// insert shape, careful with end points (dont put the first point in returned list unless first splice)
	

	public String ApproriateShape(String tripId){
		Trips target_trip=getTrip(tripId);
		ArrayList<String> targetV=GetSTVector(tripId);		
		String query="FROM Trips WHERE tripId!='"+tripId+"'"+
				" AND shapeId != ''" +
				" AND routeId='"+target_trip.getrouteId()+"'"+
				"  ORDER BY tripId";
		Session session = factory.openSession();
		Object entities[]=session.createQuery(query).list().toArray();
		session.close();
		System.err.println("Find match Query="+query+" returned"+entities.length);
		 for (Object record : entities) {
			 ArrayList<String> candidateV=GetSTVector(((Trips)record).gettripId() );
			 if (candidateV==null) continue;
			 if (targetV.size() != candidateV.size()) continue;
			 System.err.println("t[]="+targetV.size()+" c[]="+candidateV.size());
			 boolean fail=false;
			 for (int i = 0; i < targetV.size(); i++) {
				 if (!targetV.get(i).equals(candidateV.get(i))){
					 fail=true;
					 break;
				 }
		     }
			 if (!fail){
					query="FROM Shapes WHERE shapeId='"+((Trips)record).getshapeId()+"'";
					session = factory.openSession();
					entities=session.createQuery(query).list().toArray();
					session.close();
					if (entities.length<2){
						this.SetTripShapeId(((Trips)record).getshapeId(), "");
						// if there's only one point, remove it, 1 point shape files cause problems
						if (entities.length == 1){
							session.delete(((Shapes)entities[0]));							
						}
					} else {
						 return ((Trips)record).getshapeId();						
					}
			 }
		 }
	    
		return null;
	}
	
	public ArrayList<String> GetSTVector(String tripId){
		ArrayList<String> vector = new ArrayList<String>();
	String query="FROM StopTimes WHERE tripId='"+tripId+"' ORDER BY stopSequence";
	Session session = factory.openSession();
	Object entities[]=session.createQuery(query).list().toArray();
	session.close();
	 for (Object record : entities) {
		 vector.add( ((StopTimes)record).getstopId());
	 }
	return vector;
	}
	
	
	public Trips getTrip(String tripId){
		Trips t=null;
	    String query="FROM Trips WHERE tripId='"+tripId+"'"; 
		Session session = factory.openSession();
	    
		Object entities[]=session.createQuery(query).list().toArray();
		session.close();
		if (entities.length < 1){
			return null;
		}
		return (Trips)entities[0];
	}
	
	@SuppressWarnings("deprecation")
	public void ShapeImport(String tripId) throws IOException {
	    String shapeId=null;
		System.err.println("Importaing Shape for "+tripId);

	    if ((shapeId = ApproriateShape(tripId)) != null){
			System.err.println("Matching one  "+shapeId);
		    SetTripShapeId(tripId,shapeId);
		    return;
	    }
		Session session = factory.openSession();
	    Transaction tx = null;
	    shapeId=tripId;
	    // zap any existing shape points
	    // the shape id for a trips shape is === trip Id
	    String query="FROM Shapes WHERE shapeId='"+shapeId+"'"; 
	    
		 tx = session.beginTransaction();
	   	 try {
			 Object entities[]=session.createQuery(query).list().toArray();
			 for (Object record : entities) {
				 session.delete(record);
			}
	     } catch (SecurityException e) {
	             // TODO Auto-generated catch block
	         e.printStackTrace();
	     }
		 tx.commit();

			query="FROM StopTimes as t1,Stops as t2 "+
						" WHERE t1.tripId='"+tripId+"'"+
						" AND t1.stopId = t2.stopId"+
						" ORDER BY t1.stopSequence";
			Iterator StopsAndTimes = session.createQuery(query)
		            .list()
		            .iterator();

		float lastLat=-1;
		float lastLon=-1;
		float lastShapeLat=-1;
		float lastShapeLon=-1;
		int shapePtSequence=0;

	    while ( StopsAndTimes.hasNext() ) {
		    Object[] tuple = (Object[]) StopsAndTimes.next();

		    Hashtable<String,String> record = new Hashtable<String,String>();

		    Stops stop = (Stops) tuple[1];
			System.err.println(" Stop on trip Lat="+Float.toString(stop.getstopLat())+" for station="+stop.getstopName());
			if (lastLat == -1){  // first one, add it as the first shape point.  we might not get anything back from OTP
				record.put("shapePtLat",Float.toString(stop.getstopLat()));
	    		record.put("shapePtLon",Float.toString(stop.getstopLon()));
	    		record.put("shapeId",tripId); // shapeId == tripId
	    		record.put("shapePtSequence",Integer.toString(shapePtSequence++));
				this.createRecord("tables.Shapes",record);
	            lastShapeLat=stop.getstopLat();
	            lastShapeLon=stop.getstopLon();	            
			}
			
			if (lastLat != -1){
		        String url = "http://wikitimetable.com/";

		        url="http://www.wikitimetable.com/"+databaseName+"/otp/routers/default/plan?"+
		        		"fromPlace="+Float.toString(lastLat)+
		        		"%2C"+Float.toString(lastLon)+
		        		"&toPlace="+Float.toString(stop.getstopLat())+
		        		"%2C"+Float.toString(stop.getstopLon())+
		        		"&mode=CAR&maxWalkDistance=2000&arriveBy=false&wheelchair=false"+
		        		"&showIntermediateStops=false";
		        System.err.println("OTP URL="+url);
		        	
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
		        //add request header
		        try {
		            con.setRequestMethod("GET");
		        } catch (ProtocolException e) {
		            // TODO Auto-generated catch block
		            e.printStackTrace();
		        }
		        con.setRequestProperty("User-Agent", "Mozilla/5.0");
		        con.setRequestProperty("Accept-Language", "en-US,en;q=0.5");
		        con.setDoOutput(true);
		        String content="";
		        DataInputStream dis = new DataInputStream(con.getInputStream());
		            String inputLine;

		            while ((inputLine = dis.readLine()) != null) {
		            	content += inputLine;
		            }
		        JSONObject otpData;
		        String points_data=null;
				try {
					otpData = new JSONObject(content);
			        points_data= otpData
			        		.getJSONObject("plan")
			        		.getJSONArray("itineraries")
			        		.getJSONObject(0)
			        		.getJSONArray("legs")
			        		.getJSONObject(0)
			        		.getJSONObject("legGeometry")
			        		.getString("points");
		        	;
				} catch (JSONException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
		        List<GeoPoint> points=null;
		        if (points_data != null){
		        	points=GeoPoint.decodePolyline(points_data);
		        }
				
		        tx = session.beginTransaction();
		        lastShapeLat = -1;
		        lastShapeLon = -1;
		        if (points != null && !points.isEmpty()){  // we didnt get anything back from OTP, stick the end point in
		        	
		        	/*
		        	 * see below, this logic is now in routemap case in Mapdata.java
		        	 * 
		        	int modulus = points.size() /100; // we only want a max of about 100 per route
		        	if (modulus == 0) modulus++;
		        	int index=0;
		        	double dlat=0;
		        	double dlon=0;
		        	double total_distance=0;
		        	GeoPoint first_point = points.get(0);
		        	GeoPoint last_point = points.get(points.size()-1);
		        	dlat = first_point.Lat - last_point.Lat; 
		        	dlon = first_point.Lon - last_point.Lon;
		        	total_distance=Math.sqrt(dlat*dlat + dlon*dlon);
		        	System.err.println("Total distance for this trip "+total_distance+ 
		        			" count="+points.size()+
		        			" modulus="+modulus);
		        	*/
		        	for (GeoPoint point : points){
		        		/*
		        		 * moved this logic to the routmap printer
		        		 * for now we'll have everything OSM throws at us for shape files
		        		if (lastShapeLat != -1){
				        	dlat = lastShapeLat - point.Lat; 
				        	dlon = lastShapeLon - point.Lon;
				        	double this_distance=Math.sqrt(dlat*dlat + dlon*dlon);
				        	// if we've moved less than 0.1% of the total, skip and
				        	// and don't even count as one of the 100 points
				        	if (total_distance/this_distance < 1000){
				        		continue;
				        	}
		        		}
			        	
		        		//  thin out to about 100 points 
		        		if ((index++ % modulus) != 0){
		        			continue;
		        		}
		        		*/
			        	if (point.Lat != lastShapeLat && point.Lon != lastShapeLon){
			        	    record = new Hashtable<String,String>();
			        		record.put("shapePtLat",Float.toString(point.Lat));
			        		record.put("shapePtLon",Float.toString(point.Lon));
			        		record.put("shapeId",tripId); // shapeId == tripId
			        		record.put("shapePtSequence",Integer.toString(shapePtSequence++));
							this.createRecordInner(session,tx,"tables.Shapes",record);
			        	}
			            lastShapeLat=point.Lat;
			            lastShapeLon=point.Lon;	            
			        }
		        }
		        tx.commit();
				record.put("shapePtLat",Float.toString(stop.getstopLat()));
	    		record.put("shapePtLon",Float.toString(stop.getstopLon()));
	    		record.put("shapeId",tripId); // shapeId == tripId
	    		record.put("shapePtSequence",Integer.toString(shapePtSequence++));
				this.createRecord("tables.Shapes",record);	
	            lastShapeLat=stop.getstopLat();
	            lastShapeLon=stop.getstopLon();	            
			}
			lastLat=stop.getstopLat();
			lastLon=stop.getstopLon();			
		}		
	    session.close();
	    SetTripShapeId(tripId,shapeId);
}

	void SetTripShapeId(String tripId,String shapeId){
		Session session = factory.openSession();
	    Transaction tx = null;

		String query="FROM Trips where tripId='"+tripId+"'";
		Object trips[] = session.createQuery(query)
	            .list()
	            .toArray();
	      
		if (trips.length > 0){
	        tx = session.beginTransaction();
		    Trips trip = (Trips) trips[0];
		    trip.setshapeId(shapeId);
		    tx.commit();
	    }
		session.close();
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
        //add request header
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
  
package rest;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.PreparedStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.Hashtable;
import java.util.Iterator;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse; 
import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;
import org.hibernate.*;
import org.hibernate.criterion.*;
import DBinterface.*;
import sax.GeoPoint;
import tables.*;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.service.jdbc.connections.spi.ConnectionProvider;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.vividsolutions.jts.geom.Coordinate;

import com.google.gson.JsonObject;
import com.restfb.json.JsonException;

import antlr.collections.List;


/**
 * Servlet implementation class Mapdata
 * 
 * TODO this one should really be called "Stuff" as it's just 
 * the few things I need that dont fit into Entity.java without 
 * totally messing it up. 
 * I believe that judicious use of Hibernate should render this
 * file obsolete.
 */
@WebServlet("/Mapdata")
public class Mapdata extends Rest {
	private static final long serialVersionUID = 2L;

    /**
     * @see HttpServlet#HttpServlet()
     */
    public Mapdata() {
        super();
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
   
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		Session session = null;
		String userId = getUserId(request,response);
		if (userId == null){
			System.err.print("Failed to get access in Mapdata\n"); 
			
			return; // your cookie doesnt add up
		}

		response.setContentType("text/html");
		ObjectMapper mapper = new ObjectMapper();
		MapCoords mapCoords = new MapCoords();
		Criteria criteria;
		String action=request.getParameter("action");
		if (action == null){
			action="bounds";
		}
		String query=null;
		Object entities[];
		
		switch (action){
		case "heal":
		case "add_shape_point_after":
		case "delete_shape_point":
			if (!admin.verifyWriteAccess(databaseName,userId)){
				Print404(response,"You do not have write permission for this database");
				System.err.print("Access Violation on <Instance> For "+userId+" database="+databaseName+"\n"); 
				return;
			}
			break;
			
		default:
			if (!admin.verifyReadAccess(databaseName,userId)){
				Print404(response,"You do not have read permission for this database");
				System.err.print("Access Violation on <Instance> For "+userId+" database="+databaseName+"\n"); 
				return;
			}
		}

		switch (action){
		case "bounds":
				session = gtfs.factory.openSession();

				criteria = session
					.createCriteria(Stops.class)
					.setProjection(Projections.max("stopLat"));
				mapCoords.maxLat = (Float)criteria.uniqueResult();
					
				criteria = session
						.createCriteria(Stops.class)
						.setProjection(Projections.min("stopLat"));
				mapCoords.minLat = (Float)criteria.uniqueResult();

				criteria = session
						.createCriteria(Stops.class)
						.setProjection(Projections.max("stopLon"));
				mapCoords.maxLon = (Float)criteria.uniqueResult();

				criteria = session
						.createCriteria(Stops.class)
						.setProjection(Projections.min("stopLon"));
				mapCoords.minLon = (Float)criteria.uniqueResult();
						
				session.close();
				try {
					PrintWriter out = response.getWriter();
					out.println(mapper.writeValueAsString(mapCoords));
				} catch (JsonGenerationException e) {
					e.printStackTrace();
				} catch (JsonMappingException e) {
					e.printStackTrace();
				} catch (IOException e) {
					e.printStackTrace();	 
				}
		break;
		// end case "bounds"
		
		case "select_set_size":
			int max_select_size=Integer.parseInt(request.getParameter("max_select_size"));
			float lat_min=Float.parseFloat(request.getParameter("lat_min"));
			float lat_max=Float.parseFloat(request.getParameter("lat_max"));
			float lon_min=Float.parseFloat(request.getParameter("lon_min"));
			float lon_max=Float.parseFloat(request.getParameter("lon_max"));
			float bounds_lat_min=Float.parseFloat(request.getParameter("bounds_lat_min"));
			float bounds_lat_max=Float.parseFloat(request.getParameter("bounds_lat_max"));
			float bounds_lon_min=Float.parseFloat(request.getParameter("bounds_lon_min"));
			float bounds_lon_max=Float.parseFloat(request.getParameter("bounds_lon_max"));
			float cand_lat_min=lat_min;
			float cand_lat_max=lat_max;
			float cand_lon_min=lon_min;
			float cand_lon_max=lon_max;
			long cand_result=0;
			long select_set_size=-1;
			boolean full_set=false;
			session = gtfs.factory.openSession();
			int loop_count=0;
			while (loop_count++ < 10){ // defensive, shouldnt happen
				query="select count(*) from tables."+request.getParameter("entity")+
						" where "+
						request.getParameter("lat_name")+" >= \'"+cand_lat_min+"\' AND "+
						request.getParameter("lon_name")+" >= \'"+cand_lon_min+"\' AND "+
						request.getParameter("lat_name")+" <= \'"+cand_lat_max+"\' AND "+
						request.getParameter("lon_name")+" <= \'"+cand_lon_max+"\'";
				//entities = session.createQuery(query).list().toArray();
				cand_result=( (Long) session.createQuery(query).iterate().next() ).longValue();
				if (cand_result > max_select_size){
					if (select_set_size == -1){
						// first time round and we still failed
						// but set the select_set_size, the client will decide what to do
						select_set_size=cand_result;
					}
					break;
				}
				// so all good, save these select values to return to the client
				lat_min=cand_lat_min;
				lat_max=cand_lat_max;
				lon_min=cand_lon_min;
				lon_max=cand_lon_max;
				select_set_size=cand_result;
				
				if (
						cand_lat_min <= bounds_lat_min &&
						cand_lon_min <= bounds_lon_min &&
						cand_lat_max >= bounds_lat_max &&
						cand_lon_max >= bounds_lon_max){
					//  we are already greater than the GTFS area, so quit now
					full_set=true;
					break;
				}
				// increase the select area by half again, and loop round
				float lat_delta=(cand_lat_max-cand_lat_min)/4;
				float lon_delta=(cand_lon_max-cand_lon_min)/4;
				cand_lat_max+=lat_delta;
				cand_lat_min-=lat_delta;
				cand_lon_max+=lon_delta;
				cand_lon_min-=lon_delta;				
			}
			session.close();
			// create a dataset
			JSONObject dataset = new JSONObject();
	        // return the dimennsions we ended up with
	        // so we can perform a full query using those dimensions
	        // and stil not break the limit (prob around 200)
	        try {
				dataset.put("lat_min", lat_min);
				dataset.put("lat_max", lat_max);
				dataset.put("lon_min", lon_min);
				dataset.put("lon_max", lon_max);
	        
	        // select_set_size will be aty least the number in the current map view
	        // that might be too much, but the client will decide what to do
				dataset.put("select_set_size", select_set_size);
	        // this will be true if we have all of them
				dataset.put("full_set", full_set);
				PrintWriter out = response.getWriter();
				out.print(dataset);
			} catch (JSONException e) {
				e.printStackTrace();
			} catch (IOException e) {
				e.printStackTrace();	 
			}
			
		break;	
		// select * from stops where stops.stop_name like '%q%' order by instr(stop_name,'q'),stop_name;
		case "geocode":
			String geo_name=request.getParameter("geo_name");
			String geo_string=request.getParameter("geo_string");
			
			query="from tables."+request.getParameter("entity")+
				" where "+
				geo_name+" like \'%"+geo_string+"%\' "+
				"order by instr("+geo_name+",'"+geo_string+"'),"+geo_name;
			System.err.print("Want mapdata query for "+query+"\n"); 

			session = gtfs.factory.openSession();
			entities = session.createQuery(query).list().toArray();
			session.close();
			try {
				PrintWriter out = response.getWriter();
				out.println(mapper.writeValueAsString(entities));
			} catch (JsonGenerationException e) {
				e.printStackTrace();
			} catch (JsonMappingException e) {
				e.printStackTrace();
			} catch (IOException e) {
				e.printStackTrace();	 
			}
			
		break;	
		// end case "set_size"
			
			
		// this should definitely be a view of some kind
		case "stops":
			String tripId=request.getParameter("tripId");
			query="select t1.stopLat, t1.stopLon, t1.stopId, t2.arrivalTime, t2.departureTime"+
					" from tables.Stops t1,tables.StopTimes t2"+
					" where t1.stopId=t2.stopId and t2.tripId='"+tripId+"' "+
					" order by t2.stopSequence";
			System.err.print("Mapdata Want query for "+query+"\n"); 

			session = gtfs.factory.openSession();
			entities = session.createQuery(query).list().toArray();
			session.close();
			try {
				PrintWriter out = response.getWriter();
				out.println(mapper.writeValueAsString(entities));
			} catch (JsonGenerationException e) {
				e.printStackTrace();
			} catch (JsonMappingException e) {
				e.printStackTrace();
			} catch (IOException e) {
				e.printStackTrace();	 
			}
		break;
		
		/* 
		 * stopSequence can be derived from the arrival/departure times
		 * */
		case "heal":
			tripId=request.getParameter("tripId");
			query="from StopTimes where tripId='"+tripId+"' order by departureTime";
			System.err.print("Mapdata Want query for "+query+"\n"); 

			session = gtfs.factory.openSession();
			Object objects[] = session.createQuery(query).list().toArray();
			StopTimes[] stoptimes = Arrays.copyOf(objects, objects.length, StopTimes[].class);
			int stopSequence=1;
			Arrays.sort(stoptimes);

			for (StopTimes rec :stoptimes){
				Transaction tx = session.beginTransaction();
				// this is the signal to say insert after this sequence
				// the sorting should have put it after the same one of that sequence number
				if (rec.getarrivalTime().matches("00:00:00")){
					rec.setarrivalTime("");
				}
				if (rec.getdepartureTime().matches("00:00:00")){
					rec.setdepartureTime("");
				}
				rec.setstopSequence(stopSequence++);
			    tx.commit();
			}
			session.close();
			
			try {
				PrintWriter out = response.getWriter();
				out.println(mapper.writeValueAsString(stoptimes));
			} catch (JsonGenerationException e) {
				e.printStackTrace();
			} catch (JsonMappingException e) {
				e.printStackTrace();
			} catch (IOException e) {
				e.printStackTrace();	 
			}
			
			break;

			//  List of trips servicing a given stop
		case "trips":
			String stopId=request.getParameter("stopId");
			
			query="from tables.StopTimes t1,tables.Trips t2" +
					" where t1.stopId ='"+stopId+"' "+
			        " and t2.tripId=t1.tripId"+
					" order by t1.arrivalTime";
			System.err.print("Mapdata Want query for "+query+"\n"); 

			session = gtfs.factory.openSession();
			Object tripIds[] = session.createQuery(query).list().toArray();
			
			try {
				PrintWriter out = response.getWriter();
				out.println(mapper.writeValueAsString(tripIds));
			} catch (JsonGenerationException e) {
				e.printStackTrace();
			} catch (JsonMappingException e) {
				e.printStackTrace();
			} catch (IOException e) {
				e.printStackTrace();	 
			}
			
			break;
		/*	
			{ "type": "Feature",
		        "geometry": {
		          "type": "LineString",
		          "coordinates": [
		            [Shape.shapePtLat, Shape.shapePtLat], ...
		            ]
		          },
		        "properties": {
		          "name": routeName,
		          "tripIds": [ [tripId,...]]
		          }
		        },
		        
			   create GeoJson object
		foreach unique shapeId
		       foreach Trip for this shapeId
		       	  add to properties-tripIds
		       foreach point in shape
		       	  add to geometry-coordinates
		       	   
		  */     
		case "routemap":
			int rindex=0;
			response.setContentType("application/json");
			query="Select shapeId from Shapes" +
					" group by shapeId";
			session = gtfs.factory.openSession();
			Object shapeIds[] = session.createQuery(query).list().toArray();
			try {
				JSONArray features=new JSONArray();
				for (Object s : shapeIds){
					String shapeId = (String)s;
					query="FROM Shapes" +
							" WHERE shapeId='"+shapeId+"' "+
							" ORDER BY shapePtSequence";
					Object shape_points[] = session.createQuery(query).list().toArray();
					JSONArray coordinates=new JSONArray();
					int input_index=0;
					int output_index=0;
		        	int modulus = shape_points.length /100; // we only want a max of about 100 per route
		        	if (modulus == 0) modulus++;
		        	double dlat=0;
		        	double dlon=0;
		        	double total_distance=0;
		        	Object first_point = shape_points[0];
		        	Object last_point = shape_points[shape_points.length-1];
		        	dlat = ((Shapes)first_point).getshapePtLat() - ((Shapes)last_point).getshapePtLat(); 
		        	dlon = ((Shapes)first_point).getshapePtLon() - ((Shapes)last_point).getshapePtLon(); 
		        	total_distance=Math.sqrt(dlat*dlat + dlon*dlon);
		        	System.err.println("Total distance for this trip "+total_distance+ 
		        			" count="+shape_points.length+
		        			" modulus="+modulus);
		        	double lastShapeLat = -1;
		        	double lastShapeLon = -1;
					for (Object sh : shape_points){
		        		//  thin out to about 100 points 
		        		if ((input_index++ % modulus) != 0){
		        			continue;
		        		}

		        		if (lastShapeLat != -1){
				        	dlat = lastShapeLat - ((Shapes)sh).getshapePtLat(); 
				        	dlon = lastShapeLon - ((Shapes)sh).getshapePtLon();
				        	double this_distance=Math.sqrt(dlat*dlat + dlon*dlon);
				        	// if we've moved less than 0.1% of the total, skip and
				        	// and don't even count as one of the 100 points
				        	if (total_distance/this_distance < 1000){
				        		continue;
				        	}
		        		}
			        	
						JSONArray point = new JSONArray();
						// lon - lat, not lat-lng for geojson
						point.put(1,((Shapes)sh).getshapePtLat());
						point.put(0,((Shapes)sh).getshapePtLon());
						coordinates.put(output_index++,point);
					}			
					JSONObject geometry=new JSONObject();
					geometry.put("type","LineString");
					geometry.put("coordinates",coordinates);

					JSONObject properties=new JSONObject();
					properties.put("name", databaseName);

					JSONObject feature=new JSONObject();
					feature.put("type", "Feature");
					feature.put("properties", properties);
					feature.put("geometry",geometry);

					features.put(rindex++,feature);
				}
				JSONObject properties = new JSONObject();
				properties.put("name","urn:ogc:def:crs:OGC:1.3:CRS84");
				JSONObject crs = new JSONObject();
				crs.put("type","name");
				crs.put("properties",properties);
				
				JSONObject routemap=new JSONObject();				
				routemap.put("type","FeatureCollection");
				routemap.put("crs",crs);
				routemap.put("features",features);
				
				PrintWriter out = response.getWriter();
				out.print(routemap);
			} catch (JSONException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			session.close();
		}
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		Session session = null;
		String userId = getUserId(request,response);
		if (userId == null){
			return; // your cookie doesnt add up
		}
		String query=null;
		Object results[];
		String json = request.getParameter("values");
		Hashtable<String,String> shape = new  Hashtable<String,String>();
		System.err.print("In POST database="+databaseName+" got :"+json+":\n"); 
		ObjectMapper mapper = new ObjectMapper();
		Hashtable<String,String> record = mapper.readValue(json, Hashtable.class);
		System.err.print("parsed json got :"+record.get("action")+":\n"); 
		System.err.print("tripId="+record.get("tripId")+":\n"); 
		
		if (!admin.verifyWriteAccess(databaseName,userId)){
			Print404(response,"You do not have write permission for this database");
			return;
		}

		String className = "tables.Shapes";
		String action=record.get("action");
		SessionFactoryImplementor impl=(SessionFactoryImplementor)gtfs.factory;
		ConnectionProvider cp=impl.getConnectionProvider();
	    Connection connection=null;
		
		switch(action){
		case "add_shape_point_after":
			try {
				connection = cp.getConnection();
				query ="UPDATE shapes set shape_pt_sequence = shape_pt_sequence + 1"+
						" WHERE shape_pt_sequence > "+record.get("after") +
						" AND shape_id='"+record.get("shapeId")+"'";
				System.err.println("shunting shape points with :"+query);
				PreparedStatement statement = connection.prepareStatement(query);
				statement.executeUpdate();
			    connection.commit();
			} catch (SQLException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			record.put("shapePtSequence", 
					Integer.toString(
							Integer.parseInt(record.get("after"))+1
							)
					);
		    gtfs.createRecord(className,record);
			break;

		case "delete_shape_point":
			// fetch it so we can work out what shapeId it's got, so we can then heal up the sequence
			query="from Shapes WHERE hibernateId="+record.get("hibernateId");
			session = gtfs.factory.openSession();
			results = session.createQuery(query).list().toArray();
			session.close();
			Shapes shape_rec=(Shapes)results[0];

			gtfs.deleteRecord(className,record);
			try {
				connection = cp.getConnection();
				PreparedStatement statement =
						connection.prepareStatement("UPDATE shapes set shape_pt_sequence = shape_pt_sequence - 1"+
										" WHERE shape_pt_sequence > "+request.getParameter("shapePtSequence") +
										" AND shape_id='"+shape_rec.getshapeId()+"'");
				statement.executeUpdate();
			    connection.commit();
			} catch (SQLException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			query="from Shapes WHERE shapeId='"+shape_rec.getshapeId()+"'";
			session = gtfs.factory.openSession();
			results = session.createQuery(query).list().toArray();
			session.close();
			if (results.length > 1){
				break;
			}
			// oh, we've only got one point, better zap it

			shape_rec=(Shapes)results[0];
			shape.put("hibernateId",Integer.toString(shape_rec.gethibernateId()));
			gtfs.deleteRecord("tables.Shapes", shape);	
			
			// unhook any trips that were using this shape
			// removed. it works with shape id's pointing to nowhere
			// but you can set say all the trips of a route to the same shape,
			// if we zap the shape id with this you'd break that link if you deleted 
			// the shape and then started again
			/*
			try {
				connection = cp.getConnection();
				PreparedStatement statement =
						connection.prepareStatement("UPDATE trips set shape_id = ''"+
										" WHERE shape_id = '"+shape_rec.getshapeId()+"'");
				statement.executeUpdate();
			    connection.commit();
			} catch (SQLException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			*/					

			break;
		
		case "create_shape_from_OTP":
			gtfs.ShapeImport(record.get("tripId"));
			break;
			
		case "create_shape_from_trip":
			query="from Trips where tripId='"+record.get("tripId")+"'";
			session = gtfs.factory.openSession();
			results = session.createQuery(query).list().toArray();
			session.close();
			if (results.length < 1){
				break;
			}
			Trips generating_trip=(Trips)results[0];
			String shapeId = ((Trips)results[0]).getshapeId();
			query="from Shapes where shapeId='"+shapeId+"'";
			session = gtfs.factory.openSession();
			results = session.createQuery(query).list().toArray();
			session.close();
			if (results.length > 0){
				//Print404(response,"There is already a shape for this trip, delete it first");
				break;
			}

			query="from Stops as a,StopTimes as b, Trips as c"+
					" where c.tripId = b.tripId "+
					" and a.stopId = b.stopId "+
					" and b.tripId='"+record.get("tripId")+
					"' order by b.stopSequence";

			session = gtfs.factory.openSession();
			Iterator<Object> stopsAndstopTimes = session.createQuery(query).list().iterator();
			session.close();
			Integer sequence=1;
			shapeId=null;
			while ( stopsAndstopTimes.hasNext() ) {
				Object[] tuple = (Object[]) stopsAndstopTimes.next();
				Stops stop = (Stops) tuple[0];
				StopTimes time = (StopTimes) tuple[1];
				Trips trip = (Trips) tuple[2];
				System.err.print("got a trip stop to clone "+Float.toString(stop.getstopLat())+"\n");
				
				if (shapeId == null){
					if (trip.getshapeId() == null || trip.getshapeId().isEmpty()){
						shapeId = "tripId:"+record.get("tripId");
					} else {
						shapeId = trip.getshapeId();
					}
				}
				
				shape = new  Hashtable<String,String>();
				shape.put("shapeId", shapeId);
				shape.put("shapePtLat", Float.toString(stop.getstopLat()));
				shape.put("shapePtLon", Float.toString(stop.getstopLon()));
				shape.put("shapePtSequence", Integer.toString(sequence++));
				int hibernateId=-1;
				try {
					hibernateId=gtfs.createRecord("tables.Shapes", shape);		
					System.err.println("hibernate id from create shape = "+Integer.toString(hibernateId));
				} catch (HibernateException e){
					System.err.print("failed to create shape point\n");
					response.setStatus(404);
					response.setContentType("text/html");
					Hashtable<String,String> values = new Hashtable<String,String>();
					values.put("message", e.getMessage());
					PrintWriter out = response.getWriter();
					out.println(mapper.writeValueAsString(values));
					return;
				}
			}

			try {
				connection = cp.getConnection();
				PreparedStatement statement =
						connection.prepareStatement("UPDATE trips set shape_id = '"+shapeId+"'"+
										" WHERE route_id = '"+generating_trip.getrouteId()+"'");
				statement.executeUpdate();
			    connection.commit();
			} catch (SQLException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}					
		}
		response.setContentType("text/html");

		try {
			PrintWriter out = response.getWriter();
			out.println(mapper.writeValueAsString(record));
		} catch (JsonGenerationException e) {
			e.printStackTrace();
		} catch (JsonMappingException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();	 
		}

	}
}

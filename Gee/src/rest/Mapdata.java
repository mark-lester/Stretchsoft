package rest;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.PreparedStatement;
import java.sql.Connection;
import java.sql.SQLException;
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
import tables.*;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.service.jdbc.connections.spi.ConnectionProvider;


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
		String userId = getUserId(request,response);
		if (userId == null){
			System.err.print("Failed to get access in Mapdata\n"); 
			
			return; // your cookie doesnt add up
		}

		response.setContentType("text/html");
		ObjectMapper mapper = new ObjectMapper();
		Session session = gtfs.factory.openSession();
		response.setContentType("text/html");
		MapCoords mapCoords = new MapCoords();
		Criteria criteria;
		String action=request.getParameter("action");
		if (action == null){
			action="bounds";
		}

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
		
		// this should definitely be a view of some kind
		case "stops":
			String tripId=request.getParameter("tripId");
			String query="select t1.stopLat, t1.stopLon, t1.stopId, t2.arrivalTime, t2.departureTime"+
					" from tables.Stops t1,tables.StopTimes t2"+
					" where t1.stopId=t2.stopId and t2.tripId='"+tripId+"' "+
					" order by t2.stopSequence";
			System.err.print("Mapdata Want query for "+query+"\n"); 

			Object entities[] = session.createQuery(query).list().toArray();
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

			Object stoptimes[] = session.createQuery(query).list().toArray();
			int stopSequence=1;
			for (Object record :stoptimes){
				StopTimes rec = (StopTimes)record;
				Transaction tx = session.beginTransaction();
				rec.setstopSequence(stopSequence++);
			    tx.commit();
			}
			
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
		}
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
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
		Session session = gtfs.factory.openSession();

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
			gtfs.deleteRecord(className,record);
			try {
				connection = cp.getConnection();
				PreparedStatement statement =
						connection.prepareStatement("UPDATE shapes set shape_pt_sequence = shape_pt_sequence - 1"+
										" WHERE shape_pt_sequence > "+request.getParameter("shapePtSequence") +
										" AND shape_id='"+record.get("shapeId")+"'");
				statement.executeUpdate();
			    connection.commit();
			} catch (SQLException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			query="from Shapes WHERE shapeId='"+record.get("shapeId")+"'";

			results = session.createQuery(query).list().toArray();
			if (results.length > 1){
				break;
			}
			// oh, we've only got one point, better zap it

			Shapes shape_rec=(Shapes)results[0];
			shape.put("hibernateId",Integer.toString(shape_rec.gethibernateId()));
			gtfs.deleteRecord("tables.Shapes", shape);	
			
			// unhook any trips that were using this shape
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

			break;
		
		case "create_shape_from_trip":
			query="from Trips where tripId='"+record.get("tripId")+"'";
			results = session.createQuery(query).list().toArray();
			if (results.length < 1){
				break;
			}
			Trips generating_trip=(Trips)results[0];
			String shapeId = ((Trips)results[0]).getshapeId();
			query="from Shapes where shapeId='"+shapeId+"'";
			results = session.createQuery(query).list().toArray();
			if (results.length > 0){
				Print404(response,"There is already a shape for this trip, delete it first");
				break;
			}

			query="from Stops as a,StopTimes as b, Trips as c"+
					" where c.tripId = b.tripId "+
					" and a.stopId = b.stopId "+
					" and b.tripId='"+record.get("tripId")+
					"' order by b.stopSequence";

			Iterator<Object> stopsAndstopTimes = session.createQuery(query).list().iterator();
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

package rest;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse; 

import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;
import org.hibernate.Session; 
import org.hibernate.Transaction;
import org.hibernate.*;
import org.hibernate.criterion.*;
import DBinterface.*;
import tables.*;



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
public class Mapdata extends Generic {
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
		// TODO Auto-generated method stub
	}

}

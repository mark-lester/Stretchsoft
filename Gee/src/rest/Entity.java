package rest;

import java.io.IOException;

import java.io.PrintWriter;
import java.util.Hashtable;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse; 

import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;

//import com.fasterxml.jackson.core.JsonGenerationException;
//import com.fasterxml.jackson.databind.*;
import org.hibernate.Session; 
import org.hibernate.HibernateException;
/**
 * Servlet implementation class Entity
 */
@WebServlet("/Entity")
public class Entity extends Rest {
	private static final long serialVersionUID = 1L;

    /**
     * @see HttpServlet#HttpServlet()
     */
    public Entity() {
        super();
    }
    
	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
		TODO - change this to use prepared statements else it's gonna blow up once apostrophe gets used
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

		String userId = null;
		
		userId=getUserId(request,response);
		if (userId == null){
			return; // your cookie doesnt add up
		}
		response.setContentType("text/html");
	//	System.err.print("In GET database="+databaseName+"\n"); 
		ObjectMapper mapper = new ObjectMapper();
		String entity = request.getParameter("entity");
		entity = entity == null ? "Stops" : entity;
		String query="FROM "+entity+" as child_table ";
		if (!admin.verifyReadAccess(databaseName,userId)){
			Print404(response,"You do not have read permission for this database");
			return;
		}
		
		//join_table - table to join, e.g. Trips
		//join_key
		if (request.getParameter("join_table") != null){
			query += ","+request.getParameter("join_table")+" as parent_table";
		}
		if (request.getParameter("second_join_table") != null){
			query += ","+request.getParameter("second_join_table")+" as grandparent_table";
		}
		if (request.getParameter("extend_table") != null){
			query += ","+request.getParameter("extend_table")+" as extend_table";
		}

		boolean query_started=false;
		if (request.getParameter("join_table") != null){
			if (!query_started) query+=" WHERE ";
			if (query_started) query +=" AND ";
			
			query += "child_table."+request.getParameter("join_key")+"="+
					"parent_table."+request.getParameter("join_key");
			query_started=true;
		}
		if (request.getParameter("second_join_table") != null){
			if (!query_started) query+=" WHERE ";
			if (query_started) query +=" AND ";
			query += "parent_table."+request.getParameter("second_join_key")+"="+
					"grandparent_table."+request.getParameter("second_join_key");
			query_started=true;
		}
		if (request.getParameter("extend_table") != null){
			if (!query_started) query+=" WHERE ";
			if (query_started) query +=" AND ";
			
			query += "child_table."+request.getParameter("extend_key")+"="+
					"extend_table."+request.getParameter("extend_key");
			query_started=true;
		}
		
		if (request.getParameter("field") != null){
			if (!query_started) query+=" WHERE ";
			if (query_started) query +=" AND ";
			query+=" child_table."+request.getParameter("field")+"='"+request.getParameter("value")+"'";
			query_started=true;
		}
		
		if (request.getParameter("parent_field") != null){
			if (!query_started) query+=" WHERE ";
			if (query_started) query +=" AND ";
			query+=" parent_table."+request.getParameter("parent_field")+"='"+request.getParameter("value")+"' ";
			query_started=true;
		}
		
		if (request.getParameter("bounds") != null){
			if (!query_started) query+=" WHERE ";
			if (query_started) query +=" AND ";
			query+=
					"child_table."+request.getParameter("lat_name")+" >= \'"+request.getParameter("lat_min")+"\' AND "+
					"child_table."+request.getParameter("lon_name")+" >= \'"+request.getParameter("lon_min")+"\' AND "+
					"child_table."+request.getParameter("lat_name")+" <= \'"+request.getParameter("lat_max")+"\' AND "+
					"child_table."+request.getParameter("lon_name")+" <= \'"+request.getParameter("lon_max")+"\' ";
			query_started=true;
		}
		
		
		/*
		if (request.getParameter("secondfield") != null){
			query+=" AND "+request.getParameter("secondfield")+"='"+request.getParameter("secondvalue")+"'";
		}
		*/
		
		if (request.getParameter("order") != null){
			query+=" ORDER BY child_table."+request.getParameter("order");
		}
		
		if (request.getParameter("order_parent") != null){
			query+=" ORDER BY parent_table."+request.getParameter("order_parent");
		}
		System.err.print("Want query for "+query+"\n"); 
		
		Session session = gtfs.factory.openSession();
		Object entities[] = session.createQuery(query).list().toArray();
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
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String userId = getUserId(request,response);
		if (userId == null){
			return; // your cookie doesnt add up
		}
		String json = request.getParameter("values");
		System.err.print("In POST database="+databaseName+" got "+json+"\n"); 
		ObjectMapper mapper = new ObjectMapper();
		Hashtable<String,String> record = mapper.readValue(json, Hashtable.class);
		if (!admin.verifyWriteAccess(databaseName,userId)){
			Print404(response,"You do not have write permission for this database");
			return;
		}
		
		String className = record.get("entity");
		className= className == null ? "Stops" : className;// default prints all the stops
		className = "tables."+className;
		System.err.print("In POST className "+className+" action="+record.get("action")+"\n"); 
		int recordId=0;
		String action=record.get("action");
		if (!admin.verifyReadAccess(record.get("databaseName"),userId)){
			Print404(response,"You do not have read permission for this database");
			return;
		}
		
		// fussy old java doesnt like null as the switch arg, 
		if (action == null){
			action="";
		}
		
		try{
			switch (action){
			case "delete":
				recordId = gtfs.deleteRecord(className,record);
			break;
		
			case "update":
				recordId = gtfs.updateRecord(className,record);
			break;
			
			case "replicate":
				// only works for trips
				gtfs.ReplicateTrip(
						record.get("sourceTripId"),
						record.get("targetTripId"),
						record.get("shiftMinutes"),
						record.get("invertTrip"));	
			break;
		
			// assume "create"
			default:
				recordId = gtfs.createRecord(className,record);
			break;
			}
			
		}catch (HibernateException e){
			response.setStatus(404);
			response.setContentType("text/html");
			Hashtable<String,String> values = new Hashtable<String,String>();
			values.put("message", e.getMessage());
			PrintWriter out = response.getWriter();
			out.println(mapper.writeValueAsString(values));
			return;
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

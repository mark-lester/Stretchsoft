package rest;

import java.io.IOException;

import java.io.PrintWriter;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.Hashtable;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse; 
import javax.servlet.http.Cookie;

import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;
import org.hibernate.HibernateException; 
import org.hibernate.Session; 
import org.hibernate.Transaction;
import org.hibernate.SessionFactory;
import org.hibernate.service.*;
import org.hibernate.cfg.Configuration;

import com.restfb.DefaultFacebookClient;

import com.restfb.FacebookClient.*;

import DBinterface.*;
import sax.*;
import tables.*;

/**
 * Servlet implementation class Entity
 */
@WebServlet("/Entity")
public class Entity extends HttpServlet {
	private static GtfsLoader gtfsLoader;
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public Entity() {
        super();
        gtfsLoader = new GtfsLoader();
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
		TODO - change this to use prepared statements else it's gonna blow up once apostrophe gets used
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

		Cookie[] cookies = request.getCookies();
		
		for (Cookie cookie : cookies) {
			System.err.print("Cookie Name=" + cookie.getName()+" Val="+cookie.getValue()+"\n");
		}
//		AccessToken accessToken =
//				  new DefaultFacebookClient().obtainAppAccessToken("287612631394075", "2a20c183f3998aa8313671322990d777");
	
//		FacebookClient facebookClient = new DefaultFacebookClient(accessToken);

//		System.err.print("My application access token: " + accessToken+"\n");
		response.setContentType("text/html");
		ObjectMapper mapper = new ObjectMapper();
		String query="FROM "+request.getParameter("entity");
		Session session = gtfsLoader.factory.openSession();

		if (request.getParameter("field") != null){
			query+=" WHERE "+request.getParameter("field")+"='"+request.getParameter("value")+"'";
		}
		/*
		if (request.getParameter("secondfield") != null){
			query+=" AND "+request.getParameter("secondfield")+"='"+request.getParameter("secondvalue")+"'";
		}
		*/
		if (request.getParameter("order") != null){
			query+=" ORDER BY "+request.getParameter("order");
		}
		System.err.print("Want query for "+query+"\n"); 
		
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
		session.close();
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String json = request.getParameter("values");
		System.err.print("In POST got "+json+"\n"); 
		ObjectMapper mapper = new ObjectMapper();
		Hashtable<String,String> record = mapper.readValue(json, Hashtable.class);
		
		String className = record.get("entity");
		className = "tables."+className;
		System.err.print("In POST className "+className+" action="+record.get("action")+"\n"); 
		int recordId=0;
		String action=record.get("action");
		
		// fussy old java doesnt like null as the switch arg, 
		if (action == null){
			action="";
		}
		switch (action){
			case "delete":
				recordId = gtfsLoader.deleteRecord(className,record);
			break;
		
			case "update":
				recordId = gtfsLoader.updateRecord(className,record);
			break;
		
			// assume "create"
			default:
				recordId = gtfsLoader.createRecord(className,record);
			break;
		}

		response.setContentType("text/html");

		try {
			PrintWriter out = response.getWriter();
			out.println(mapper.writeValueAsString(recordId));
		} catch (JsonGenerationException e) {
			e.printStackTrace();
		} catch (JsonMappingException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();	 
		}
	}
}

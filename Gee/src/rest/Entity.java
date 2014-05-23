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
import javax.servlet.GenericServlet;
import javax.servlet.ServletConfig;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import com.google.gson.*;


import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;
import org.hibernate.HibernateException; 
import org.hibernate.Session; 
import org.hibernate.Transaction;
import org.hibernate.SessionFactory;
import org.hibernate.service.*;
import org.hibernate.cfg.Configuration;

import org.apache.commons.codec.binary.*;
import org.apache.commons.discovery.tools.*;

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
	private Gtfs gtfs=null;
	private static Admin admin=null;
	private static Hashtable <String,Gtfs> gtfsStore=null;
	
	private static final long serialVersionUID = 1L;
	private static ServletConfig servletConfig;
	protected String FACEBOOK_SECRET;

	public void init(ServletConfig config) throws ServletException
	{
	    super.init(config);
	    FACEBOOK_SECRET = config.getInitParameter("FACEBOOK_SECRET");
//		System.err.print("FACEBOOK_SECRET=" + FACEBOOK_SECRET+"\n");
//		System.err.print("SERVLET NAME=" + getServletName()+"\n");
		

	}
    /**
     * @see HttpServlet#HttpServlet()
     */
    public Entity() {
        super();
        if (admin == null){
        	admin = new Admin();
        }
        if (gtfsStore == null){
            gtfsStore = new Hashtable <String,Gtfs>();        	
        }
    }
    
	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
		TODO - change this to use prepared statements else it's gonna blow up once apostrophe gets used
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

		String userId = getUserId(request,response);
		if (userId == null){
			return; // your cookie doesnt add up
		}
		response.setContentType("text/html");
		ObjectMapper mapper = new ObjectMapper();
		String query="FROM "+request.getParameter("entity");
		Session session = gtfs.factory.openSession();

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
		String userId = getUserId(request,response);
		if (userId == null){
			return; // your cookie doesnt add up
		}
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
				recordId = gtfs.deleteRecord(className,record);
			break;
		
			case "update":
				recordId = gtfs.updateRecord(className,record);
			break;
		
			// assume "create"
			default:
				recordId = gtfs.createRecord(className,record);
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


protected String getUserId(HttpServletRequest request, HttpServletResponse response){
	Cookie[] cookies = request.getCookies();
	String signed_request = null;
	byte[] payload=null;
	String sig = null;
	String access_token=null;
	String userId=null;
	String databaseName=null;

	Base64 codec = new Base64();
	 
	for (Cookie cookie : cookies) {
		System.err.print("Cookie Name=" + cookie.getName()+" Val="+cookie.getValue()+"\n");
        if (cookie.getName().equals("fbsr_287612631394075")){
        	signed_request = cookie.getValue();
        }
        if (cookie.getName().equals("gee_fbat")){
        	access_token = new String(codec.decode(cookie.getValue()));
        }
        if (cookie.getName().equals("gee_databasename")){
        	databaseName = new String(codec.decode(cookie.getValue()));
        }
	}
	
	if (signed_request != null){
		String[] sr_parts = signed_request.split("\\.",2);
		String encoded_sig = sr_parts[0];
	
	  // decode the data
	
		String encodedPayload = sr_parts[1];
    

        payload = codec.decode(encodedPayload);
        String payload_string = new String(payload);
        System.err.print("payload = " + payload_string + "\n");
     
        sig = new String(codec.decode(encoded_sig));
        try {	  
    	    SecretKeySpec secret = new SecretKeySpec(FACEBOOK_SECRET.getBytes(),"hmacSHA256");
	   	    Mac mac = Mac.getInstance("hmacSHA256");
    	    mac.init(secret);
    	    String sig_comp = new String(mac.doFinal(encodedPayload.getBytes()));
    	    if (sig.equals(sig_comp)){
    			ObjectMapper mapper = new ObjectMapper();
    			Hashtable<String,String> record = mapper.readValue(payload, Hashtable.class);

    	    	userId = record.get("user_id");
        		System.err.print("user_id = " + userId + "\n");
    	    } else {
    	    	// cookie doesnt add up
    	    	return null;
    	    }
    	} catch (Exception e) {
    	    System.out.println(e.getMessage());
    	} 
	}
	Hashtable <String,String> record = new Hashtable <String,String>();	
	record.put("userId", userId);
	// we can add email and nice name when we've worked out how to get them
	admin.getUser(record);
	
	if (databaseName == null){//we dont have a database cookie set, so choose the default, "gtfs"
		databaseName = "gtfs";
	    Cookie cookie1 = new Cookie("gee_databasename", databaseName);
	    response.addCookie(cookie1); 
	}
	gtfs = getGtfs(databaseName);
	
	return userId;
}

public Gtfs getGtfs(String databaseName){
	if (gtfsStore.get(databaseName) == null){
		// TODO make sure it's there, or at least in the instances table.
		gtfsStore.put(databaseName, new Gtfs("/home/Gee/config/gtfs",databaseName));
	}
	
	return gtfsStore.get(databaseName);
}

}

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
import admin.*;

/**
 * Servlet implementation class Entity
 */
@WebServlet("/User")
public class User extends Generic {
    /**
     * @see HttpServlet#HttpServlet()
     */
    public User() {
        super();
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
		TODO - change this to use prepared statements else it's gonna blow up once apostrophe gets used
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

	
		if (request.getParameter("post") != null){
			doPost(request,response);
			return;
		}
		String userId = getUserId(request,response);
		response.setContentType("text/html");
		
		ObjectMapper mapper = new ObjectMapper();
		String query="FROM Instance";
		switch (request.getParameter("entity")){
		case "Instance":
			query="FROM Instance where ownerUserId='"+userId+"' or publicRead='1'";
// UNION			query="FROM Instance,Access where Instance.databaseName Access.databseName and Access.userId='"+userId+"' or publicRead='1'";
			break;
		case "Users": // of a given database
			query="FROM Access where userId='"+userId+"' and databaseName";
			
			break;
			
			
				
		}
		Session session = admin.factory.openSession();

//		if (request.getParameter("field") != null){
//			query+=" WHERE "+request.getParameter("field")+"='"+request.getParameter("value")+"'";
//		}
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
		String json = request.getParameter("values");
		System.err.print("In POST got "+json+"\n"); 
		ObjectMapper mapper = new ObjectMapper();
		Hashtable<String,String> record = mapper.readValue(json, Hashtable.class);
		
		String className = record.get("entity");
		className = "tables."+className;
		System.err.print("In POST className "+className+" action="+record.get("action")+"\n"); 
		int recordId=0;
		String action=record.get("action");
		switch (className){
		case "Instance":// you can only change DB instance if you are an admin
			record.put("ownerId", userId);
			if (!admin.verifyAdminAccess(record.get("databaseName"),userId)){
				return;
			}
			break;
		case "User": // you can only edit yourself
			record.put("userId", userId);
			break;
		case "Access":  // you can only change access rights to a DB if you are an admin
			if (!admin.verifyAdminAccess(record.get("databaseName"),userId)){
				return;
			}
			break;
		default:
			return;
		}
		
		// fussy old java doesnt like null as the switch arg, 
		if (action == null){
			action="";
		}
		switch (action){
			case "delete":
				recordId = admin.deleteRecord(className,record);
				switch(className){
				case "Instance":
					// DELETE DATABASE databaseName
					break;
				}
			break;
		
			case "update":
				recordId = admin.updateRecord(className,record);
			break;
		
			// assume "create"
			default:
				recordId = admin.createRecord(className,record);
				switch(className){
				case "Instance":
					// CREATE DATABASE databaseName
					break;
				case "Invite":
					// send an amail to the invitee
					break;
				}
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

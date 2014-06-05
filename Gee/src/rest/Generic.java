package rest;

import java.util.Hashtable;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.codec.binary.Base64;
import org.codehaus.jackson.map.ObjectMapper;

import DBinterface.Admin;
import DBinterface.Gtfs;
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

public class Generic extends HttpServlet {
	public Gtfs gtfs=null;
	public Admin admin=null;
	public static Hashtable <String,Gtfs> gtfsStore=null;
	
	private static final long serialVersionUID = 1L;
	private static ServletConfig servletConfig;
	protected String FACEBOOK_SECRET;
	
    public Generic () {
        super();
        if (admin == null){
        	admin = new Admin();
        }
        if (gtfsStore == null){
            gtfsStore = new Hashtable <String,Gtfs>();        	
        }
    }

	public void init(ServletConfig config) throws ServletException
	{
	    super.init(config);
	    System.err.println("getting facebook secret");
	    FACEBOOK_SECRET = config.getInitParameter("FACEBOOK_SECRET");
	}
	
	public String getUserId(HttpServletRequest request, HttpServletResponse response){
		Cookie[] cookies = request.getCookies();
		String signed_request = null;
		byte[] payload=null;
		String sig = null;
		String access_token=null;
		String userId=null;
		String databaseName=null;

		Base64 codec = new Base64();
		 System.err.println("IN GET USER ID\n");
		for (Cookie cookie : cookies) {
			System.err.print("Cookie Name=" + cookie.getName()+" Val="+cookie.getValue()+"\n");
	        if (cookie.getName().equals("fbsr_287612631394075")){
	        	signed_request = cookie.getValue();
	        }
	        if (cookie.getName().equals("gee_fbat")){
	        	access_token = new String(codec.decode(cookie.getValue()));
	        }
	        if (cookie.getName().equals("gee_databasename")){
	        	databaseName = new String(cookie.getValue());
	        }
		}
		System.err.println("databaseName="+databaseName+"\n");
		
		if (signed_request != null){
			String[] sr_parts = signed_request.split("\\.",2);
			String encoded_sig = sr_parts[0];
		
		  // decode the data
		
			String encodedPayload = sr_parts[1];
	    

	        payload = codec.decode(encodedPayload);
	        String payload_string = new String(payload);
	        System.err.print("payload = " + payload_string + "\n");
	        System.err.print("FACEBOOK_SECRET = " + FACEBOOK_SECRET + "\n");
	     
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
	  //      		return userId;
	    	    } else {
	    	    	// cookie doesnt add up
	    	    	System.err.print("ERROR, cookie failure, mismatch\n");
	    	    	return null;
	    	    }
	    	} catch (Exception e) {
    	    	System.err.print("ERROR, cookie failure, bad code\n");
	    	    System.out.println("error message="+e.getMessage());
	    	    return null;
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
		gtfs = getGtfs(databaseName,userId);
		
		return userId;
	}

	public Gtfs getGtfs(String databaseName, String userId){
		if (gtfsStore.get(databaseName) == null){
			// TODO make sure it's there, or at least in the instances table.
			gtfsStore.put(databaseName, new Gtfs("/home/Gee/config/gtfs",databaseName,userId));
		}
		
		return gtfsStore.get(databaseName);
	}

}

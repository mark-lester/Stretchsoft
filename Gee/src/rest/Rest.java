package rest;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
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
import javax.servlet.http.HttpServlet;
import javax.servlet.ServletContext;

import org.json.JSONException;
import org.json.JSONObject;

public class Rest extends HttpServlet {
	public static Gtfs gtfs=null;
	public static Admin admin=null;
	public String databaseName="gtfs";  //should really be null
	public static Hashtable <String,Gtfs> gtfsStore=null;
	public static String server_root=null;
	private static final long serialVersionUID = 1L;
	private static ServletConfig servletConfig;
	protected String FACEBOOK_SECRET;
	ServletContext context;
	private static final String GITHUB_SECRET="94cf2349e33402db4c886dc6fb0cfae288ab6cfe";

	
    public Rest () {
        super();
//		server_root=System.getProperty("catalina.base");
//		context = getServletContext();
		//this.getServletContext().getRealPath("/");

        if (admin == null){
        	admin = new Admin("hibernate/admin/","admin");
        }
        if (gtfsStore == null){
            gtfsStore = new Hashtable <String,Gtfs>();        	
        }
    }
    
    @Override
    public void init() throws ServletException {
    	FACEBOOK_SECRET = getInitParameter("FACEBOOK_SECRET");
	    System.err.println("got facebook secret"+FACEBOOK_SECRET);
	    // having problems with eclipse and my web.xml :(
	    FACEBOOK_SECRET = "2a20c183f3998aa8313671322990d777";
    }

/*
 * 	public void init(ServletConfig config) throws ServletException
 
	{
	    super.init(config);
	    System.err.println("getting facebook secret");
	    FACEBOOK_SECRET = config.getInitParameter("FACEBOOK_SECRET");
	}
	*/
	
	public String getUserId(HttpServletRequest request, HttpServletResponse response){
		Cookie[] cookies = request.getCookies();
		String secure_token = null;
		byte[] payload=null;
		String sig = null;
		String gee_user=null;
		String userId=null;

		Base64 codec = new Base64();
//		 System.err.println("IN GET USER ID\n");
		int count=0;
		for (Cookie cookie : cookies) {
//			System.err.print("Cookie Name=" + cookie.getName()+" Val="+cookie.getValue()+"\n");
	        if (cookie.getName().equals("gee_securetoken")){
	        	secure_token = cookie.getValue();
	        }
	        
	        if (cookie.getName().equals("gee_user")){
	        	gee_user = cookie.getValue();
	        }
	        if (cookie.getName().equals("gee_databasename")){
//	        	System.err.println("incoming cookie for databaseName="+cookie.getValue());
	        	databaseName = new String(cookie.getValue());
	        }
		}
		if (gee_user == null || secure_token == null){
			userId="guest";
			gee_user="guest";
		}

		String encrypted = rest.Utils.encrypt(gee_user,GITHUB_SECRET);
		if (!encrypted.equals(secure_token)){
			System.err.println("Use authentication error");
			userId= "guest";
		} else {
			userId=gee_user;
		}
		
		Hashtable <String,String> record = new Hashtable <String,String>();	
		if (userId == null){
			userId= "guest";
		}
		record.put("userId", userId);
		// we can add email and nice name when we've worked out how to get them
//		System.err.println("should be adding user "+userId);
		admin.getUser(record);
	
		
		if (databaseName == null || !admin.verifyExists(databaseName)){//we dont have a database  set, so choose the default, "gtfs"
			System.err.println("setting GTFS to gtfs");
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
			gtfsStore.put(databaseName, new Gtfs("hibernate/gtfs/",databaseName,userId));
		}
		
		return gtfsStore.get(databaseName);
	}
	
	public void Print404(HttpServletResponse response,String message) throws IOException{
		ObjectMapper mapper = new ObjectMapper();
		Hashtable<String,String> values = new Hashtable<String,String>();
		values.put("message", message);
		response.setStatus(404);
		response.setContentType("text/html");
		PrintWriter out = response.getWriter();
		out.println(mapper.writeValueAsString(values));
		}

}

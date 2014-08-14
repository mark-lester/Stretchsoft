package rest;

import java.io.DataOutputStream;
import java.io.IOException;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Hashtable;
import java.util.Map;
import java.io.UnsupportedEncodingException;
import java.util.LinkedHashMap;
import java.net.URLDecoder;
import javax.crypto.Mac;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.SecretKeySpec;
import javax.crypto.Cipher;

import java.io.InputStream;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse; 

import org.apache.commons.codec.binary.Base64;
import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;

//import com.fasterxml.jackson.core.JsonGenerationException;
//import com.fasterxml.jackson.databind.*;
import org.hibernate.Session; 
import org.hibernate.HibernateException;
import org.json.JSONException;
import org.json.JSONObject;
/**
 * Servlet implementation class Entity
 */
@WebServlet("/Security")
public class Security extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private static final String GITHUB_SECRET="94cf2349e33402db4c886dc6fb0cfae288ab6cfe";
	private static final String GEE_SECRET="9A194A26AFBC67B4";

    /**
     * @see HttpServlet#HttpServlet()
     */
    public Security() {
        super();
    }
    
	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
		TODO - change this to use prepared statements else it's gonna blow up once apostrophe gets used
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String code = request.getParameter("code");
	    String url = "https://github.com/login/oauth/access_token";
	    String query = "&client_id=d20b14968463e2b9634c";
	    query += "&client_secret="+GITHUB_SECRET;
	    query += "&code="+code;
	    query += "&accept=json";
	    String github_response = executePost(url,query);
        Map<String, String> qmap=
                splitQuery(github_response);
        url="https://api.github.com/user?access_token="+qmap.get("access_token");
	    String github_user = executeGet(url);
        JSONObject jsonObject;
		
		String userId=null;
		try {
			jsonObject = new JSONObject(github_user);
			userId=jsonObject.get("login").toString();
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        String encrypted=null;
        encrypted = rest.Utils.encrypt(userId,GEE_SECRET);
        Cookie cookie1 = new Cookie("gee_securetoken", encrypted);
	    Cookie cookie2 = new Cookie("gee_user", userId);
	    response.addCookie(cookie1); 
	    response.addCookie(cookie2); 
	    response.sendRedirect(response.encodeRedirectURL("/Gee/Eric.html") ); 
   }
	
	
public static String executePost(String targetURL, String urlParameters)
	  {
	    URL url;
	    HttpURLConnection connection = null;  
	    try {
	      //Create connection
	      url = new URL(targetURL);
	      connection = (HttpURLConnection)url.openConnection();
	      connection.setRequestMethod("POST");
	      connection.setRequestProperty("Content-Type", 
	           "application/x-www-form-urlencoded");
				
	      connection.setRequestProperty("Content-Length", "" + 
	               Integer.toString(urlParameters.getBytes().length));
	      connection.setRequestProperty("Content-Language", "en-US");  
				
	      connection.setUseCaches (false);
	      connection.setDoInput(true);
	      connection.setDoOutput(true);

	      //Send request
	      DataOutputStream wr = new DataOutputStream (
	                  connection.getOutputStream ());
	      wr.writeBytes (urlParameters);
	      wr.flush ();
	      wr.close ();

	      //Get Response	
	      InputStream is = connection.getInputStream();
	      BufferedReader rd = new BufferedReader(new InputStreamReader(is));
	      String line;
	      StringBuffer response = new StringBuffer(); 
	      while((line = rd.readLine()) != null) {
	        response.append(line);
	        response.append('\r');
	      }
	      rd.close();
	      return response.toString();

	    } catch (Exception e) {

	      e.printStackTrace();
	      return null;

	    } finally {

	      if(connection != null) {
	        connection.disconnect(); 
	      }
	    }
	  }
	 
	 public String executeGet(String urlToRead) {
	      URL url;
	      HttpURLConnection conn;
	      BufferedReader rd;
	      String line;
	      String result = "";
	      try {
	         url = new URL(urlToRead);
	         conn = (HttpURLConnection) url.openConnection();
	         conn.setRequestMethod("GET");
	         rd = new BufferedReader(new InputStreamReader(conn.getInputStream()));
	         while ((line = rd.readLine()) != null) {
	            result += line;
	         }
	         rd.close();
	      } catch (IOException e) {
	         e.printStackTrace();
	      } catch (Exception e) {
	         e.printStackTrace();
	      }
	      return result;
	   }
	 public static Map<String, String> splitQuery(String query) throws UnsupportedEncodingException {
		    Map<String, String> query_pairs = new LinkedHashMap<String, String>();
		    String[] pairs = query.split("&");
		    for (String pair : pairs) {
		        int idx = pair.indexOf("=");
		        query_pairs.put(URLDecoder.decode(pair.substring(0, idx), "UTF-8"), URLDecoder.decode(pair.substring(idx + 1), "UTF-8"));
		    }
		    return query_pairs;
		}
	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		
	}
	
	}

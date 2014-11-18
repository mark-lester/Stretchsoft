package rest;

import java.io.DataOutputStream;
import javax.xml.ws.http.HTTPException;
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
public class Security extends Rest {
	private static final long serialVersionUID = 1L;

    /**
     * @see HttpServlet#HttpServlet()
     */
    public Security() {
        super();
    }
    @Override
    public void init() throws ServletException {
    	GITHUB_SECRET = getServletContext().getInitParameter("GITHUB_SECRET");
    	GEE_SECRET = getServletContext().getInitParameter("GEE_SECRET");
//    	FACEBOOK_SECRET = getInitParameter("FACEBOOK_SECRET");
//	    System.err.println("got facebook secret"+FACEBOOK_SECRET);
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String encrypted=null;
		String userId=null;
		String code = request.getParameter("code");
		if (code == null){ // no code set so just log out
			System.err.println("SECURITY zapping userId");
			userId="guest";
		} else {
			
		    String url = "https://github.com/login/oauth/access_token";
		    String query = "&client_id=d20b14968463e2b9634c";
		    query += "&client_secret="+GITHUB_SECRET;
		    query += "&code="+code;
		    query += "&accept=json";
		    String github_response = executePost(url,query);
	        Map<String, String> qmap=
	                splitQuery(github_response);
	        github_access_token=qmap.get("access_token");
	        url="https://api.github.com/user?access_token="+github_access_token;
		    String github_user = executeGet(url);
	        JSONObject jsonObject;
			
			try {
				jsonObject = new JSONObject(github_user);
				userId=jsonObject.get("login").toString();
			} catch (JSONException e) {
				userId="guest";
			}
		}
		System.err.println("SECURITY gee_user="+userId);
        encrypted = rest.Utils.encrypt(userId,GEE_SECRET);
		
        Cookie cookie1 = new Cookie("gee_securetoken", encrypted);
	    Cookie cookie2 = new Cookie("gee_user", userId);
	    Cookie cookie3 = new Cookie("github_access_token", github_access_token);
	    
	    response.addCookie(cookie1); 
	    response.addCookie(cookie2); 
	    response.addCookie(cookie3); 
	    response.sendRedirect(response.encodeRedirectURL("http://wikitimetable.com/Gee/Eric.html") ); 
   }
	
	
	
public static String executePost(String targetURL, String urlParameters) throws HTTPException {
    URL url;
    HttpURLConnection connection = null;  
    try {
        //Create connection
        url = new URL(targetURL);
        connection = (HttpURLConnection)url.openConnection();
        connection.setRequestMethod("POST");
        connection.setRequestProperty("Content-Type", 
             "application/x-www-form-urlencoded");
        if (github_access_token != null) connection.setRequestProperty("Authorization", 
                "token "+github_access_token);
  			
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
    	HTTPException h=null;
		try {
			h = new HTTPException(connection.getResponseCode());
		} catch (IOException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
		System.err.println("throwing exception code "+h.getStatusCode());
		throw h;
    } finally {
        if(connection != null) {
            connection.disconnect(); 
        }
    }
}

public static String executePut(String targetURL, String jsonString)
{
  URL url;
  HttpURLConnection connection = null;  
  try {
    //Create connection
    url = new URL(targetURL);
    connection = (HttpURLConnection)url.openConnection();
    connection.setRequestMethod("PUT");
    connection.setRequestProperty("Content-Type", 
            "application/x-www-form-urlencoded");
    if (github_access_token != null) connection.setRequestProperty("Authorization", 
            "token "+github_access_token);
			
    connection.setRequestProperty("Content-Length", "" + 
             Integer.toString(jsonString.getBytes().length));
    connection.setRequestProperty("Content-Language", "en-US");  
			
    connection.setUseCaches (false);
    connection.setDoInput(true);
    connection.setDoOutput(true);

    //Send request
    DataOutputStream wr = new DataOutputStream (
                connection.getOutputStream ());
    wr.writeBytes (jsonString);
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
	      HttpURLConnection connection;
	      BufferedReader rd;
	      String line;
	      String result = "";
	      try {
	         url = new URL(urlToRead);
	         connection = (HttpURLConnection) url.openConnection();
	         connection.setRequestMethod("GET");
	         if (github_access_token != null) connection.setRequestProperty("Authorization", 
	                 "token "+github_access_token);
	         rd = new BufferedReader(new InputStreamReader(connection.getInputStream()));
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

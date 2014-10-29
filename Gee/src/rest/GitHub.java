package rest;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.FileInputStream;
import java.io.UnsupportedEncodingException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Hashtable;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.io.StringWriter;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import admin.*;
import org.json.*;

import java.io.File;
import java.util.List;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.io.IOUtils;

import sax.TableMap;

/**
 * Servlet implementation class GitHub
 */
@WebServlet("/GitHub")
public class GitHub extends Security {
	private static final long serialVersionUID = 1L;
    public static final String domain = "https://api.github.com";
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public GitHub() {
     // TODO Auto-generated constructor stub
        super();
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String action=request.getParameter("action");
		if (action == null) action="commit";
		response.setContentType("text/html");
		PrintWriter out = response.getWriter();
		switch (action){
		case "commit":
			out.println(commit(request,response));
		}
	}
	
	protected String commit(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String userId=getUserId(request,response);
		Hashtable<String, String> r = new Hashtable <String,String>();
		r.put("databaseName", databaseName);
		r.put("userId", userId);
		Instance in = admin.getInstanceO(r);
		String github_name = in.getdescription();
		String query=null;
		checkWikiTimetable(github_name);
		checkUserRepository(userId,github_name);

        for (String resourceFile : gtfs.hibernateConfig.resources) {
    		TableMap tableMap = gtfs.hibernateConfig.tableMaps.get(resourceFile);
            Set <String> keys = tableMap.map.keySet();
            String className=tableMap.className;
            String tableName=tableMap.tableName;

    		String fileName=tableName+".txt";
    		commit_file(userId,github_name,resourceFile,fileName);
        }
        	    
		return pull_request(userId,github_name);
	}
	
protected void checkWikiTimetable(String github_name){
    String url=domain+"/repos/WikiTimetable/"+github_name+"/contents";
    String github_response = executeGet(url);
    System.err.println("check wikitimetable "+github_response);
    JSONArray arr=null;
    try {
		arr = new JSONArray(github_response);
	} catch (JSONException e) {
		// TODO Auto-generated catch block
		arr = null; // failed to get an array,  
//		e.printStackTrace();
	}
    
    if (arr == null)
    	createWikiTimetable(github_name);
}

protected void checkUserRepository(String userId,String github_name){
    String url=domain+"/repos/"+userId+"/"+github_name+"/contents";
    String github_response = executeGet(url);
    System.err.println("check user rep "+github_response);
    JSONArray arr=null;
    try {
		arr = new JSONArray(github_response);
	} catch (JSONException e) {
		// TODO Auto-generated catch block
		arr=null;
	}
    
	if (arr == null)
		createUserRepository(userId,github_name);
}


//POST /orgs/:org/repos
protected void createWikiTimetable(String github_name){
	 String url=domain+"/orgs/WikiTimetable/repos";
	 Map<String,String> rec = new HashMap<String,String>();
	 Gson gson = new Gson();
	 rec.put("name",github_name);
	 String jsonString = gson.toJson(rec);
	 String github_response = executePost(url,jsonString);
	 System.err.println("create wiki rep "+github_response);
     for (String resourceFile : gtfs.hibernateConfig.resources) {
 		TableMap tableMap = gtfs.hibernateConfig.tableMaps.get(resourceFile);
         Set <String> keys = tableMap.map.keySet();
         String className=tableMap.className;
         String tableName=tableMap.tableName;

 		String fileName=tableName+".txt";
 		commit_file("WikiTimetable",github_name,resourceFile,fileName);
     }
}

///POST repos/:owner/:repo/forks

protected void createUserRepository(String userId, String github_name){
	 String url=domain+"/repos/WikiTimetable/"+github_name+"/forks";
	 Map<String,String> rec = new HashMap<String,String>();
	 Gson gson = new Gson();
	 String jsonString = gson.toJson(rec);
	 String github_response = executePost(url,jsonString);
	 System.err.println("create fork  "+github_response);
}

//PUT /repos/:owner/:repo/contents/:path
// will create a file if it doesnt exist
   protected void commit_file(String userId,String github_name,String resourceFile,String fileName){	    
	    String url=domain+"/repos/"+userId+"/"+github_name+"/contents/"+fileName;
	    String github_response = executeGet(url);
	    System.err.println("got commit "+github_response);

	    String sha=null;
	    JSONObject obj=null;
	    if (github_response != null)
	    try {
			obj = new JSONObject(github_response);
		} catch (JSONException e) {
			obj=null;
		}

	    if (obj != null)
		try {
			sha=obj.getString("sha");
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			sha=null;
		}
		Hashtable <String,String> fileHash = new Hashtable <String,String>();
        Map<String,String> rec = new HashMap<String,String>();
        String charset = "UTF-8";
        
		gtfs.DumpTable(resourceFile, fileHash, null);
        try {
			rec.put("content", new String(
									Base64.encodeBase64(
											fileHash.get(fileName).getBytes()
											),
									charset)
							);
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        
    //    Hashtable <String,String> rec = new Hashtable <String,String>();
        rec.put("path",fileName);
        rec.put("message","Auto Gee "+ (sha != null ? "Commit" : "Create"));
        if (sha != null) rec.put("sha",sha);
        
        Gson gson = new Gson();
        String jsonString = gson.toJson(rec);
        github_response=executePut(url,jsonString);
        System.err.println("commit repsonse="+github_response);
    }
   
   //POST /repos/:owner/:repo/pulls title, head, base,body
   protected String pull_request(String userId,String github_name){	    
	    String url=domain+"/repos/WikiTimetable/"+github_name+"/pulls";
        String github_response=executeGet(url);
        System.err.println("wikitimetable pull request listing="+github_response);  
        Map<String,String> rec = new HashMap<String,String>();
        rec.put("title","auto title");
        rec.put("body","auto body");
        rec.put("head",userId+":master");
        rec.put("base","master");
        Gson gson = new Gson();
        String jsonString = gson.toJson(rec);
//        System.out.println("access token = " + github_access_token);
        
        github_response=executePost(url,jsonString);
        System.err.println("pull request repsonse="+github_response);  
        JSONObject obj=null;
	    try {
			obj = new JSONObject(github_response);
		} catch (JSONException e) {
			obj = null;
		}
		if (obj == null)
			return null;
		String request_number=null;
		try {
			request_number=Integer.toString(obj.getInt("number"));
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			return null;
		}
		url+="/"+request_number+"/merge";
        rec = new HashMap<String,String>();
        rec.put("commit_message","auto merge comment");
        jsonString = gson.toJson(rec);
        return github_response=executePut(url,jsonString);
   }	

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
	}

}



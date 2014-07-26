package rest;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.InputStream;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;
import java.util.Hashtable;

import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;
import org.apache.commons.codec.binary.Base64;

/**
 * Servlet implementation class Loader
 */
@WebServlet("/Loader")
public class Loader extends Rest {
	private static final long serialVersionUID = 1L;
      
    /**
     * @see HttpServlet#HttpServlet()
     */
    public Loader() {
        super();
      }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String userId = getUserId(request,response);
		if (userId == null){
			return; // your cookie doesnt add up
		}

		String action=request.getParameter("action");
		if (action==null)action=""; // switch doesnt like null
		switch(action){
		case "export":
			response.setHeader("Content-Disposition", "inline; filename="+databaseName+".zip" );
			response.setContentType("application/zip, application/octet-stream");
			response.getOutputStream().write(gtfs.runDumper());
			break;
		case "zap":
			response.setContentType("text/html");
			System.err.println("RUNNING ZAPPER");
			gtfs.runZapper();
			PrintWriter out = response.getWriter();
			out.println("[]");

			break;
		}
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String json = request.getParameter("values");
		String userId = getUserId(request,response);
		if (userId == null){
			return; // your cookie doesnt add up
		}
		
		ObjectMapper mapper = new ObjectMapper();
		Hashtable<String,String> record = mapper.readValue(json, Hashtable.class);

		response.setContentType("text/html");
		String action=record.get("action");
		String encodedData = record.get("file");
		System.err.println("encoded data length = "+encodedData.length());
		
		Base64 decoder = new Base64();
		byte[] decodedBytes = decoder.decode(encodedData);
		int length=decodedBytes.length;
		System.err.println("decoded bytes length = "+length);
		if (action==null)action=""; // switch doesnt like null
		response.setContentType("text/html");
		PrintWriter out = response.getWriter();
		switch(action){
		case "import":
			gtfs.runLoader(decodedBytes,out);
			break;
		}
		
		try {
			out.println(mapper.writeValueAsString(record.get("action")));
		} catch (JsonGenerationException e) {
			e.printStackTrace();
		} catch (JsonMappingException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();	 
		}
		// TODO Auto-generated method stub
	}
	

	protected boolean putData(){
		return true;
	}

}

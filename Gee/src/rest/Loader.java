package rest;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Hashtable;
import org.codehaus.jackson.map.ObjectMapper;
import org.apache.commons.codec.binary.Base64;

/**
 * Servlet implementation class Loader
 */
@WebServlet("/Loader")
public class Loader extends Generic {
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
		System.err.print("In POST got "+json+"\n"); 
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
		switch(action){
		case "import":
			gtfs.runLoader(decodedBytes);
			break;
		}
		// TODO Auto-generated method stub
	}
	

	protected boolean putData(){
		return true;
	}

}

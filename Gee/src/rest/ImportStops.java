package rest;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.hibernate.Session;

import DBinterface.GtfsLoader;

/**
 * Servlet implementation class ImportStops
 */
@WebServlet("/ImportStops")
public class ImportStops extends Generic {
	private static final long serialVersionUID = 1L;
    
    /**
     * @see HttpServlet#HttpServlet()
     */
    public ImportStops() {
        super();
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String north=request.getParameter("n");
		String south=request.getParameter("s");
		String east=request.getParameter("e");
		String west=request.getParameter("w");
		String stop_type=request.getParameter("t");
		String userId = getUserId(request,response);
		if (userId == null){
			return; // your cookie doesnt add up
		}

        gtfs.StopsImport(north,south,east,west, stop_type);

		// TODO Auto-generated method stub
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
	}

}

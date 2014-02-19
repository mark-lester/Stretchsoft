import DBinterface.*;
import sax.*;
import tables.*;
public class RunLoader {
	
public static void main(String[] args) {
	GtfsLoader gtfsLoader = new GtfsLoader();
	gtfsLoader.runLoader();
  }
}

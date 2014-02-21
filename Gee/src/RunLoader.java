import DBinterface.*;
import sax.*;
import tables.*;
import org.apache.commons.cli.*;

public class RunLoader {
	
public static void main(String[] args) {
	GtfsLoader gtfsLoader = new GtfsLoader();
	CommandLineParser parser = new BasicParser();
	CommandLine cmd=null;
	// create the Options
	Options options = new Options();
	options.addOption( "d", "dump", false, "dump the database" );
	try {
		cmd = parser.parse( options, args);
	} catch (ParseException e) {
		// TODO Auto-generated catch block
		e.printStackTrace();
	} 
	if(cmd.hasOption("d")) {
		gtfsLoader.runDumper();
	} else {
		gtfsLoader.runLoader();
	}
  }
}

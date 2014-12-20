import java.io.IOException;
import java.io.PrintWriter;

import DBinterface.*;
import sax.*;
import tables.*;
import org.apache.commons.cli.*;

public class RunLoader {
	
public static void main(String[] args) throws IOException {
	Gtfs gtfs = new Gtfs(args[0],args[1]);
	CommandLineParser parser = new BasicParser();
	CommandLine cmd=null;
	// create the Options
	Options options = new Options();
	options.addOption( "d", "dump", false, "dump the database" );
	options.addOption( "l", "load", false, "load to database" );
	options.addOption( "s", "shape", false, "create shape files" );
	try {
		cmd = parser.parse( options, args);
	} catch (ParseException e) {
		// TODO Auto-generated catch block
		e.printStackTrace();
	} 
	if(cmd.hasOption("d")) {
		gtfs.runDumper();
	} 
	byte[] zipData=null;
	PrintWriter err = new PrintWriter(System.err, true);
	if(cmd.hasOption("l")) {
		gtfs.runLoader(zipData,err);
	} 
	if(cmd.hasOption("s")) {
		System.err.println("Running make shapes");
		gtfs.runMakeShapes();
	} 	
	System.err.println("Completed Loader");
  }
}

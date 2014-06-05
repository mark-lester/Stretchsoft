package DBinterface;

public class GtfsLoader extends Gtfs {
    
	public GtfsLoader(String hibernateConfigDirectory,String databaseName){
		super(hibernateConfigDirectory,databaseName);
	}

   
    public void runLoader() {
        // get the tables out of the hibernate.cfg.xml.
        // you can presumably do that via hibernate itself but I couldn't work out how to do that

        for (String resourceFile : hibernateConfig.resources) {
            // load the specific table
            System.out.println("Loading "+resourceFile+"...\n");       
            LoadTable(resourceFile,null);
            System.out.println("Done "+resourceFile+"\n");       
        }   
    }

    public void runZapper() {
        // get the tables out of the hibernate.cfg.xml.
        // you can presumably do that via hibernate itself but I couldn't work out how to do that

        for (String resourceFile : hibernateConfig.resources) {
            // load the specific table
            System.out.println("Loading "+resourceFile+"...\n");       
            ZapTable(resourceFile);
            System.out.println("Done "+resourceFile+"\n");       
        }   
    }

    public void runDumper() {
        // get the tables out of the hibernate.cfg.xml.
        // you can presumably do that via hibernate itself but I couldn't work out how to do that

        for (String resourceFile : hibernateConfig.resources) {
            // load the specific table
            System.out.println("Dumping "+resourceFile+"...\n");       
            DumpTable(resourceFile);
            System.out.println("Done "+resourceFile+"\n");       
        }   
    }
   

}// end class
  
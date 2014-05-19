package sax;

import org.xml.sax.*;
import org.xml.sax.helpers.*;
import java.util.*;


public class HibernateConfig extends DefaultHandler {
	public List<String> resources = new ArrayList<>();
	public Hashtable <String,TableMap> tableMaps=new Hashtable<String,TableMap> ();
	   
	public void startElement(
			   				String namespaceURI,
			   				String localName,
			   				String qName, 
			   				Attributes atts)
                	throws SAXException {
	    	if (localName.matches("mapping")){
	    		resources.add(atts.getValue("resource"));
	    	}
	   }
}
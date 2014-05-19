package sax;

import org.xml.sax.*;
import org.xml.sax.helpers.*;
import java.util.*;

public class OSMStops extends DefaultHandler {
	   public Hashtable <String,String> record=null;
	   public List<Hashtable<String,String>> records = new ArrayList<Hashtable<String,String>>();

	   public void startElement(
			   				String namespaceURI,
			   				String localName,
			   				String qName, 
			   				Attributes atts)
                	throws SAXException {
	    	if (localName.matches("node")){
	    		record=new Hashtable<String,String> ();
	    		record.put("lat", atts.getValue("lat"));
	    		record.put("lon", atts.getValue("lon"));
	    		record.put("id", atts.getValue("id"));
	    	}
	    	if (localName.matches("tag")){
	    		if (atts.getValue("k").matches("name")){
		    		record.put("name", atts.getValue("v"));
	    		}
	    		if (atts.getValue("k").matches("ref")){
		    		record.put("ref", atts.getValue("v"));
	    		}
	    	}
	   }
	   
	   public void endElement(
  				String namespaceURI,
  				String localName,
  				String qName)
   	throws SAXException {
	    	if (localName.matches("node")){
	    		records.add(record);
	    		System.err.println("name = "+record.get("name")+" lat ="+record.get("lat")+" lon ="+record.get("lon"));
	    	}		   
	   }
	   
}
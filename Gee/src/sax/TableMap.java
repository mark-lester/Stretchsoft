package sax;

import org.xml.sax.*;
import org.xml.sax.helpers.*;
import java.util.*;

public class TableMap extends DefaultHandler {
	   public Hashtable <String,String> map=new Hashtable<String,String> ();
	   public String className=null;
	   public String tableName=null;
	   public ArrayList <String> csvFieldOrder = new ArrayList <String>();
	   public ArrayList <String> keyFields = new ArrayList <String>();
	   public void startElement(
			   				String namespaceURI,
			   				String localName,
			   				String qName, 
			   				Attributes atts)
                	throws SAXException {
	    	if (localName.matches("property")){
	    		csvFieldOrder.add(atts.getValue("column"));
	    		map.put(atts.getValue("column"), atts.getValue("name"));
	    		String u;
	    		if ((u=atts.getValue("unique")) != null && u.equals("true") ){
	    			keyFields.add(atts.getValue("name"));
	    		}
	    	}
	    	if (localName.matches("class")){
	    		className = atts.getValue("name");
	    		tableName = atts.getValue("table");
	    	}
	   }
}
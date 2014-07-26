package sax;

import org.xml.sax.*;
import org.xml.sax.helpers.*;
import java.util.*;


public class HibernateConfig extends DefaultHandler {
	public List<String> resources = new ArrayList<>();
	public Hashtable <String,TableMap> tableMaps=new Hashtable<String,TableMap> ();
	public Hashtable <String,String> properties=new Hashtable<String,String> ();
	public Hashtable <String,String> keys=new Hashtable<String,String> ();	
	public String current_property=null;
	public String is_key=null;
	
	   
	public void startElement(
				String namespaceURI,
				String localName,
				String qName, 
				Attributes atts)
	throws SAXException {
		if (localName.matches("mapping")){
			resources.add(atts.getValue("resource"));
		}
		if (localName.matches("property")){
			current_property=atts.getValue("name");
			is_key=atts.getValue("key");
		}
	}

	public void endElement(
				String namespaceURI,
				String localName,
				String qName, 
				Attributes atts)
	throws SAXException {
		current_property=null;
	}

	public void characters(char[] ch,
            int start,
            int length)
     throws SAXException{
		String value=new String(Arrays.copyOfRange(ch, start, start+length));
		if (current_property==null){return;}
		properties.put(current_property,value.trim());
	}
}
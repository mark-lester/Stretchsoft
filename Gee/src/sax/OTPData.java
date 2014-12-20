package sax;

import org.xml.sax.*;
import org.xml.sax.helpers.*;
import java.util.*;

public class OTPData extends DefaultHandler {
	   public List <GeoPoint> points;
	   public String content=null;

	   public void endElement(
  				String namespaceURI,
  				String localName,
  				String qName)
   	throws SAXException {
		   points=decodePolyline(content);
	   }
	   
	   public void characters(char[] ch,
	            int start,
	            int length)
	     throws SAXException{
		   content = String.copyValueOf(ch, start, length).trim();
		}
	   
	   private List<GeoPoint> decodePolyline(String encoded) {

			List<GeoPoint> poly = new ArrayList<GeoPoint>();
			int index = 0, len = encoded.length();
			int lat = 0, lng = 0;

			while (index < len) {
				int b, shift = 0, result = 0;
				do {
					b = encoded.charAt(index++) - 63;
					result |= (b & 0x1f) << shift;
					shift += 5;
				} while (b >= 0x20);
				int dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
				lat += dlat;

				shift = 0;
				result = 0;
				do {
					b = encoded.charAt(index++) - 63;
					result |= (b & 0x1f) << shift;
					shift += 5;
				} while (b >= 0x20);
				int dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
				lng += dlng;

				GeoPoint p = new GeoPoint(lat * 1E6 / 1E5, lng * 1E6/ 1E5);
				poly.add(p);
			}

			return poly;
		}
	   
}
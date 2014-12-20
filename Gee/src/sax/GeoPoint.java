package sax;

import java.util.ArrayList;
import java.util.List;

public class GeoPoint {
	   public float Lat;
	   public float Lon;

	   public GeoPoint(double lat, double lon){
		   this.Lat=(float)lat;
		   this.Lon=(float)lon;
	   }
	   
	   public static  List<GeoPoint> decodePolyline(String encoded) {
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
				GeoPoint p = new GeoPoint(lat * 0.00001, lng * 0.00001);
				poly.add(p);
			}

			return poly;
		}
}
package rest;
/* stuff to merge set of paths from the routemap
 the basic idea is
 for each connecting line between points in the routemap
   create a Connector (if doesnt exist, check in either direction!)
 
 then, for each unprocessed Connector
   find the start of a sub-path where the set of tripsIds for all these connectors is the same
   then from the start, iterate to the end setting the sectionIds to the same
   then again from the start, build up a set of coords that can be used on a new goejson feature 
*/

import java.util.Hashtable;
import java.util.ArrayList;
public class Connector{
	double Ax,Ay,Bx,By;
	int sectionId=0;
	boolean started=false;
	boolean lined=false;
	Hashtable<String,String> tripIds=new Hashtable<String,String>();

	static int sectionIndex=1;
	public static Hashtable<String,Connector> indexConnector= new Hashtable<String,Connector>();
	static Hashtable<String,ArrayList<Connector>> indexNodes= new Hashtable<String,ArrayList<Connector>>();
	
	public Connector(double Ax,double Ay,double Bx,double By){
		this.Ax=Ax;
		this.Ay=Ay;
		this.Bx=Bx;
		this.By=By;
		indexConnector.put(ConnectorString(Ax,Ay,Bx,By), this);
		String A=CoordString(Ax,Ay);
		String B=CoordString(Bx,By);
		
		if (indexNodes.get(A) == null){
			ArrayList<Connector> connectors=new ArrayList <Connector>();
			indexNodes.put(A, connectors);
		}
		indexNodes.get(A).add(this);
		
		if (indexNodes.get(B) == null){
			ArrayList<Connector> connectors=new ArrayList <Connector>();
			indexNodes.put(B, connectors);
		}
		indexNodes.get(B).add(this);
//		System.err.println("New n="+indexNodes.size()+" c="+indexConnector.size());
	}

	public static String CoordString(double X,double Y){
		return 	Double.toString(X)+":"+Double.toString(Y);
	}
	
	public static String ConnectorString(double Ax,double Ay,double Bx,double By){
		return 	CoordString(Ax,Ay)+"-"+CoordString(Bx,By);
	}
	
	public static Connector get(double Ax,double Ay,double Bx,double By){
		String AB=ConnectorString(Ax,Ay,Bx,By);
//		System.err.println("Getting "+AB);
		Connector r=indexConnector.get(AB);
		if (r != null)
			return r;
		String BA=ConnectorString(Bx,By,Ax,Ay);
		r=indexConnector.get(BA);
		if (r != null)
			return r;

//		System.err.println("Had to make a new one ");
		return new Connector(Ax,Ay,Bx,By) ;
	}
	
	public void addTrip(String tripId){
		this.tripIds.put(tripId, tripId);
		return ;
	}

	public void flip(){
	//	System.err.println("Flipping");
		double t=this.Ax;
		this.Ax=this.Bx;
		this.Bx=t;
		t=this.Ay;
		this.Ay=this.By;
		this.By=t;		
	}

	// find your way to one of a section
	public Connector findStart(Connector origin, Connector from){
		String TO;	
		if (from != null && from.Ax==this.Ax && from.Ay==this.Ay){// this one is backwards, flip it
			this.flip();
		}
		this.started=true;
		TO=CoordString(this.Ax,this.Ay);			
//		System.err.println("finding "+ConnectorString(Ax,Ay,Bx,By)+ " from "+from);
		for (Connector candidate : Connector.indexNodes.get(TO)){
//			if (candidate==this) continue; // this one will be in the list, the connectors are bidercitional
//			if (candidate==origin) break;  // we're in a circle			
			if (candidate.sectionId == 0 && !candidate.started// skip anything already processed
					&& candidate.tripIds.equals(origin.tripIds)){
//				System.err.println("this "+this+" cand="+candidate);
//				System.err.println("Candidate "+ConnectorString(candidate.Ax,candidate.Ay,candidate.Bx,candidate.By));				
				return candidate.findStart(origin,this);
			}
		}
        // nothing matched, this is the start
		if (this == origin) { // this is a singleton, 
			//so flip it cos there could be stuff in the other direction
			this.flip();
		}
		return this;
	}
	
	// set all the members of a section to the same id
	public Connector joinSame(Connector origin,Connector from){
		String TO;	
		if (from != null && from.Bx==this.Bx && from.By==this.By){// this one is backwards, so flip it
			this.flip();
		}
		TO=CoordString(this.Bx,this.By);
		this.sectionId=Connector.sectionIndex;
//		System.err.println("joining ON "+TO);
		for (Connector candidate : Connector.indexNodes.get(TO)){
//			if (candidate==this) continue; // this one will be in the list, the connectors are bidercitional
//			if (candidate==origin) break;  // we're in a circle			
			if (candidate.sectionId == 0 && // skip already processed
					candidate.tripIds.equals(this.tripIds)){
				candidate.joinSame(origin,this);
			}
		}		
		return this;
	}

	// Make a coordinate array
	// should be called with the start node from findFirst
	// must also call joinSame first to fill in the sectionId
	public ArrayList<double[]> lineCoords(ArrayList<double[]> coords,Connector from){
		double[] coord=new double[2];
		String TO;	
		if (from != null && from.Bx==this.Bx && from.By==this.By){// this one is backwards
			System.err.println("assertion failure");
			this.flip();
		} 
		TO=CoordString(this.Bx,this.By);			
		coord[0]=this.Ax;
		coord[1]=this.Ay;
		coords.add(coord);
		this.lined=true;
//		System.err.println("lining TO "+TO);

		boolean found=false; // flag to see if there was anything later 
		for (Connector candidate : Connector.indexNodes.get(TO)){
			if (candidate == this) continue;
			// if should be a finite set, so we dont need to test if we've hoit the origin
			if (!candidate.lined && candidate.sectionId == this.sectionId){
				found=true;
				candidate.lineCoords(coords,this);
			}
		}
		if (!found){ // this is the last one, so remember to add the B point
			double[] end=new double[2];
			end[0]=this.Bx;
			end[1]=this.By;
			coords.add(end);
		}
		return (coords);
	}	
}
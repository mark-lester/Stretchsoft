package tables;
import javax.persistence.*;
import java.util.*;
import java.text.SimpleDateFormat;
import java.text.ParseException;

@Entity
@Table(name = "shapes")

public class Shapes extends GtfsBase {

String shapeId;
double shapePtLat;
double shapePtLon;
int shapePtSequence;
double shapeDistTraveled;
public Shapes(){}

public Shapes(
		String shapeId,
		double shapePtLat,
		double shapePtLon,
		int shapePtSequence,
		double shapeDistTraveled
		){
		this.shapeId=shapeId;
		this.shapePtLat=shapePtLat;
		this.shapePtLon=shapePtLon;
		this.shapePtSequence=shapePtSequence;
		this.shapeDistTraveled=shapeDistTraveled;
	}

public Shapes(Hashtable <String,String> record){
	this.update(record);
}

public void update(Hashtable <String,String> record){
		this.shapeId=record.get("shapeId");
		this.shapePtLat=Double.parseDouble(record.get("shapePtLat"));
		this.shapePtLon=Double.parseDouble(record.get("shapePtLon"));
		this.shapePtSequence=Integer.parseInt(record.get("shapePtSequence"));
		this.shapeDistTraveled=Double.parseDouble(record.get("shapeDistTraveled"));
	}

public void setshapeId(String shapeId){
		this.shapeId = shapeId;
	}

public String getshapeId(){
		return this.shapeId;
	}
public void setshapePtLat(double shapePtLat){
		this.shapePtLat = shapePtLat;
	}

public double getshapePtLat(){
		return this.shapePtLat;
	}
public void setshapePtLon(double shapePtLon){
		this.shapePtLon = shapePtLon;
	}

public double getshapePtLon(){
		return this.shapePtLon;
	}
public void setshapePtSequence(int shapePtSequence){
		this.shapePtSequence = shapePtSequence;
	}

public int getshapePtSequence(){
		return this.shapePtSequence;
	}
public void setshapeDistTraveled(double shapeDistTraveled){
		this.shapeDistTraveled = shapeDistTraveled;
	}

public double getshapeDistTraveled(){
		return this.shapeDistTraveled;
	}
}

package tables;
import javax.persistence.*;
import java.util.*;


@Entity
@Table(name = "imported_stops")

public class ImportedStops extends GtfsBase {

String osmNodeId;
int stopsHibernateId;
public ImportedStops(){}

public ImportedStops(
        String osmNodeId,
        String stopsHibernateId
        ){
        this.osmNodeId=osmNodeId;
        try{
            this.stopsHibernateId=Integer.parseInt(stopsHibernateId);
        } catch (NumberFormatException ex){
//            System.err.println(ex);       
        }
}

public ImportedStops(Hashtable <String,String> record){
    this.update(record);
}

public void update(Hashtable <String,String> record){
        this.osmNodeId=record.get("osmNodeId");
        try{
            this.stopsHibernateId=Integer.parseInt(record.get("stopsHibernateId"));
        } catch (NumberFormatException ex){
//            System.err.println(ex);       
        }
       
    }

public void setosmNodeId(String osmNodeId){
	this.osmNodeId = osmNodeId;
}

public String getosmNodeId(){
	return this.osmNodeId;
}


public void setstopsHibernateId(int stopsHibernateId){
	this.stopsHibernateId = stopsHibernateId;
}

public int getstopsHibernateId(){
	return this.stopsHibernateId;
}


}
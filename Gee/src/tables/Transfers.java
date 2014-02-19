package tables;
import javax.persistence.*;
import java.util.*;
import java.text.SimpleDateFormat;
import java.text.ParseException;

@Entity
@Table(name = "transfers")

public class Transfers extends GtfsBase {

String fromStopId;
String toStopId;
int transferType;
int minTransferTime;
public Transfers(){}

public Transfers(
		String fromStopId,
		String toStopId,
		int transferType,
		int minTransferTime
		){
		this.fromStopId=fromStopId;
		this.toStopId=toStopId;
		this.transferType=transferType;
		this.minTransferTime=minTransferTime;
	}

public Transfers(Hashtable <String,String> record){
	this.update(record);
}

public void update(Hashtable <String,String> record){
		this.fromStopId=record.get("fromStopId");
		this.toStopId=record.get("toStopId");
		this.transferType=Integer.parseInt(record.get("transferType"));
		this.minTransferTime=Integer.parseInt(record.get("minTransferTime"));
	}

public void setfromStopId(String fromStopId){
		this.fromStopId = fromStopId;
	}

public String getfromStopId(){
		return this.fromStopId;
	}
public void settoStopId(String toStopId){
		this.toStopId = toStopId;
	}

public String gettoStopId(){
		return this.toStopId;
	}
public void settransferType(int transferType){
		this.transferType = transferType;
	}

public int gettransferType(){
		return this.transferType;
	}
public void setminTransferTime(int minTransferTime){
		this.minTransferTime = minTransferTime;
	}

public int getminTransferTime(){
		return this.minTransferTime;
	}
}

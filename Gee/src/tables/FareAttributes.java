package tables;
import javax.persistence.*;
import java.util.*;
import java.text.SimpleDateFormat;
import java.text.ParseException;

@Entity
@Table(name = "fare_attributes")

public class FareAttributes extends GtfsBase {

String fareId;
String pricE;
String currencyType;
boolean paymentMethod;
int transferS;
int transferDuration;
public FareAttributes(){}

public FareAttributes(
		String fareId,
		String pricE,
		String currencyType,
		boolean paymentMethod,
		int transferS,
		int transferDuration
		){
		this.fareId=fareId;
		this.pricE=pricE;
		this.currencyType=currencyType;
		this.paymentMethod=paymentMethod;
		this.transferS=transferS;
		this.transferDuration=transferDuration;
	}

public FareAttributes(Hashtable <String,String> record){
	this.update(record);
}

public void update(Hashtable <String,String> record){
		this.fareId=record.get("fareId");
		this.pricE=record.get("pricE");
		this.currencyType=record.get("currencyType");
		this.transferS=Integer.parseInt(record.get("transferS"));
		this.transferDuration=Integer.parseInt(record.get("transferDuration"));
	}

public void setfareId(String fareId){
		this.fareId = fareId;
	}

public String getfareId(){
		return this.fareId;
	}
public void setpricE(String pricE){
		this.pricE = pricE;
	}

public String getpricE(){
		return this.pricE;
	}
public void setcurrencyType(String currencyType){
		this.currencyType = currencyType;
	}

public String getcurrencyType(){
		return this.currencyType;
	}
public void setpaymentMethod(boolean paymentMethod){
		this.paymentMethod = paymentMethod;
	}

public boolean getpaymentMethod(){
		return this.paymentMethod;
	}
public void settransferS(int transferS){
		this.transferS = transferS;
	}

public int gettransferS(){
		return this.transferS;
	}
public void settransferDuration(int transferDuration){
		this.transferDuration = transferDuration;
	}

public int gettransferDuration(){
		return this.transferDuration;
	}
}

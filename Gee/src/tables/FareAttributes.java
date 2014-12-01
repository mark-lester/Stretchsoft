
package tables;
import javax.persistence.*;
import java.util.*;
import java.text.SimpleDateFormat;
import java.text.ParseException;

@Entity
@Table(name = "fare_attributes")

public class FareAttributes extends GtfsBase {

String fareId="";
String pricE="";
String currencyType="";
int paymentMethod=0;
String transferS="";
String transferDuration="";
public FareAttributes(){}

public FareAttributes(
		String fareId,
		String pricE,
		String currencyType,
		int paymentMethod,
		String transferS,
		String transferDuration
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
		this.paymentMethod=Integer.parseInt(record.get("paymentMethod"));
		this.currencyType=record.get("currencyType");
		this.transferS=record.get("transferS");
		this.transferDuration=record.get("transferDuration");
	}

public Hashtable <String,String> hash(){
	Hashtable <String,String> record=new Hashtable<String,String> ();
	record.put("fareId",this.fareId);
	record.put("pricE",this.pricE);
	record.put("pricE",this.pricE);
	record.put("paymentMethod",Integer.toString(this.paymentMethod));
	record.put("transferS",this.transferS);
	record.put("transferDuration",this.transferDuration);

	return record;
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
public void setpaymentMethod(int paymentMethod){
		this.paymentMethod = paymentMethod;
	}

public int getpaymentMethod(){
		return this.paymentMethod;
	}
public void settransferS(String transferS){
		this.transferS = transferS;
	}

public String gettransferS(){
		return this.transferS;
	}
public void settransferDuration(String transferDuration){
		this.transferDuration = transferDuration;
	}

public String gettransferDuration(){
		return this.transferDuration;
	}
}

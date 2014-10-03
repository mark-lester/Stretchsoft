package tables;
import javax.persistence.*;

import java.util.*;
import java.text.SimpleDateFormat;
import java.text.ParseException;

@Entity
@Table(name = "calendar")

public class Calendar extends GtfsBase {

String serviceId;
int monDay;
int tuesDay;
int wednesDay;
int thursDay;
int friDay;
int saturDay;
int sunDay;
String startDate;
String endDate;
public Calendar(){}

public Calendar(
		String serviceId,
		int monDay,
		int tuesDay,
		int wednesDay,
		int thursDay,
		int friDay,
		int saturDay,
		int sunDay,
		String startDate,
		String endDate
		){
		this.serviceId=serviceId;
		this.monDay=monDay;
		this.tuesDay=tuesDay;
		this.wednesDay=wednesDay;
		this.thursDay=thursDay;
		this.friDay=friDay;
		this.saturDay=saturDay;
		this.sunDay=sunDay;
		this.startDate=startDate;
		this.endDate=endDate;
	}

public Calendar(Hashtable <String,String> record){
	this.update(record);
}

public void update(Hashtable <String,String> record){
	this.serviceId=record.get("serviceId");
	try {
		this.monDay=Integer.parseInt(record.get("monDay"));
	} catch (NumberFormatException ex){
		System.err.println(ex);		
		this.monDay=0;
	}

	try {
		this.tuesDay=Integer.parseInt(record.get("tuesDay"));
	} catch (NumberFormatException ex){
		System.err.println(ex);		
		this.tuesDay=0;
	}

	try {
		this.wednesDay=Integer.parseInt(record.get("wednesDay"));
	} catch (NumberFormatException ex){
		System.err.println(ex);		
		this.wednesDay=0;
	}

	try {
		this.thursDay=Integer.parseInt(record.get("thursDay"));
	} catch (NumberFormatException ex){
		System.err.println(ex);		
		this.thursDay=0;
	}

	try {
		this.friDay=Integer.parseInt(record.get("friDay"));
	} catch (NumberFormatException ex){
		System.err.println(ex);		
		this.friDay=0;
	}

	try {
		this.saturDay=Integer.parseInt(record.get("saturDay"));
	} catch (NumberFormatException ex){
		System.err.println(ex);		
		this.saturDay=0;
	}

	try {
		this.sunDay=Integer.parseInt(record.get("sunDay"));
	} catch (NumberFormatException ex){
		System.err.println(ex);		
		this.sunDay=0;
	}

	this.startDate = record.get("startDate");
	this.endDate = record.get("endDate");
	}

public Hashtable <String,String>  hash(){
	Hashtable <String,String> record=new Hashtable<String,String> ();

	record.put("serviceId",this.serviceId);
    record.put("monDay",Integer.toString(this.monDay));
    record.put("tuesDay",Integer.toString(this.tuesDay));
    record.put("wednesDay",Integer.toString(this.wednesDay));
    record.put("thursDay",Integer.toString(this.thursDay));
    record.put("friDay",Integer.toString(this.friDay));
    record.put("saturDay",Integer.toString(this.saturDay));
    record.put("sunDay",Integer.toString(this.sunDay));
    record.put("startDate",this.startDate);
    record.put("endDate",this.endDate);
    return record;
}

public void setserviceId(String serviceId){
		this.serviceId = serviceId;
	}

public String getserviceId(){
		return this.serviceId;
	}
public void setmonDay(int monDay){
		this.monDay = monDay;
	}

public int getmonDay(){
		return this.monDay;
	}
public void settuesDay(int tuesDay){
		this.tuesDay = tuesDay;
	}

public int gettuesDay(){
		return this.tuesDay;
	}
public void setwednesDay(int wednesDay){
		this.wednesDay = wednesDay;
	}

public int getwednesDay(){
		return this.wednesDay;
	}
public void setthursDay(int thursDay){
		this.thursDay = thursDay;
	}

public int getthursDay(){
		return this.thursDay;
	}
public void setfriDay(int friDay){
		this.friDay = friDay;
	}

public int getfriDay(){
		return this.friDay;
	}
public void setsaturDay(int saturDay){
		this.saturDay = saturDay;
	}

public int getsaturDay(){
		return this.saturDay;
	}
public void setsunDay(int sunDay){
		this.sunDay = sunDay;
	}

public int getsunDay(){
		return this.sunDay;
	}
public void setstartDate(String startDate){
		this.startDate = startDate;
	}

public String getstartDate(){
		return this.startDate;
	}
public void setendDate(String endDate){
		this.endDate = endDate;
	}

public String getendDate(){
		return this.endDate;
	}
}

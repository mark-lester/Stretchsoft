package rest;

import tables.StopTimes;

public class CustomComparator {

    public int compare(Object a, Object b) {
		   StopTimes ar = (StopTimes)a;
		   StopTimes br = (StopTimes)b;
		   String ast = ar.getarrivalTime();
		   String bst = br.getarrivalTime();
			if (ast.matches("")){
				ast=ar.getdepartureTime();
			}
			if (bst.matches("")){
				bst=br.getdepartureTime();
			}
			// if the time is blank, then preserve stopSequence order
			// and if the time is 00:00:00 then it's a new un-timed stop so insert
			// if AFTER this stopSequence. i.e. set the time to 00:00:00 and the sequence to
			// the one you want to insert it after for a new un-timed stop
			if (ast.matches("") || bst.matches("") || ast.matches("00:00:00") || bst.matches("00:00:00")){
				if (ar.getstopSequence() == br.getstopSequence()){
					if (ast.matches("00:00:00")) return 1;
					if (bst.matches("00:00:00")) return -1;
					return 0;
				}
				return ar.getstopSequence() > br.getstopSequence() ? 1 : -1;  
			}
			return 
				 ast.matches(bst) ? 0 : 
					 ast.compareTo(bst) < 0 ? -1 : 1;
    }
}

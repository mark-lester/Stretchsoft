/*
 * find the table lines from the parent and this, under #table
 * create dialog with row for each record in this entity
 * 
 in Trip
   <div id="table">
    <input id="routeId" size=30 maxlength=30 required><br>
    <input id="tripId" name="tripId" size=20 maxlength=20 required key display>
    <select id="serviceId" name="serviceId" table="Calendar"></select>
    <input id="tripHeadsign" size=30 maxlength=100 required>
    <input id="tripShortName" name="tripShortName" size=60 maxlength=60 >
    <input id="shapeId" name="shapeId" size=60 maxlength=60 >
   </div>
 
 
 in StopTimes
   <div id="table">
    <input id="stopId" name="stopId" readonly><br>
    <input id="arrivalTime" name="arrivalTime"  type=text picker=time required display lessthan="departureTime">
    <input id="departureTime" name="departureTime" type=text picker=time required greaterthan="arrivalTime">
   </div>
   
   will output a tabular form, with the Trip at the top, and a line for each record in the current data set
   with a <input id=row value=$$ROW$$ readonly>
   or maybe
   <div id="row-$$ROW$$>
   
   
   
   
   the pickers need processing, and we need to think about my lassthan.greaterthan as it's assuming unique instance of fields
   
 */

/* "General Transit Feed Specification" Schema
    thankyou to http://github.com/perkinsms/Perl-GTFS/blob/master/load-gtfs.sql for initial field defs

   It's for use with hibernate, hence I have added hibernate_id as a primary key everywhere.
   I've tried to keep the rest of it consistent with the S in GTFS
TODO
   Constraints
*/

/*
CREATE DATABASE IF NOT EXISTS gtfs;
use gtfs;
*/

/* Required GTFS tables */

/*==========================================*/

DROP TABLE IF EXISTS imported_stops;
DROP TABLE IF EXISTS fare_rules;
DROP TABLE IF EXISTS fare_attributes;
DROP TABLE IF EXISTS transfers;
DROP TABLE IF EXISTS frequencies;
DROP TABLE IF EXISTS shapes;
DROP TABLE IF EXISTS stop_times;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS `routes`;
DROP TABLE IF EXISTS `stops`;
DROP TABLE IF EXISTS calendar_dates;
DROP TABLE IF EXISTS calendar;
DROP TABLE IF EXISTS agency;

CREATE TABLE agency (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	gtfs_instance VARCHAR(255) NOT NULL,
	agency_id VARCHAR(255) UNIQUE KEY,
	agency_name VARCHAR(255) NOT NULL,
	agency_url VARCHAR(255) NOT NULL,
	agency_timezone VARCHAR(255) NOT NULL,
	agency_lang VARCHAR(255),
	agency_phone VARCHAR(255)
);
/*==========================================*/


CREATE TABLE `calendar` (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	gtfs_instance VARCHAR(255) NOT NULL,
	service_id VARCHAR(255) NOT NULL UNIQUE KEY,
	monday INTEGER,
	tuesday INTEGER,
	wednesday INTEGER,
	thursday INTEGER,
	friday INTEGER,
	saturday INTEGER,
	sunday INTEGER,
	start_date  VARCHAR(255),	
	end_date  VARCHAR(255)
);


/*==========================================*/


CREATE TABLE `stops` (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	gtfs_instance VARCHAR(255) NOT NULL,
	stop_id VARCHAR(255) NOT NULL UNIQUE KEY,
	stop_code VARCHAR(255),
	stop_name VARCHAR(255) NOT NULL,
	stop_desc VARCHAR(255),
	stop_lat DECIMAL(12,8) NOT NULL,
	stop_lon DECIMAL(12,8) NOT NULL,
	zone_id VARCHAR(255),
	stop_url VARCHAR(255),
	location_type INTEGER,
	parent_station VARCHAR(255),
	KEY `zone_id` (zone_id),
	KEY `stop_lat` (stop_lat),
	KEY `stop_lon` (stop_lon)
);

/*==========================================*/


CREATE TABLE `routes` (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	gtfs_instance VARCHAR(255) NOT NULL,
	route_id VARCHAR(255) NOT NULL UNIQUE KEY,
	agency_id VARCHAR(255) NOT NULL ,
	route_short_name VARCHAR(255),
	route_long_name VARCHAR(255),
	route_desc VARCHAR(255),
	route_type INTEGER,
	route_url VARCHAR(255),
	route_color VARCHAR(255),
	route_text_color VARCHAR(255),
	KEY `agency_id` (agency_id),
	 FOREIGN KEY (agency_id) 
        REFERENCES agency(agency_id)
        on delete cascade on update cascade
);

/*==========================================*/


CREATE TABLE `trips` (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	gtfs_instance VARCHAR(255) NOT NULL,
	trip_id VARCHAR(255) NOT NULL UNIQUE KEY,
	route_id VARCHAR(255) NOT NULL,
	service_id VARCHAR(255) NOT NULL,
	trip_headsign VARCHAR(255),
	trip_short_name VARCHAR(255),
	direction_id INTEGER,
	block_id VARCHAR(255),
	shape_id VARCHAR(255),
	wheelchair_accessible INTEGER,
	KEY `route_id` (route_id),
	KEY `service_id` (service_id),
	KEY `direction_id` (direction_id),
	KEY `block_id` (block_id),
	FOREIGN KEY (route_id) references routes(route_id) on delete cascade on update cascade,
	FOREIGN KEY (service_id) references calendar(service_id)
);

/*==========================================*/


CREATE TABLE `stop_times` (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	gtfs_instance VARCHAR(255) NOT NULL,
	trip_id VARCHAR(255) NOT NULL,
	arrival_time VARCHAR(255),
	departure_time VARCHAR(255),
	stop_id VARCHAR(255) NOT NULL,
	stop_sequence SMALLINT UNSIGNED NOT NULL,
	stop_headsign VARCHAR(255),
	pickup_type INTEGER,
	drop_off_type INTEGER,
	shape_dist_traveled DECIMAL(10,4) DEFAULT 0,
	KEY `trip_id` (trip_id),
	KEY `stop_id` (stop_id),
	KEY `stop_trip_id` (stop_id,trip_id),
	KEY `trip_stop_id` (trip_id,stop_id),
	KEY `stop_sequence` (stop_sequence),
	KEY `pickup_type` (pickup_type),
	KEY `drop_off_type` (drop_off_type),
	FOREIGN KEY (trip_id) references trips(trip_id) on delete cascade on update cascade,
	FOREIGN KEY (stop_id) references stops(stop_id) on delete cascade on update cascade
)ENGINE=InnoDB;

/*==========================================*/

/* Optional GTFS tables */

DROP TABLE IF EXISTS calendar_dates;

CREATE TABLE `calendar_dates` (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	gtfs_instance VARCHAR(255) NOT NULL,
	service_id VARCHAR(255) NOT NULL,
	`date`  VARCHAR(255) ,
	exception_type INTEGER,
	KEY `service_id` (service_id),
	KEY `exception_type` (exception_type),
	FOREIGN KEY (service_id) references calendar(service_id) on delete cascade on update cascade
);

/*==========================================*/


CREATE TABLE fare_attributes (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	gtfs_instance VARCHAR(255) NOT NULL,
	fare_id VARCHAR(255) NOT NULL UNIQUE KEY,
	price VARCHAR(255) NOT NULL,
	currency_type VARCHAR(255) NOT NULL,
	payment_method INTEGER,
	transfers VARCHAR(255),
	transfer_duration VARCHAR(255) 
);

/*==========================================*/


CREATE TABLE fare_rules (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	gtfs_instance VARCHAR(255) NOT NULL,
	fare_id VARCHAR(255),
	route_id VARCHAR(255),
	origin_id VARCHAR(255),
	destination_id VARCHAR(255),
	contains_id VARCHAR(255)/*,
	FOREIGN KEY (fare_id) references fares(fare_id),
	FOREIGN KEY (route_id) references routes(route_id),*/
);

/*==========================================*/


CREATE TABLE shapes (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	gtfs_instance VARCHAR(255) NOT NULL,
	shape_id VARCHAR(255) NOT NULL,
	shape_pt_lat DECIMAL(12,8) NOT NULL,
	shape_pt_lon DECIMAL(12,8) NOT NULL,
	shape_pt_sequence INT UNSIGNED NOT NULL, 
	shape_dist_traveled DECIMAL(10,4),
	KEY `shape_id` (shape_id)
);

/*==========================================*/


CREATE TABLE frequencies (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	gtfs_instance VARCHAR(255) NOT NULL,
	trip_id VARCHAR(255) NOT NULL,
	start_time VARCHAR(255) NOT NULL,
	end_time VARCHAR(255) NOT NULL,
	headway_secs MEDIUMINT NOT NULL,
	FOREIGN KEY (trip_id) references trips(trip_id) on delete cascade on update cascade
);

/*==========================================*/


CREATE TABLE transfers (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	gtfs_instance VARCHAR(255) NOT NULL,
	from_stop_id VARCHAR(255) NOT NULL,
	to_stop_id VARCHAR(255) NOT NULL,
	transfer_type VARCHAR(255),
	min_transfer_time VARCHAR(255),
	FOREIGN KEY (from_stop_id) references stops(stop_id) on delete cascade on update cascade,
	FOREIGN KEY (to_stop_id) references stops(stop_id) on delete cascade on update cascade
);

/*==========================================*/
/* internal table for management of imports from OSM */

CREATE TABLE imported_stops (
    hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	gtfs_instance VARCHAR(255) NOT NULL,
    osm_node_id VARCHAR(255) NOT NULL,
    stops_hibernate_id INTEGER NOT NULL
);

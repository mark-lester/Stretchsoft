/* "General Transit Feed Specification" Schema
    thankyou to http://github.com/perkinsms/Perl-GTFS/blob/master/load-gtfs.sql for initial field defs

   It's for use with hibernate, hence I have added hibernate_id as a primary key everywhere.
   I've tried to keep the rest of it consistent with the S in GTFS
TODO
   Constraints
   Pattern support (not by hacking the base tables) 
*/

CREATE DATABASE IF NOT EXISTS test;
use test;

/* Required GTFS tables */

/*==========================================*/

DROP TABLE IF EXISTS `agency`;

CREATE TABLE `agency` (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	agency_id VARCHAR(255),
	agency_name VARCHAR(255) NOT NULL,
	agency_url VARCHAR(255) NOT NULL,
	agency_timezone VARCHAR(255) NOT NULL,
	agency_lang VARCHAR(255),
	agency_phone VARCHAR(255)
);

/*==========================================*/

DROP TABLE IF EXISTS `stops`;

CREATE TABLE `stops` (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	stop_id VARCHAR(255) NOT NULL UNIQUE KEY,
	stop_code VARCHAR(255),
	stop_name VARCHAR(255) NOT NULL,
	stop_desc VARCHAR(255),
	stop_lat DECIMAL(12,8) NOT NULL,
	stop_lon DECIMAL(12,8) NOT NULL,
	zone_id VARCHAR(255),
	stop_url VARCHAR(255),
	location_type ENUM ('0','1',''),
	parent_station VARCHAR(255),
	KEY `zone_id` (zone_id),
	KEY `stop_lat` (stop_lat),
	KEY `stop_lon` (stop_lon)
);

/*==========================================*/

DROP TABLE IF EXISTS `routes`;

CREATE TABLE `routes` (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	route_id VARCHAR(255) NOT NULL UNIQUE KEY,
	agency_id VARCHAR(255),
	route_short_name VARCHAR(255),
	route_long_name VARCHAR(255),
	route_desc VARCHAR(255),
	route_type ENUM ('0','1','2','3','4','5','6','7') NOT NULL,
	route_url VARCHAR(255),
	route_color VARCHAR(255),
	route_text_color VARCHAR(255)
);

/*==========================================*/

DROP TABLE IF EXISTS trips;

CREATE TABLE `trips` (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	trip_id VARCHAR(255) NOT NULL UNIQUE KEY,
	route_id VARCHAR(255) NOT NULL,
	service_id VARCHAR(255) NOT NULL,
	trip_headsign VARCHAR(255),
	trip_short_name VARCHAR(255),
	direction_id ENUM ('0','1',''),
	block_id VARCHAR(255),
	shape_id VARCHAR(255),
	KEY `route_id` (route_id),
	KEY `service_id` (service_id),
	KEY `direction_id` (direction_id),
	KEY `block_id` (block_id)
);

/*==========================================*/

DROP TABLE IF EXISTS stop_times;

CREATE TABLE `stop_times` (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	trip_id VARCHAR(255) NOT NULL,
	arrival_time TIME,
	departure_time TIME,
	stop_id VARCHAR(255) NOT NULL,
	stop_sequence SMALLINT UNSIGNED NOT NULL,
	stop_headsign VARCHAR(255),
	pickup_type ENUM ('0','1','2','3',''),
	drop_off_type ENUM ('0','1','2','3',''),
	shape_dist_traveled DECIMAL(10,4) DEFAULT 0,
	KEY `trip_id` (trip_id),
	KEY `stop_id` (stop_id),
	KEY `stop_sequence` (stop_sequence),
	KEY `pickup_type` (pickup_type),
	KEY `drop_off_type` (drop_off_type)
);

/*==========================================*/

DROP TABLE IF EXISTS calendar;

CREATE TABLE `calendar` (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	service_id VARCHAR(255) NOT NULL UNIQUE KEY,
	monday ENUM ('0','1') NOT NULL,
	tuesday ENUM ('0','1') NOT NULL,
	wednesday ENUM ('0','1') NOT NULL,
	thursday ENUM ('0','1') NOT NULL,
	friday ENUM ('0','1') NOT NULL,
	saturday ENUM ('0','1') NOT NULL,
	sunday ENUM ('0','1') NOT NULL,
	start_date DATE NOT NULL,	
	end_date DATE NOT NULL
);
/*==========================================*/

/* Optional GTFS tables */

DROP TABLE IF EXISTS calendar_dates;

CREATE TABLE `calendar_dates` (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	service_id VARCHAR(255) NOT NULL,
	`date` DATE NOT NULL,
	exception_type ENUM ('1','2') NOT NULL,
	KEY `service_id` (service_id),
	KEY `exception_type` (exception_type)    
);

/*==========================================*/

DROP TABLE IF EXISTS fare_attributes;

CREATE TABLE fare_attributes (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	fare_id VARCHAR(255) NOT NULL,
	price VARCHAR(255) NOT NULL,
	currency_type VARCHAR(255) NOT NULL,
	payment_method ENUM ('0','1') NOT NULL,
	transfers ENUM ('0','1','2',''),
	transfer_duration MEDIUMINT UNSIGNED
);

/*==========================================*/

DROP TABLE IF EXISTS fare_rules;

CREATE TABLE fare_rules (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	fare_id VARCHAR(255) NOT NULL,
	route_id VARCHAR(255),
	origin_id VARCHAR(255),
	destination_id VARCHAR(255),
	contains_id VARCHAR(255)
);

/*==========================================*/

DROP TABLE IF EXISTS shapes;

CREATE TABLE shapes (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	shape_id VARCHAR(255) NOT NULL,
	shape_pt_lat DECIMAL(12,8) NOT NULL,
	shape_pt_lon DECIMAL(12,8) NOT NULL,
	shape_pt_sequence SMALLINT UNSIGNED NOT NULL, 
	shape_dist_traveled DECIMAL(10,4)
);

/*==========================================*/

DROP TABLE IF EXISTS frequencies;

CREATE TABLE frequencies (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	trip_id VARCHAR(255) NOT NULL,
	start_time TIME NOT NULL,
	end_time TIME NOT NULL,
	headway_secs MEDIUMINT NOT NULL
);

/*==========================================*/

DROP TABLE IF EXISTS transfers;

CREATE TABLE transfers (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	from_stop_id VARCHAR(255) NOT NULL,
	to_stop_id VARCHAR(255) NOT NULL,
	transfer_type ENUM ('0','1','2','3') NOT NULL,
	min_transfer_time MEDIUMINT NOT NULL
);

/*==========================================*/

/* Gee Admin Database Schema
 * 
Instance
	Database Name
	Owner (User Name)
	Public Read flag
	Public Edit Flag

User
	universal login type
	User Name
	Email

Access
	Database Name
	User Name
	Edit flag
	Admin flag

Invite
	From user
	To user
	For database
	Grant edit
	Grant admin
	Magic key
	Date of invitation


  TODO
  
 */

CREATE DATABASE IF NOT EXISTS admin;
use admin;

/* Required GTFS tables */

/*==========================================*/
/*
 * Instance
	Database Name
	Owner (User Name)
	Public Read flag
	Public Edit Flag
*/
DROP TABLE IF EXISTS `instance`;

CREATE TABLE `instance` (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	database_name VARCHAR(255)  NOT NULL UNIQUE KEY ,
	github_name VARCHAR(255)  NOT NULL UNIQUE KEY ,
	description VARCHAR(255),	
	owner_user_id VARCHAR(255) NOT NULL,
	public_read INTEGER,
	public_write INTEGER
);

/*==========================================*/
/*
User
    User Id
	universal login type
	User Name
	Email
*/
DROP TABLE IF EXISTS `users`; /* user is a keyword, so have to use plural */

CREATE TABLE `users` (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	user_id VARCHAR(255)  NOT NULL UNIQUE KEY,
	login_type VARCHAR(255),
	user_name VARCHAR(255),
	email VARCHAR(255)
);

/*==========================================*/
/*
Access
	Database Name
	User Id
	Edit flag
	Admin flag

*/
DROP TABLE IF EXISTS `access`; 

CREATE TABLE `access` (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	database_name VARCHAR(255) NOT NULL,
	user_id VARCHAR(255),
	edit_flag INTEGER,
	admin_flag INTEGER
);

/*==========================================*/
/*
Invite
	From user
	To user
	For database
	Grant edit
	Grant admin
	Magic key
	Date of invitation
*/
DROP TABLE IF EXISTS `invite`; 

CREATE TABLE `invite` (
	hibernate_id INTEGER NOT NULL AUTO_INCREMENT, PRIMARY KEY (hibernate_id),
	from_user_id VARCHAR(255) NOT NULL,
	to_user_id VARCHAR(255) NOT NULL,
	database_name VARCHAR(255) NOT NULL,
	access_key VARCHAR(255) NOT NULL,
	grant_edit_flag INTEGER,
	grant_admin_flag INTEGER
);


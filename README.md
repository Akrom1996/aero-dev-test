create database aero;
use aero;

create table users (
id varchar(255) NOT NULL PRIMARY KEY,
password varchar(255) NOT NULL
);

create table tokens (
	id INT AUTO_INCREMENT PRIMARY KEY,
    bearer_token varchar(255),
    refresh_token varchar(255),
    user_id varchar(255),
    foreign key (user_id) references users(id)
);

create table files (
	id INT AUTO_INCREMENT PRIMARY KEY,
    file_name varchar(255),
    extension varchar(255),
    mime_type varchar(100),
    size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id varchar(255),
    foreign key (user_id) references users(id)
);

create table blocked_tokens (
 	id INT AUTO_INCREMENT PRIMARY KEY,
     bearer_token varchar(255),
     refresh_token varchar(255)
);

select * from users;
select * from tokens;
select * from blocked_tokens;
select * from files;
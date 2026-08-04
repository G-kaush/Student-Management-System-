create table if not exists courses (
    id bigserial primary key,
    code varchar(30) not null unique,
    name varchar(100) not null,
    description varchar(500)
);

create table if not exists users (
    id bigserial primary key,
    username varchar(100) not null unique,
    email varchar(150) not null unique,
    password_hash varchar(255) not null,
    role varchar(20) not null check (role in ('ADMIN', 'INSTRUCTOR'))
);

create table if not exists students (
    id bigserial primary key,
    student_number varchar(30) not null unique,
    first_name varchar(100) not null,
    last_name varchar(100) not null,
    email varchar(150) not null unique,
    phone varchar(30),
    course_id bigint not null references courses(id)
);

create index if not exists idx_students_course_id
    on students(course_id);

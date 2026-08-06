drop table if exists enrollments cascade;
drop table if exists courses cascade;
drop table if exists students cascade;
drop table if exists users cascade;

create table users (
    id bigserial primary key,
    username varchar(100) not null unique,
    email varchar(150) not null unique,
    password_hash varchar(255) not null,
    role varchar(20) not null check (role in ('ADMIN', 'INSTRUCTOR', 'STUDENT')),
    approved boolean not null default true
);

create unique index uk_single_admin
    on users ((role))
    where role = 'ADMIN';

create index idx_users_role
    on users(role);

create index idx_users_role_approved
    on users(role, approved);

create table courses (
    id bigserial primary key,
    code varchar(30) not null unique,
    name varchar(100) not null,
    description varchar(500),
    instructor_id bigint not null references users(id)
);

create index idx_courses_instructor_id
    on courses(instructor_id);

create table enrollments (
    id bigserial primary key,
    student_user_id bigint not null references users(id),
    course_id bigint not null references courses(id),
    enrolled_at timestamptz not null default now(),
    constraint uk_enrollments_student_course
        unique (student_user_id, course_id)
);

create index idx_enrollments_student_user_id
    on enrollments(student_user_id);

create index idx_enrollments_course_id
    on enrollments(course_id);

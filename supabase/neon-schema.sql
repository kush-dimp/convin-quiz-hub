-- ══════════════════════════════════════════════════════════════
-- QuizPlatform – Neon Postgres Schema
-- Run this entire file in the Neon SQL Editor (once)
-- ══════════════════════════════════════════════════════════════

-- Extensions
create extension if not exists "pg_trgm";


-- ══════════════════════════════════════════════════════════════
-- ENUMS
-- ══════════════════════════════════════════════════════════════
create type user_role      as enum ('super_admin','admin','instructor','reviewer','student','guest');
create type user_status    as enum ('active','inactive','pending');
create type quiz_status    as enum ('draft','published','archived');
create type question_type  as enum ('mcq_single','mcq_multi','true_false','fill_blank','short','essay','matching','ordering','rating','matrix');
create type difficulty_lvl as enum ('Easy','Medium','Hard','Expert');
create type assign_type    as enum ('all','group','user');
create type assign_status  as enum ('active','overdue','completed');
create type notif_type     as enum ('assignment','reminder','result','certificate','overdue','system','feedback');
create type audit_severity as enum ('info','warning','error','critical');
create type attempt_status as enum ('in_progress','submitted','graded','abandoned');


-- ══════════════════════════════════════════════════════════════
-- PROFILES  (standalone — no auth.users FK)
-- ══════════════════════════════════════════════════════════════
create table profiles (
  id           uuid primary key default gen_random_uuid(),
  name         text         not null,
  email        text         not null unique,
  role         user_role    not null default 'student',
  status       user_status  not null default 'pending',
  department   text,
  avatar_url   text,
  last_login   timestamptz,
  created_at   timestamptz  not null default now(),
  updated_at   timestamptz  not null default now()
);

create table profile_stats (
  user_id       uuid primary key references profiles(id) on delete cascade,
  quizzes_taken int          not null default 0,
  certificates  int          not null default 0,
  avg_score     numeric(5,2),
  badges        text[]       not null default '{}'
);


-- ══════════════════════════════════════════════════════════════
-- GROUPS
-- ══════════════════════════════════════════════════════════════
create table groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table group_members (
  group_id uuid references groups(id)   on delete cascade,
  user_id  uuid references profiles(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index idx_group_members_user on group_members(user_id);


-- ══════════════════════════════════════════════════════════════
-- PERMISSIONS / ROLES
-- ══════════════════════════════════════════════════════════════
create table permissions (
  id    text primary key,
  label text not null
);

create table role_permissions (
  role       user_role,
  permission text references permissions(id) on delete cascade,
  primary key (role, permission)
);


-- ══════════════════════════════════════════════════════════════
-- QUIZZES
-- ══════════════════════════════════════════════════════════════
create table quizzes (
  id            uuid        primary key default gen_random_uuid(),
  title         text        not null,
  description   text,
  instructor_id uuid        not null references profiles(id) on delete restrict,
  category      text,
  status        quiz_status not null default 'draft',
  tags          text[]      not null default '{}',
  is_private    boolean     not null default false,
  thumbnail_url text,
  -- settings
  time_limit_mins          int,
  max_attempts             int,
  passing_score_pct        numeric(5,2) default 70,
  shuffle_questions        boolean default false,
  shuffle_options          boolean default false,
  show_results_immediately boolean default true,
  show_correct_answers     boolean default true,
  allow_review             boolean default true,
  certificate_enabled      boolean default false,
  certificate_template     text,
  password_protected       boolean default false,
  access_password          text,
  require_proctoring       boolean default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_quizzes_instructor  on quizzes(instructor_id);
create index idx_quizzes_status      on quizzes(status);
create index idx_quizzes_category    on quizzes(category);
create index idx_quizzes_tags        on quizzes using gin(tags);
create index idx_quizzes_title_trgm  on quizzes using gin(title gin_trgm_ops);

create table quiz_stats (
  quiz_id  uuid primary key references quizzes(id) on delete cascade,
  views    int not null default 0,
  previews int not null default 0,
  reports  int not null default 0
);


-- ══════════════════════════════════════════════════════════════
-- QUIZ VERSIONS
-- ══════════════════════════════════════════════════════════════
create table quiz_versions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references quizzes(id) on delete cascade,
  version_num int  not null,
  summary     text not null,
  changes     jsonb not null default '{}',
  is_auto_save boolean not null default false,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique(quiz_id, version_num)
);

create index idx_quiz_versions_quiz on quiz_versions(quiz_id, version_num desc);


-- ══════════════════════════════════════════════════════════════
-- QUESTIONS
-- ══════════════════════════════════════════════════════════════
create table questions (
  id           uuid          primary key default gen_random_uuid(),
  quiz_id      uuid          references quizzes(id) on delete cascade,
  position     int,
  type         question_type not null,
  text         text          not null,
  rich_text    text,
  points       int           not null default 10,
  difficulty   difficulty_lvl,
  topic        text,
  explanation  text,
  time_limit_s int,
  payload      jsonb         not null default '{}',
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz   not null default now(),
  updated_at   timestamptz   not null default now()
);

create index idx_questions_quiz       on questions(quiz_id, position);
create index idx_questions_bank       on questions(quiz_id) where quiz_id is null;
create index idx_questions_type       on questions(type);
create index idx_questions_topic      on questions(topic);
create index idx_questions_difficulty on questions(difficulty);
create index idx_questions_text_trgm  on questions using gin(text gin_trgm_ops);


-- ══════════════════════════════════════════════════════════════
-- TEMPLATES
-- ══════════════════════════════════════════════════════════════
create table templates (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  description    text,
  category       text,
  question_count int  not null default 0,
  estimated_mins int,
  rating         numeric(3,1),
  rating_count   int  not null default 0,
  uses           int  not null default 0,
  author         text,
  is_official    boolean not null default false,
  is_community   boolean not null default false,
  tags           text[]  not null default '{}',
  thumbnail_url  text,
  questions_json jsonb   not null default '[]',
  created_at     timestamptz not null default now()
);

create index idx_templates_category on templates(category);


-- ══════════════════════════════════════════════════════════════
-- ASSIGNMENTS
-- ══════════════════════════════════════════════════════════════
create table assignments (
  id              uuid          primary key default gen_random_uuid(),
  quiz_id         uuid          not null references quizzes(id) on delete cascade,
  assign_type     assign_type   not null default 'all',
  target_user_id  uuid          references profiles(id) on delete cascade,
  target_group_id uuid          references groups(id)   on delete cascade,
  due_date        date,
  required        boolean       not null default true,
  recurring       boolean       not null default false,
  recurring_interval text,
  prerequisite_id uuid          references assignments(id) on delete set null,
  created_by      uuid          references profiles(id)   on delete set null,
  created_at      timestamptz   not null default now(),
  completed_count int           not null default 0,
  total_count     int           not null default 0,
  status          assign_status not null default 'active',
  constraint chk_assign_target check (
    (assign_type = 'all'   and target_user_id is null  and target_group_id is null) or
    (assign_type = 'user'  and target_user_id is not null and target_group_id is null) or
    (assign_type = 'group' and target_group_id is not null and target_user_id is null)
  )
);

create index idx_assignments_quiz   on assignments(quiz_id);
create index idx_assignments_user   on assignments(target_user_id);
create index idx_assignments_group  on assignments(target_group_id);
create index idx_assignments_status on assignments(status);
create index idx_assignments_due    on assignments(due_date);


-- ══════════════════════════════════════════════════════════════
-- QUIZ ATTEMPTS
-- ══════════════════════════════════════════════════════════════
create table quiz_attempts (
  id             uuid           primary key default gen_random_uuid(),
  quiz_id        uuid           not null references quizzes(id)  on delete cascade,
  user_id        uuid           not null references profiles(id) on delete cascade,
  assignment_id  uuid           references assignments(id) on delete set null,
  attempt_number int            not null default 1,
  status         attempt_status not null default 'in_progress',
  started_at     timestamptz    not null default now(),
  submitted_at   timestamptz,
  time_taken_s   int,
  score_pct      numeric(5,2),
  points_earned  int,
  total_points   int,
  passed         boolean,
  flagged        boolean        not null default false,
  flag_reason    text,
  tab_switches   int            not null default 0,
  paste_count    int            not null default 0,
  ip_address     inet,
  user_agent     text,
  graded_at      timestamptz,
  graded_by      uuid references profiles(id) on delete set null
);

create index idx_attempts_quiz    on quiz_attempts(quiz_id);
create index idx_attempts_user    on quiz_attempts(user_id);
create index idx_attempts_status  on quiz_attempts(status);
create index idx_attempts_flagged on quiz_attempts(flagged) where flagged = true;
create index idx_attempts_date    on quiz_attempts(submitted_at desc);


-- ══════════════════════════════════════════════════════════════
-- ATTEMPT ANSWERS
-- ══════════════════════════════════════════════════════════════
create table attempt_answers (
  id            uuid primary key default gen_random_uuid(),
  attempt_id    uuid not null references quiz_attempts(id) on delete cascade,
  question_id   uuid not null references questions(id)     on delete cascade,
  answer        jsonb,
  is_correct    boolean,
  points_earned int  not null default 0,
  time_spent_s  int,
  marked_review boolean not null default false,
  unique(attempt_id, question_id)
);

create index idx_answers_attempt  on attempt_answers(attempt_id);
create index idx_answers_question on attempt_answers(question_id);


-- ══════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ══════════════════════════════════════════════════════════════
create table notifications (
  id            uuid       primary key default gen_random_uuid(),
  user_id       uuid       not null references profiles(id) on delete cascade,
  type          notif_type not null,
  title         text       not null,
  body          text       not null,
  read          boolean    not null default false,
  resource_type text,
  resource_id   uuid,
  created_at    timestamptz not null default now()
);

create index idx_notifications_user   on notifications(user_id, read);
create index idx_notifications_recent on notifications(user_id, created_at desc);


-- ══════════════════════════════════════════════════════════════
-- AUDIT LOGS
-- ══════════════════════════════════════════════════════════════
create table audit_logs (
  id         uuid           primary key default gen_random_uuid(),
  user_id    uuid           references profiles(id) on delete set null,
  user_name  text,
  action     text           not null,
  resource   text,
  severity   audit_severity not null default 'info',
  ip_address inet,
  metadata   jsonb,
  created_at timestamptz    not null default now()
);

create index idx_audit_severity    on audit_logs(severity);
create index idx_audit_action      on audit_logs(action);
create index idx_audit_user        on audit_logs(user_id);
create index idx_audit_recent      on audit_logs(created_at desc);
create index idx_audit_action_trgm on audit_logs using gin(action gin_trgm_ops);


-- ══════════════════════════════════════════════════════════════
-- CERTIFICATES
-- ══════════════════════════════════════════════════════════════
create table certificates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id)      on delete cascade,
  quiz_id    uuid not null references quizzes(id)       on delete cascade,
  attempt_id uuid not null references quiz_attempts(id) on delete cascade,
  issued_at  timestamptz not null default now(),
  expires_at timestamptz,
  cert_url   text,
  unique(user_id, quiz_id)
);

create index idx_certs_user on certificates(user_id);


-- ══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ══════════════════════════════════════════════════════════════

-- 1. Auto-update updated_at columns
create or replace function set_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_quizzes_updated_at
  before update on quizzes for each row execute function set_updated_at();
create trigger trg_questions_updated_at
  before update on questions for each row execute function set_updated_at();
create trigger trg_profiles_updated_at
  before update on profiles for each row execute function set_updated_at();


-- 2. Auto-create quiz_stats row on new quiz
create or replace function handle_new_quiz()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into quiz_stats(quiz_id) values (new.id)
  on conflict (quiz_id) do nothing;
  return new;
end;
$$;

create trigger trg_on_quiz_created
  after insert on quizzes
  for each row execute function handle_new_quiz();


-- 3. Update profile_stats after attempt is submitted
create or replace function update_profile_stats_on_submit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'submitted' and old.status = 'in_progress' then
    update profile_stats
    set
      quizzes_taken = quizzes_taken + 1,
      avg_score = (
        select avg(score_pct)
        from quiz_attempts
        where user_id = new.user_id
          and status in ('submitted', 'graded')
      )
    where user_id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger trg_attempt_submitted
  after update on quiz_attempts
  for each row execute function update_profile_stats_on_submit();


-- 4. Bump assignment completed_count on submit
create or replace function update_assignment_progress()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'submitted' and old.status = 'in_progress'
     and new.assignment_id is not null then
    update assignments
    set completed_count = completed_count + 1
    where id = new.assignment_id;
  end if;
  return new;
end;
$$;

create trigger trg_assignment_progress
  after update on quiz_attempts
  for each row execute function update_assignment_progress();


-- 5. Auto-issue certificate when attempt passes and certificate_enabled = true
create or replace function auto_issue_certificate()
returns trigger language plpgsql as $$
declare
  quiz_row quizzes%rowtype;
begin
  if new.status = 'submitted' and old.status = 'in_progress'
     and new.passed = true then
    select * into quiz_row from quizzes where id = new.quiz_id;
    if quiz_row.certificate_enabled then
      insert into certificates (user_id, quiz_id, attempt_id)
      values (new.user_id, new.quiz_id, new.id)
      on conflict (user_id, quiz_id) do nothing;

      update profile_stats
      set certificates = certificates + 1
      where user_id = new.user_id
        and not exists (
          select 1 from certificates
          where user_id = new.user_id and quiz_id = new.quiz_id
            and id != (select id from certificates where user_id = new.user_id and quiz_id = new.quiz_id limit 1)
        );
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_auto_certificate
  after update on quiz_attempts
  for each row execute function auto_issue_certificate();


-- ══════════════════════════════════════════════════════════════
-- SEED: default permissions
-- ══════════════════════════════════════════════════════════════
insert into permissions (id, label) values
  ('quiz_create',       'Create Quizzes'),
  ('quiz_publish',      'Publish Quizzes'),
  ('quiz_delete',       'Delete Quizzes'),
  ('question_manage',   'Manage Questions'),
  ('user_manage',       'Manage Users'),
  ('role_assign',       'Assign Roles'),
  ('report_view',       'View Reports'),
  ('audit_view',        'View Audit Logs'),
  ('assignment_create', 'Create Assignments'),
  ('certificate_issue', 'Issue Certificates')
on conflict (id) do nothing;

-- Default permissions per role
insert into role_permissions (role, permission) values
  ('super_admin','quiz_create'), ('super_admin','quiz_publish'), ('super_admin','quiz_delete'),
  ('super_admin','question_manage'), ('super_admin','user_manage'), ('super_admin','role_assign'),
  ('super_admin','report_view'), ('super_admin','audit_view'), ('super_admin','assignment_create'),
  ('super_admin','certificate_issue'),
  ('admin','quiz_create'), ('admin','quiz_publish'), ('admin','quiz_delete'),
  ('admin','question_manage'), ('admin','user_manage'),
  ('admin','report_view'), ('admin','audit_view'), ('admin','assignment_create'),
  ('admin','certificate_issue'),
  ('instructor','quiz_create'), ('instructor','quiz_publish'), ('instructor','question_manage'),
  ('instructor','report_view'), ('instructor','assignment_create'), ('instructor','certificate_issue'),
  ('reviewer','report_view'),
  ('student','quiz_create')
on conflict do nothing;

-- ══════════════════════════════════════════════════════════════
-- SEED: demo admin user
-- ══════════════════════════════════════════════════════════════
insert into profiles (id, name, email, role, status)
values ('00000000-0000-0000-0000-000000000001','Demo Admin','admin@demo.local','super_admin','active')
on conflict (id) do nothing;

insert into profile_stats (user_id)
values ('00000000-0000-0000-0000-000000000001')
on conflict (user_id) do nothing;

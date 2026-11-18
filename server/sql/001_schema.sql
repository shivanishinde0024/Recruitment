SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- MASTERS
-- =========================================================
CREATE TABLE IF NOT EXISTS industries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_industries_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS company_types (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_company_types_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_job_categories_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_titles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NULL,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  KEY idx_job_titles_cat (category_id),
  CONSTRAINT fk_job_titles_cat FOREIGN KEY (category_id) REFERENCES job_categories(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS skills (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_skills_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS qualifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_qualifications_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employment_types (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_employment_types_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS experience_levels (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  min_years DECIMAL(4,1) NULL,
  max_years DECIMAL(4,1) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS candidate_sources (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_candidate_sources_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS countries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  iso_code VARCHAR(3) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS states (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  country_id INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  KEY idx_states_country (country_id),
  CONSTRAINT fk_states_country FOREIGN KEY (country_id) REFERENCES countries(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  state_id INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  KEY idx_cities_state (state_id),
  CONSTRAINT fk_cities_state FOREIGN KEY (state_id) REFERENCES states(id)
) ENGINE=InnoDB;

-- =========================================================
-- USERS AND AUTH
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  mobile VARCHAR(20) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','staff','company') NOT NULL,
  status ENUM('active','inactive','blocked') NOT NULL DEFAULT 'active',
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  last_login DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  family_id VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  user_agent VARCHAR(255) NULL,
  ip VARCHAR(45) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_rt_user (user_id),
  KEY idx_rt_family (family_id),
  UNIQUE KEY uq_rt_hash (token_hash),
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_resets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pr_hash (token_hash),
  KEY idx_pr_user (user_id),
  CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS permissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id BIGINT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, permission_id),
  CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_up_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- COMPANIES
-- =========================================================
CREATE TABLE IF NOT EXISTS companies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  industry_id INT UNSIGNED NULL,
  company_type_id INT UNSIGNED NULL,
  gst_no VARCHAR(20) NULL,
  pan_no VARCHAR(15) NULL,
  cin_no VARCHAR(25) NULL,
  registration_year INT NULL,
  company_size ENUM('1-10','11-50','51-200','201-500','501-1000','1000+') NULL,
  website VARCHAR(255) NULL,
  address TEXT NULL,
  country_id INT UNSIGNED NULL,
  state_id INT UNSIGNED NULL,
  city_id INT UNSIGNED NULL,
  pincode VARCHAR(12) NULL,
  contact_person VARCHAR(150) NOT NULL,
  contact_designation VARCHAR(100) NULL,
  contact_email VARCHAR(190) NOT NULL,
  contact_mobile VARCHAR(20) NOT NULL,
  logo_path VARCHAR(255) NULL,
  status ENUM('pending','approved','rejected','need_info','suspended') NOT NULL DEFAULT 'pending',
  needs_reverification TINYINT(1) NOT NULL DEFAULT 0,
  verified_by BIGINT UNSIGNED NULL,
  verified_at DATETIME NULL,
  remark TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_companies_user (user_id),
  KEY idx_companies_status (status),
  KEY idx_companies_name (company_name),
  CONSTRAINT fk_companies_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_companies_industry FOREIGN KEY (industry_id) REFERENCES industries(id),
  CONSTRAINT fk_companies_ctype FOREIGN KEY (company_type_id) REFERENCES company_types(id),
  CONSTRAINT fk_companies_verifier FOREIGN KEY (verified_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS company_documents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  doc_type ENUM('gst','pan','incorporation','other') NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NULL,
  size_bytes INT UNSIGNED NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  KEY idx_cd_company (company_id),
  CONSTRAINT fk_cd_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS company_verification_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  old_status VARCHAR(20) NULL,
  new_status VARCHAR(20) NOT NULL,
  remark TEXT NULL,
  done_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_cvl_company (company_id),
  CONSTRAINT fk_cvl_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_cvl_user FOREIGN KEY (done_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- =========================================================
-- JOBS
-- =========================================================
CREATE TABLE IF NOT EXISTS job_sequences (
  year INT NOT NULL PRIMARY KEY,
  current_val INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_code VARCHAR(20) NOT NULL,
  company_id BIGINT UNSIGNED NOT NULL,
  title_id INT UNSIGNED NULL,
  custom_title VARCHAR(200) NULL,
  category_id INT UNSIGNED NULL,
  department VARCHAR(120) NULL,
  description LONGTEXT NULL,
  responsibilities LONGTEXT NULL,
  qualification_id INT UNSIGNED NULL,
  exp_min DECIMAL(4,1) NOT NULL DEFAULT 0,
  exp_max DECIMAL(4,1) NULL,
  salary_min DECIMAL(12,2) NULL,
  salary_max DECIMAL(12,2) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  employment_type_id INT UNSIGNED NULL,
  work_mode ENUM('onsite','remote','hybrid') NOT NULL DEFAULT 'onsite',
  city_id INT UNSIGNED NULL,
  notice_period_pref VARCHAR(50) NULL,
  gender_pref ENUM('any','male','female') NOT NULL DEFAULT 'any',
  positions_required INT UNSIGNED NOT NULL DEFAULT 1,
  last_date DATE NULL,
  priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  status ENUM('draft','open','in_progress','fulfilled','on_hold','closed') NOT NULL DEFAULT 'open',
  jd_file_path VARCHAR(255) NULL,
  assigned_staff_id BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  fulfilled_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_jobs_code (job_code),
  KEY idx_jobs_company (company_id),
  KEY idx_jobs_status (status),
  KEY idx_jobs_staff (assigned_staff_id),
  KEY idx_jobs_last_date (last_date),
  CONSTRAINT fk_jobs_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_jobs_title FOREIGN KEY (title_id) REFERENCES job_titles(id),
  CONSTRAINT fk_jobs_category FOREIGN KEY (category_id) REFERENCES job_categories(id),
  CONSTRAINT fk_jobs_qual FOREIGN KEY (qualification_id) REFERENCES qualifications(id),
  CONSTRAINT fk_jobs_emptype FOREIGN KEY (employment_type_id) REFERENCES employment_types(id),
  CONSTRAINT fk_jobs_city FOREIGN KEY (city_id) REFERENCES cities(id),
  CONSTRAINT fk_jobs_staff FOREIGN KEY (assigned_staff_id) REFERENCES users(id),
  CONSTRAINT fk_jobs_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_skills (
  job_id BIGINT UNSIGNED NOT NULL,
  skill_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (job_id, skill_id),
  CONSTRAINT fk_js_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_js_skill FOREIGN KEY (skill_id) REFERENCES skills(id)
) ENGINE=InnoDB;

-- =========================================================
-- CANDIDATES
-- =========================================================
CREATE TABLE IF NOT EXISTS candidates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  alt_mobile VARCHAR(20) NULL,
  gender ENUM('male','female','other') NULL,
  dob DATE NULL,
  current_location VARCHAR(150) NULL,
  preferred_location VARCHAR(150) NULL,
  total_experience DECIMAL(4,1) NOT NULL DEFAULT 0,
  current_ctc DECIMAL(12,2) NULL,
  expected_ctc DECIMAL(12,2) NULL,
  notice_period_days INT NULL,
  education VARCHAR(255) NULL,
  qualification_id INT UNSIGNED NULL,
  current_company VARCHAR(200) NULL,
  current_designation VARCHAR(150) NULL,
  summary TEXT NULL,
  resume_path VARCHAR(255) NOT NULL,
  resume_original_name VARCHAR(255) NULL,
  photo_path VARCHAR(255) NULL,
  source_id INT UNSIGNED NULL,
  uploaded_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  KEY idx_cand_email (email),
  KEY idx_cand_mobile (mobile),
  KEY idx_cand_exp (total_experience),
  FULLTEXT KEY ft_cand_search (name, current_designation, current_company, education, summary),
  CONSTRAINT fk_cand_source FOREIGN KEY (source_id) REFERENCES candidate_sources(id),
  CONSTRAINT fk_cand_qual FOREIGN KEY (qualification_id) REFERENCES qualifications(id),
  CONSTRAINT fk_cand_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS candidate_skills (
  candidate_id BIGINT UNSIGNED NOT NULL,
  skill_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (candidate_id, skill_id),
  CONSTRAINT fk_cs_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  CONSTRAINT fk_cs_skill FOREIGN KEY (skill_id) REFERENCES skills(id)
) ENGINE=InnoDB;

-- =========================================================
-- MAPPING (candidate submitted to a job)
-- =========================================================
CREATE TABLE IF NOT EXISTS job_candidates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT UNSIGNED NOT NULL,
  candidate_id BIGINT UNSIGNED NOT NULL,
  submitted_by BIGINT UNSIGNED NOT NULL,
  match_score TINYINT UNSIGNED NULL,
  submission_note TEXT NULL,
  internal_note TEXT NULL,
  status ENUM('submitted','viewed','shortlisted','confirmed','rejected','hold') NOT NULL DEFAULT 'submitted',
  company_remark TEXT NULL,
  acted_at DATETIME NULL,
  joining_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_job_candidate (job_id, candidate_id),
  KEY idx_jc_status (status),
  KEY idx_jc_candidate (candidate_id),
  CONSTRAINT fk_jc_job FOREIGN KEY (job_id) REFERENCES jobs(id),
  CONSTRAINT fk_jc_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id),
  CONSTRAINT fk_jc_user FOREIGN KEY (submitted_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_candidate_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_candidate_id BIGINT UNSIGNED NOT NULL,
  old_status VARCHAR(20) NULL,
  new_status VARCHAR(20) NOT NULL,
  remark TEXT NULL,
  changed_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_jch_jc (job_candidate_id),
  CONSTRAINT fk_jch_jc FOREIGN KEY (job_candidate_id) REFERENCES job_candidates(id) ON DELETE CASCADE,
  CONSTRAINT fk_jch_user FOREIGN KEY (changed_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- =========================================================
-- SYSTEM TABLES
-- =========================================================
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  message VARCHAR(500) NOT NULL,
  type VARCHAR(50) NOT NULL,
  ref_type VARCHAR(30) NULL,
  ref_id BIGINT UNSIGNED NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notif_user (user_id, is_read, created_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  action ENUM('create','update','delete','status_change','login','logout','export') NOT NULL,
  module VARCHAR(40) NOT NULL,
  record_id BIGINT UNSIGNED NULL,
  old_value JSON NULL,
  new_value JSON NULL,
  ip VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_module (module, record_id),
  KEY idx_audit_user (user_id),
  KEY idx_audit_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS email_templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  subject VARCHAR(200) NOT NULL,
  body_html MEDIUMTEXT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(80) PRIMARY KEY,
  `value` TEXT NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

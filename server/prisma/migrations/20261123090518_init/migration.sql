-- CreateTable
CREATE TABLE `industries` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_industries_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_types` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_company_types_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_categories` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_job_categories_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_titles` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER UNSIGNED NULL,
    `name` VARCHAR(150) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_job_titles_cat`(`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `skills` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_skills_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qualifications` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_qualifications_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employment_types` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_employment_types_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `experience_levels` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `min_years` DECIMAL(4, 1) NULL,
    `max_years` DECIMAL(4, 1) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidate_sources` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_candidate_sources_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `countries` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `iso_code` VARCHAR(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `states` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `country_id` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_states_country`(`country_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cities` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `state_id` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_cities_state`(`state_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `mobile` VARCHAR(20) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'staff', 'company') NOT NULL,
    `status` ENUM('active', 'inactive', 'blocked') NOT NULL DEFAULT 'active',
    `failed_attempts` INTEGER NOT NULL DEFAULT 0,
    `locked_until` DATETIME(0) NULL,
    `last_login` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_users_email`(`email`),
    INDEX `idx_users_role`(`role`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `family_id` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `revoked_at` DATETIME(0) NULL,
    `user_agent` VARCHAR(255) NULL,
    `ip` VARCHAR(45) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_rt_hash`(`token_hash`),
    INDEX `idx_rt_user`(`user_id`),
    INDEX `idx_rt_family`(`family_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_resets` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `used_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_pr_hash`(`token_hash`),
    INDEX `idx_pr_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(80) NOT NULL,
    `description` VARCHAR(255) NULL,

    UNIQUE INDEX `permissions_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_permissions` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `permission_id` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`user_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companies` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `company_name` VARCHAR(200) NOT NULL,
    `industry_id` INTEGER UNSIGNED NULL,
    `company_type_id` INTEGER UNSIGNED NULL,
    `gst_no` VARCHAR(20) NULL,
    `pan_no` VARCHAR(15) NULL,
    `cin_no` VARCHAR(25) NULL,
    `registration_year` INTEGER NULL,
    `company_size` ENUM('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+') NULL,
    `website` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `country_id` INTEGER UNSIGNED NULL,
    `state_id` INTEGER UNSIGNED NULL,
    `city_id` INTEGER UNSIGNED NULL,
    `pincode` VARCHAR(12) NULL,
    `contact_person` VARCHAR(150) NOT NULL,
    `contact_designation` VARCHAR(100) NULL,
    `contact_email` VARCHAR(190) NOT NULL,
    `contact_mobile` VARCHAR(20) NOT NULL,
    `logo_path` VARCHAR(255) NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'need_info', 'suspended') NOT NULL DEFAULT 'pending',
    `needs_reverification` BOOLEAN NOT NULL DEFAULT false,
    `verified_by` BIGINT UNSIGNED NULL,
    `verified_at` DATETIME(0) NULL,
    `remark` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_companies_user`(`user_id`),
    INDEX `idx_companies_status`(`status`),
    INDEX `idx_companies_name`(`company_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_documents` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT UNSIGNED NOT NULL,
    `doc_type` ENUM('gst', 'pan', 'incorporation', 'other') NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NULL,
    `size_bytes` INTEGER UNSIGNED NULL,
    `uploaded_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_cd_company`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_verification_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT UNSIGNED NOT NULL,
    `old_status` VARCHAR(20) NULL,
    `new_status` VARCHAR(20) NOT NULL,
    `remark` TEXT NULL,
    `done_by` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_cvl_company`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_sequences` (
    `year` INTEGER NOT NULL,
    `current_val` INTEGER NOT NULL DEFAULT 0,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`year`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `job_code` VARCHAR(20) NOT NULL,
    `company_id` BIGINT UNSIGNED NOT NULL,
    `title_id` INTEGER UNSIGNED NULL,
    `custom_title` VARCHAR(200) NULL,
    `category_id` INTEGER UNSIGNED NULL,
    `department` VARCHAR(120) NULL,
    `description` LONGTEXT NULL,
    `responsibilities` LONGTEXT NULL,
    `qualification_id` INTEGER UNSIGNED NULL,
    `exp_min` DECIMAL(4, 1) NOT NULL DEFAULT 0.0,
    `exp_max` DECIMAL(4, 1) NULL,
    `salary_min` DECIMAL(12, 2) NULL,
    `salary_max` DECIMAL(12, 2) NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'INR',
    `employment_type_id` INTEGER UNSIGNED NULL,
    `work_mode` ENUM('onsite', 'remote', 'hybrid') NOT NULL DEFAULT 'onsite',
    `city_id` INTEGER UNSIGNED NULL,
    `notice_period_pref` VARCHAR(50) NULL,
    `gender_pref` ENUM('any', 'male', 'female') NOT NULL DEFAULT 'any',
    `positions_required` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `last_date` DATE NULL,
    `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    `status` ENUM('draft', 'open', 'in_progress', 'fulfilled', 'on_hold', 'closed') NOT NULL DEFAULT 'open',
    `jd_file_path` VARCHAR(255) NULL,
    `assigned_staff_id` BIGINT UNSIGNED NULL,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `fulfilled_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_jobs_code`(`job_code`),
    INDEX `idx_jobs_company`(`company_id`),
    INDEX `idx_jobs_status`(`status`),
    INDEX `idx_jobs_staff`(`assigned_staff_id`),
    INDEX `idx_jobs_last_date`(`last_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_skills` (
    `job_id` BIGINT UNSIGNED NOT NULL,
    `skill_id` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`job_id`, `skill_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidates` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `mobile` VARCHAR(20) NOT NULL,
    `alt_mobile` VARCHAR(20) NULL,
    `gender` ENUM('male', 'female', 'other') NULL,
    `dob` DATE NULL,
    `current_location` VARCHAR(150) NULL,
    `preferred_location` VARCHAR(150) NULL,
    `total_experience` DECIMAL(4, 1) NOT NULL DEFAULT 0.0,
    `current_ctc` DECIMAL(12, 2) NULL,
    `expected_ctc` DECIMAL(12, 2) NULL,
    `notice_period_days` INTEGER NULL,
    `education` VARCHAR(255) NULL,
    `qualification_id` INTEGER UNSIGNED NULL,
    `current_company` VARCHAR(200) NULL,
    `current_designation` VARCHAR(150) NULL,
    `summary` TEXT NULL,
    `resume_path` VARCHAR(255) NOT NULL,
    `resume_original_name` VARCHAR(255) NULL,
    `photo_path` VARCHAR(255) NULL,
    `source_id` INTEGER UNSIGNED NULL,
    `uploaded_by` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_cand_email`(`email`),
    INDEX `idx_cand_mobile`(`mobile`),
    INDEX `idx_cand_exp`(`total_experience`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidate_skills` (
    `candidate_id` BIGINT UNSIGNED NOT NULL,
    `skill_id` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`candidate_id`, `skill_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_candidates` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `job_id` BIGINT UNSIGNED NOT NULL,
    `candidate_id` BIGINT UNSIGNED NOT NULL,
    `submitted_by` BIGINT UNSIGNED NOT NULL,
    `match_score` TINYINT UNSIGNED NULL,
    `submission_note` TEXT NULL,
    `internal_note` TEXT NULL,
    `status` ENUM('submitted', 'viewed', 'shortlisted', 'confirmed', 'rejected', 'hold') NOT NULL DEFAULT 'submitted',
    `company_remark` TEXT NULL,
    `acted_at` DATETIME(0) NULL,
    `joining_date` DATE NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_jc_status`(`status`),
    INDEX `idx_jc_candidate`(`candidate_id`),
    UNIQUE INDEX `uq_job_candidate`(`job_id`, `candidate_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_candidate_history` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `job_candidate_id` BIGINT UNSIGNED NOT NULL,
    `old_status` VARCHAR(20) NULL,
    `new_status` VARCHAR(20) NOT NULL,
    `remark` TEXT NULL,
    `changed_by` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_jch_jc`(`job_candidate_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` VARCHAR(500) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `ref_type` VARCHAR(30) NULL,
    `ref_id` BIGINT UNSIGNED NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_notif_user`(`user_id`, `is_read`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NULL,
    `action` ENUM('create', 'update', 'delete', 'status_change', 'login', 'logout', 'export') NOT NULL,
    `module` VARCHAR(40) NOT NULL,
    `record_id` BIGINT UNSIGNED NULL,
    `old_value` JSON NULL,
    `new_value` JSON NULL,
    `ip` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_audit_module`(`module`, `record_id`),
    INDEX `idx_audit_user`(`user_id`),
    INDEX `idx_audit_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_templates` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(60) NOT NULL,
    `subject` VARCHAR(200) NOT NULL,
    `body_html` MEDIUMTEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `email_templates_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `key` VARCHAR(80) NOT NULL,
    `value` TEXT NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sqa_leads` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lead_code` VARCHAR(50) NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `service_category` VARCHAR(150) NOT NULL,
    `sub_stream` VARCHAR(200) NULL,
    `goals` TEXT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'NEW',
    `ip_address` VARCHAR(50) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `sqa_leads_lead_code_key`(`lead_code`),
    INDEX `idx_sqa_leads_cat`(`service_category`),
    INDEX `idx_sqa_leads_status`(`status`),
    INDEX `idx_sqa_leads_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sqa_applications` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `app_code` VARCHAR(50) NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `service_category` VARCHAR(150) NOT NULL DEFAULT 'Corporate Internship & placement support',
    `target_role` VARCHAR(150) NOT NULL,
    `experience_level` VARCHAR(50) NULL,
    `resume_url` VARCHAR(500) NULL,
    `statement` TEXT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'NEW',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `sqa_applications_app_code_key`(`app_code`),
    INDEX `idx_sqa_apps_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sqa_certificates` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(60) NOT NULL,
    `student_name` VARCHAR(150) NOT NULL,
    `program` VARCHAR(200) NOT NULL,
    `pillar` VARCHAR(150) NULL,
    `issue_date` VARCHAR(60) NOT NULL,
    `grade` VARCHAR(60) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'VALID',
    `badge` VARCHAR(100) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `sqa_certificates_code_key`(`code`),
    INDEX `idx_sqa_cert_code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `job_titles` ADD CONSTRAINT `fk_job_titles_cat` FOREIGN KEY (`category_id`) REFERENCES `job_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `states` ADD CONSTRAINT `fk_states_country` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cities` ADD CONSTRAINT `fk_cities_state` FOREIGN KEY (`state_id`) REFERENCES `states`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `fk_rt_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_resets` ADD CONSTRAINT `fk_pr_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permissions` ADD CONSTRAINT `fk_up_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permissions` ADD CONSTRAINT `fk_up_perm` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `fk_companies_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `fk_companies_industry` FOREIGN KEY (`industry_id`) REFERENCES `industries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `fk_companies_ctype` FOREIGN KEY (`company_type_id`) REFERENCES `company_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `fk_companies_verifier` FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_documents` ADD CONSTRAINT `fk_cd_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_verification_logs` ADD CONSTRAINT `fk_cvl_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_verification_logs` ADD CONSTRAINT `fk_cvl_user` FOREIGN KEY (`done_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `fk_jobs_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `fk_jobs_title` FOREIGN KEY (`title_id`) REFERENCES `job_titles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `fk_jobs_category` FOREIGN KEY (`category_id`) REFERENCES `job_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `fk_jobs_qual` FOREIGN KEY (`qualification_id`) REFERENCES `qualifications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `fk_jobs_emptype` FOREIGN KEY (`employment_type_id`) REFERENCES `employment_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `fk_jobs_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `fk_jobs_staff` FOREIGN KEY (`assigned_staff_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `fk_jobs_creator` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_skills` ADD CONSTRAINT `fk_js_job` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_skills` ADD CONSTRAINT `fk_js_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `candidates` ADD CONSTRAINT `fk_cand_source` FOREIGN KEY (`source_id`) REFERENCES `candidate_sources`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `candidates` ADD CONSTRAINT `fk_cand_qual` FOREIGN KEY (`qualification_id`) REFERENCES `qualifications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `candidates` ADD CONSTRAINT `fk_cand_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `candidate_skills` ADD CONSTRAINT `fk_cs_cand` FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `candidate_skills` ADD CONSTRAINT `fk_cs_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_candidates` ADD CONSTRAINT `fk_jc_job` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_candidates` ADD CONSTRAINT `fk_jc_cand` FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_candidates` ADD CONSTRAINT `fk_jc_user` FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_candidate_history` ADD CONSTRAINT `fk_jch_jc` FOREIGN KEY (`job_candidate_id`) REFERENCES `job_candidates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_candidate_history` ADD CONSTRAINT `fk_jch_user` FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

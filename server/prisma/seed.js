const bcrypt = require('bcrypt');

/**
 * Universal seeder that works with standard Prisma Client.
 * Populates Admin, Masters, Settings, and Email Templates.
 */
async function seedDatabase(prisma) {
  console.log('--- Starting Database Seeder ---');

  // 1. Seed Default Admin User
  const adminEmail = 'admin@portal.com';
  const existingAdmin = await prisma.users.findFirst({
    where: { email: adminEmail }
  });

  const passwordHash = await bcrypt.hash('Admin@123456', 12);

  if (!existingAdmin) {
    await prisma.users.create({
      data: {
        name: 'System Administrator',
        email: adminEmail,
        mobile: '+91-9876543210',
        password_hash: passwordHash,
        role: 'admin',
        status: 'active'
      }
    });
    console.log('✓ Admin user created: admin@portal.com');
  } else {
    console.log('ℹ Admin user already exists');
  }

  // 2. Seed Settings
  const defaultSettings = [
    { key: 'site_name', value: 'Recruitment Portal' },
    { key: 'auto_approve_company', value: 'false' },
    { key: 'hide_candidate_contact_until_confirmed', value: 'true' },
    { key: 'max_resume_mb', value: '5' },
    { key: 'max_doc_mb', value: '5' },
    { key: 'allowed_resume_types', value: 'pdf,doc,docx' },
    { key: 'deadline_reminder_days', value: '2' },
    { key: 'smtp_host', value: 'smtp.example.com' },
    { key: 'smtp_port', value: '587' },
    { key: 'smtp_user', value: 'no-reply@portal.com' },
    { key: 'mail_from', value: 'Recruitment Portal <no-reply@portal.com>' }
  ];

  for (const s of defaultSettings) {
    await prisma.settings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value }
    });
  }
  console.log('✓ System settings seeded');

  // 3. Seed Email Templates
  const templates = [
    { code: 'company_registered_admin', subject: 'New Company Registered: {{company}}', body_html: '<p>A new company <strong>{{company}}</strong> has registered and requires document verification.</p><p><a href="{{link}}">Review Company Profile</a></p>' },
    { code: 'company_registration_received', subject: 'Registration Received - Recruitment Portal', body_html: '<p>Dear {{name}},</p><p>Thank you for registering <strong>{{company}}</strong>. Our compliance team is reviewing your documents.</p>' },
    { code: 'company_approved', subject: 'Company Approved - You May Now Post Requirements', body_html: '<p>Dear {{name}},</p><p>Congratulations! <strong>{{company}}</strong> has been approved. You can now log in and post hiring requirements.</p><p><a href="{{link}}">Login to Portal</a></p>' },
    { code: 'company_rejected', subject: 'Company Registration Status Update', body_html: '<p>Dear {{name}},</p><p>Your registration for <strong>{{company}}</strong> could not be approved for the following reason:</p><blockquote>{{remark}}</blockquote>' },
    { code: 'company_need_info', subject: 'Additional Information Required for {{company}}', body_html: '<p>Dear {{name}},</p><p>Our team reviewed your submission and needs additional documentation:</p><blockquote>{{remark}}</blockquote><p><a href="{{link}}">Update Profile and Documents</a></p>' },
    { code: 'company_suspended', subject: 'Account Suspension Notice', body_html: '<p>Dear {{name}},</p><p>Your company account for <strong>{{company}}</strong> has been suspended.</p><blockquote>{{remark}}</blockquote>' },
    { code: 'job_posted_admin', subject: 'New Job Requirement Posted: {{jobCode}} - {{jobTitle}}', body_html: '<p>Company <strong>{{company}}</strong> posted a new job: <strong>{{jobTitle}}</strong> ({{jobCode}}).</p><p><a href="{{link}}">View Job & Assign Staff</a></p>' },
    { code: 'job_assigned_staff', subject: 'Job Assigned to You: {{jobCode}}', body_html: '<p>Dear {{name}},</p><p>You have been assigned as lead recruiter for <strong>{{jobTitle}}</strong> at <strong>{{company}}</strong>.</p><p><a href="{{link}}">Source Candidates</a></p>' },
    { code: 'candidates_submitted', subject: '{{count}} New Candidate(s) Submitted for {{jobTitle}}', body_html: '<p>Dear {{name}},</p><p>{{count}} new candidate profile(s) have been mapped to your job <strong>{{jobTitle}}</strong> ({{jobCode}}).</p><p><a href="{{link}}">Review Candidates</a></p>' },
    { code: 'candidate_confirmed', subject: 'Candidate Confirmed for {{jobTitle}}', body_html: '<p>Great news! Candidate <strong>{{candidateName}}</strong> has been confirmed for <strong>{{jobTitle}}</strong> at <strong>{{company}}</strong>.</p>' },
    { code: 'candidate_rejected', subject: 'Candidate Rejected: {{jobTitle}}', body_html: '<p>Company <strong>{{company}}</strong> rejected candidate <strong>{{candidateName}}</strong> for <strong>{{jobTitle}}</strong>.</p><blockquote>Remark: {{remark}}</blockquote>' },
    { code: 'job_fulfilled', subject: 'Job Order Fulfilled: {{jobCode}} - {{jobTitle}}', body_html: '<p>All required positions for <strong>{{jobTitle}}</strong> ({{jobCode}}) have been successfully confirmed!</p>' },
    { code: 'job_deadline_reminder', subject: 'Urgent: Deadline Approaching for {{jobCode}}', body_html: '<p>Requirement <strong>{{jobTitle}}</strong> for <strong>{{company}}</strong> reaches its submission deadline on {{lastDate}}.</p>' },
    { code: 'password_reset', subject: 'Reset Your Recruitment Portal Password', body_html: '<p>Hello {{name}},</p><p>Click the link below to securely reset your password. This link expires in 30 minutes.</p><p><a href="{{link}}">Reset Password</a></p>' },
    { code: 'staff_welcome', subject: 'Welcome to the Recruitment Portal Team', body_html: '<p>Hello {{name}},</p><p>Your recruiter account has been created. Use the link below to set your password and get started.</p><p><a href="{{link}}">Activate Account</a></p>' }
  ];

  for (const t of templates) {
    await prisma.email_templates.upsert({
      where: { code: t.code },
      update: { subject: t.subject, body_html: t.body_html },
      create: { code: t.code, subject: t.subject, body_html: t.body_html }
    });
  }
  console.log('✓ Email templates seeded');

  // 4. Seed Masters (Industries, Company Types, Qualifications, Skills, etc.)
  const industriesList = [
    'Information Technology & Software', 'Banking, Financial Services & Insurance',
    'Healthcare & Pharmaceuticals', 'Manufacturing & Industrial', 'Retail & E-Commerce',
    'Telecommunications', 'Education & EdTech', 'Automotive', 'Logistics & Supply Chain'
  ];
  for (const name of industriesList) {
    await prisma.industries.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  const companyTypesList = [
    'Private Limited (Pvt Ltd)', 'Public Limited', 'Limited Liability Partnership (LLP)',
    'Partnership Firm', 'Sole Proprietorship', 'Startup (DPIIT Recognized)', 'Non-Profit / NGO'
  ];
  for (const name of companyTypesList) {
    await prisma.company_types.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  const qualificationsList = [
    'B.Tech / B.E.', 'M.Tech / M.E.', 'BCA', 'MCA', 'B.Sc Computer Science',
    'M.Sc Computer Science', 'Diploma in Engineering', 'MBA', 'B.Com / M.Com',
    'BBA', 'B.A.', 'Ph.D / Doctorate', 'Other Graduation'
  ];
  for (const name of qualificationsList) {
    await prisma.qualifications.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  const employmentTypesList = [
    'Full-Time Permanent', 'Full-Time Contract', 'Part-Time', 'Internship', 'Freelance / Consultant'
  ];
  for (const name of employmentTypesList) {
    await prisma.employment_types.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  const sourcesList = [
    'Direct Portal Upload', 'Employee Referral', 'LinkedIn Recruiter', 'Naukri.com',
    'Monster / Foundit', 'Campus Placement', 'Job Fair', 'Staffing Agency Partner'
  ];
  for (const name of sourcesList) {
    await prisma.candidate_sources.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  const skillsList = [
    'JavaScript', 'TypeScript', 'React.js', 'Next.js', 'Node.js', 'Express.js',
    'Python', 'Django', 'FastAPI', 'Java', 'Spring Boot', 'C#', '.NET Core',
    'PHP', 'Laravel', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL',
    'REST APIs', 'AWS', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD Pipelines',
    'Git', 'HTML5', 'CSS3', 'Bootstrap 5', 'Tailwind CSS', 'Jest', 'Playwright',
    'Manual Testing', 'Automation Testing', 'UI/UX Design', 'Figma', 'System Architecture'
  ];
  for (const name of skillsList) {
    await prisma.skills.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  // Job Categories & Titles
  const categoriesWithTitles = [
    {
      category: 'Software Engineering',
      titles: ['Fullstack Developer', 'Backend Developer', 'Frontend Developer', 'Mobile App Developer', 'DevOps Engineer']
    },
    {
      category: 'Quality Assurance & Testing',
      titles: ['QA Automation Engineer', 'Manual QA Tester', 'Performance Test Engineer', 'Security Analyst']
    },
    {
      category: 'Data & Analytics',
      titles: ['Data Scientist', 'Data Engineer', 'Business Intelligence Analyst', 'Database Administrator']
    },
    {
      category: 'Product & Design',
      titles: ['Product Manager', 'Technical Product Owner', 'UI/UX Designer', 'Product Analyst']
    },
    {
      category: 'Human Resources & Talent',
      titles: ['Technical Recruiter', 'HR Business Partner', 'Talent Acquisition Lead', 'HR Executive']
    }
  ];

  for (const cat of categoriesWithTitles) {
    const createdCat = await prisma.job_categories.upsert({
      where: { name: cat.category },
      update: {},
      create: { name: cat.category }
    });
    for (const title of cat.titles) {
      const existingTitle = await prisma.job_titles.findFirst({
        where: { name: title, category_id: createdCat.id }
      });
      if (!existingTitle) {
        await prisma.job_titles.create({
          data: { name: title, category_id: createdCat.id }
        });
      }
    }
  }

  // Countries, States, Cities
  let india = await prisma.countries.findFirst({ where: { name: 'India' } });
  if (!india) {
    india = await prisma.countries.create({
      data: { name: 'India', iso_code: 'IND' }
    });
  }

  const statesWithCities = [
    { state: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik'] },
    { state: 'Karnataka', cities: ['Bengaluru', 'Mysuru', 'Hubballi'] },
    { state: 'Delhi NCR', cities: ['New Delhi', 'Noida', 'Gurugram'] },
    { state: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore', 'Madurai'] },
    { state: 'Telangana', cities: ['Hyderabad', 'Warangal'] }
  ];

  for (const item of statesWithCities) {
    let s = await prisma.states.findFirst({
      where: { name: item.state, country_id: india.id }
    });
    if (!s) {
      s = await prisma.states.create({
        data: { name: item.state, country_id: india.id }
      });
    }
    for (const cName of item.cities) {
      const c = await prisma.cities.findFirst({
        where: { name: cName, state_id: s.id }
      });
      if (!c) {
        await prisma.cities.create({
          data: { name: cName, state_id: s.id }
        });
      }
    }
  }

  console.log('✓ Master tables seeded successfully');
  console.log('--- Database Seeding Complete ---');
}

// Standalone execution wrapper
if (require.main === module) {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  seedDatabase(prisma)
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedDatabase };

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

  // 5. Seed 5 Staff Members
  const staffHash = await bcrypt.hash('Staff@123456', 12);
  const staffData = [
    { name: 'Priya Sharma', email: 'priya.sharma@portal.com', mobile: '+91-9820112233' },
    { name: 'Rahul Verma', email: 'rahul.verma@portal.com', mobile: '+91-9820223344' },
    { name: 'Ananya Iyer', email: 'ananya.iyer@portal.com', mobile: '+91-9820334455' },
    { name: 'Vikram Malhotra', email: 'vikram.malhotra@portal.com', mobile: '+91-9820445566' },
    { name: 'Sneha Patil', email: 'sneha.patil@portal.com', mobile: '+91-9820556677' }
  ];

  const createdStaff = [];
  for (const s of staffData) {
    let staffUser = await prisma.users.findFirst({ where: { email: s.email } });
    if (!staffUser) {
      staffUser = await prisma.users.create({
        data: {
          name: s.name,
          email: s.email,
          mobile: s.mobile,
          password_hash: staffHash,
          role: 'staff',
          status: 'active'
        }
      });
    }
    createdStaff.push(staffUser);
  }
  console.log('✓ 5 Staff members verified/seeded');

  // 6. Seed 5 Companies + Company Users
  const companyPasswordHash = await bcrypt.hash('Company@123456', 12);
  const itIndustry = await prisma.industries.findFirst({ where: { name: 'Information Technology & Software' } });
  const healthIndustry = await prisma.industries.findFirst({ where: { name: 'Healthcare & Pharmaceuticals' } });
  const logIndustry = await prisma.industries.findFirst({ where: { name: 'Logistics & Supply Chain' } });
  const finIndustry = await prisma.industries.findFirst({ where: { name: 'Banking, Financial Services & Insurance' } });
  const pvtType = await prisma.company_types.findFirst({ where: { name: 'Private Limited (Pvt Ltd)' } });
  const llpType = await prisma.company_types.findFirst({ where: { name: 'Limited Liability Partnership (LLP)' } });

  const adminUser = existingAdmin || (await prisma.users.findFirst({ where: { role: 'admin' } }));

  const companyList = [
    {
      company_name: 'Acme Cloud Technologies Pvt Ltd',
      userEmail: 'contact@acmecloud.com',
      userName: 'Rajesh Khanna',
      industry_id: itIndustry?.id,
      company_type_id: pvtType?.id,
      gst_no: '27AABCT3518Q1ZV',
      pan_no: 'AABCT3518Q',
      cin_no: 'U72200MH2018PTC310234',
      company_size: '51-200',
      status: 'approved',
      contact_person: 'Rajesh Khanna',
      contact_designation: 'Director of Talent Acquisition',
      contact_email: 'contact@acmecloud.com',
      contact_mobile: '+91-9811223344',
      address: 'Tech Park, Tower B, Bandra Kurla Complex',
      city_id: 1,
      state_id: 1,
      country_id: 1,
      pincode: '400051',
      website: 'https://acmecloud.example.com',
      verified_by: adminUser?.id,
      verified_at: new Date()
    },
    {
      company_name: 'Starlight Global Healthcare LLP',
      userEmail: 'hr@starlighthealth.io',
      userName: 'Dr. Sunita Rao',
      industry_id: healthIndustry?.id,
      company_type_id: llpType?.id,
      gst_no: '29AAHCS2948R1ZX',
      pan_no: 'AAHCS2948R',
      cin_no: 'AAA-1234',
      company_size: '201-500',
      status: 'approved',
      contact_person: 'Dr. Sunita Rao',
      contact_designation: 'Head of Operations',
      contact_email: 'hr@starlighthealth.io',
      contact_mobile: '+91-9822334455',
      address: 'Health City Campus, Electronic City Phase 1',
      city_id: 2,
      state_id: 2,
      country_id: 1,
      pincode: '560100',
      website: 'https://starlighthealth.example.com',
      verified_by: adminUser?.id,
      verified_at: new Date()
    },
    {
      company_name: 'NextGen Logistics India Ltd',
      userEmail: 'hiring@nextgenlogistics.in',
      userName: 'Manish Pandey',
      industry_id: logIndustry?.id,
      company_type_id: pvtType?.id,
      gst_no: '27AALCN9876P1ZY',
      pan_no: 'AALCN9876P',
      cin_no: 'U60200MH2020PLC345678',
      company_size: '11-50',
      status: 'pending',
      contact_person: 'Manish Pandey',
      contact_designation: 'Managing Partner',
      contact_email: 'hiring@nextgenlogistics.in',
      contact_mobile: '+91-9833445566',
      address: 'Cargo Complex, Sector 18, Vashi',
      city_id: 1,
      state_id: 1,
      country_id: 1,
      pincode: '400703',
      website: 'https://nextgenlogistics.example.com'
    },
    {
      company_name: 'Apex FinTech Innovations',
      userEmail: 'admin@apexfintech.com',
      userName: 'Sanjay Aggarwal',
      industry_id: finIndustry?.id,
      company_type_id: pvtType?.id,
      gst_no: '07AAPCF1122Q1ZT',
      pan_no: 'AAPCF1122Q',
      company_size: '11-50',
      status: 'need_info',
      remark: 'Please upload renewed Certificate of Incorporation with official seal.',
      contact_person: 'Sanjay Aggarwal',
      contact_designation: 'COO',
      contact_email: 'admin@apexfintech.com',
      contact_mobile: '+91-9844556677',
      address: 'Cyber Hub, DLF Phase 2',
      city_id: 3,
      state_id: 3,
      country_id: 1,
      pincode: '122002',
      website: 'https://apexfintech.example.com'
    },
    {
      company_name: 'CyberGuard Security Labs',
      userEmail: 'support@cyberguardlabs.com',
      userName: 'Karan Mehra',
      industry_id: itIndustry?.id,
      company_type_id: pvtType?.id,
      gst_no: '27AACCS5566M1ZR',
      pan_no: 'AACCS5566M',
      company_size: '1-10',
      status: 'rejected',
      remark: 'GST verification mismatch against national portal registry.',
      contact_person: 'Karan Mehra',
      contact_designation: 'Founder',
      contact_email: 'support@cyberguardlabs.com',
      contact_mobile: '+91-9855667788',
      address: 'Aundh IT Park, Pune',
      city_id: 1,
      state_id: 1,
      country_id: 1,
      pincode: '411007',
      website: 'https://cyberguardlabs.example.com'
    }
  ];

  const createdCompanies = [];
  for (const c of companyList) {
    let companyUser = await prisma.users.findFirst({ where: { email: c.userEmail } });
    if (!companyUser) {
      companyUser = await prisma.users.create({
        data: {
          name: c.userName,
          email: c.userEmail,
          mobile: c.contact_mobile,
          password_hash: companyPasswordHash,
          role: 'company',
          status: 'active'
        }
      });
    }

    let comp = await prisma.companies.findFirst({ where: { user_id: companyUser.id } });
    if (!comp) {
      comp = await prisma.companies.create({
        data: {
          user_id: companyUser.id,
          company_name: c.company_name,
          industry_id: c.industry_id,
          company_type_id: c.company_type_id,
          gst_no: c.gst_no,
          pan_no: c.pan_no,
          cin_no: c.cin_no,
          company_size: c.company_size,
          status: c.status,
          remark: c.remark,
          contact_person: c.contact_person,
          contact_designation: c.contact_designation,
          contact_email: c.contact_email,
          contact_mobile: c.contact_mobile,
          address: c.address,
          city_id: c.city_id,
          state_id: c.state_id,
          country_id: c.country_id,
          pincode: c.pincode,
          website: c.website,
          verified_by: c.verified_by,
          verified_at: c.verified_at
        }
      });
    }
    createdCompanies.push(comp);
  }
  console.log('✓ 5 Companies verified/seeded');

  // 7. Seed 5 Candidates
  const candQualifications = await prisma.qualifications.findFirst();
  const candSource = await prisma.candidate_sources.findFirst();
  const uploaderId = createdStaff[0]?.id || adminUser.id;

  const candidateList = [
    {
      name: 'Amit R. Kumar',
      email: 'amit.kumar@example.com',
      mobile: '+91-9123456780',
      total_experience: 5.5,
      current_location: 'Mumbai',
      preferred_location: 'Mumbai, Pune, Remote',
      current_company: 'Infosys Ltd',
      current_designation: 'Senior Software Engineer',
      current_ctc: 1400000,
      expected_ctc: 1900000,
      notice_period_days: 30,
      summary: 'Experienced Fullstack Engineer with 5+ years building distributed React and Node.js microservices.',
      resume_path: '/uploads/resumes/amit_kumar_resume.pdf',
      resume_original_name: 'Amit_Kumar_Resume.pdf'
    },
    {
      name: 'Deepika Sen',
      email: 'deepika.sen@example.com',
      mobile: '+91-9123456781',
      total_experience: 7.0,
      current_location: 'Bengaluru',
      preferred_location: 'Bengaluru, Hyderabad',
      current_company: 'Wipro Technologies',
      current_designation: 'Lead DevOps Specialist',
      current_ctc: 2000000,
      expected_ctc: 2600000,
      notice_period_days: 15,
      summary: 'AWS & Kubernetes certified DevOps Architect with extensive Terraform and CI/CD automation background.',
      resume_path: '/uploads/resumes/deepika_sen_resume.pdf',
      resume_original_name: 'Deepika_Sen_DevOps.pdf'
    },
    {
      name: 'Rohan S. Joshi',
      email: 'rohan.joshi@example.com',
      mobile: '+91-9123456782',
      total_experience: 4.0,
      current_location: 'Pune',
      preferred_location: 'Pune, Mumbai, Remote',
      current_company: 'Persistent Systems',
      current_designation: 'Backend Python Engineer',
      current_ctc: 1100000,
      expected_ctc: 1500000,
      notice_period_days: 0,
      summary: 'Immediate joiner specialized in Python, Django, FastAPI, PostgreSQL, and high-throughput background queues.',
      resume_path: '/uploads/resumes/rohan_joshi_resume.pdf',
      resume_original_name: 'Rohan_Joshi_Resume.pdf'
    },
    {
      name: 'Kavita Nair',
      email: 'kavita.nair@example.com',
      mobile: '+91-9123456783',
      total_experience: 3.5,
      current_location: 'Chennai',
      preferred_location: 'Chennai, Bengaluru',
      current_company: 'Zoho Corporation',
      current_designation: 'UI/UX Developer',
      current_ctc: 950000,
      expected_ctc: 1350000,
      notice_period_days: 30,
      summary: 'Frontend developer with sharp eye for UI polish, WCAG accessibility, Bootstrap 5, and Next.js applications.',
      resume_path: '/uploads/resumes/kavita_nair_resume.pdf',
      resume_original_name: 'Kavita_Nair_Portfolio.pdf'
    },
    {
      name: 'Siddharth Mehta',
      email: 'siddharth.mehta@example.com',
      mobile: '+91-9123456784',
      total_experience: 6.0,
      current_location: 'Hyderabad',
      preferred_location: 'Hyderabad, Bengaluru, Remote',
      current_company: 'Cognizant',
      current_designation: 'Java Spring Boot Architect',
      current_ctc: 1700000,
      expected_ctc: 2300000,
      notice_period_days: 45,
      summary: 'Java enterprise architect with deep MySQL tuning, caching, and scalable RESTful API design experience.',
      resume_path: '/uploads/resumes/siddharth_mehta_resume.pdf',
      resume_original_name: 'Siddharth_Mehta_Resume.pdf'
    }
  ];

  const createdCandidates = [];
  for (const c of candidateList) {
    let cand = await prisma.candidates.findFirst({ where: { email: c.email } });
    if (!cand) {
      cand = await prisma.candidates.create({
        data: {
          name: c.name,
          email: c.email,
          mobile: c.mobile,
          total_experience: c.total_experience,
          current_location: c.current_location,
          preferred_location: c.preferred_location,
          current_company: c.current_company,
          current_designation: c.current_designation,
          current_ctc: c.current_ctc,
          expected_ctc: c.expected_ctc,
          notice_period_days: c.notice_period_days,
          summary: c.summary,
          resume_path: c.resume_path,
          resume_original_name: c.resume_original_name,
          qualification_id: candQualifications?.id,
          source_id: candSource?.id,
          uploaded_by: uploaderId
        }
      });
    }
    createdCandidates.push(cand);
  }
  console.log('✓ 5 Candidates verified/seeded');

  // 8. Seed 5 Jobs
  const approvedCompanyA = createdCompanies[0]; // Acme Cloud
  const approvedCompanyB = createdCompanies[1]; // Starlight Health

  const jobList = [
    {
      job_code: 'JOB-2026-0001',
      title: 'Senior Fullstack React & Node.js Engineer',
      company_id: approvedCompanyA.id,
      positions_required: 3,
      department: 'Engineering',
      description: '<p>Seeking a Senior Fullstack Engineer to drive core platform development with Next.js and Node.js.</p>',
      responsibilities: '<p>Design scalable APIs, optimize front-end performance, lead sprint code reviews.</p>',
      exp_min: 4.0,
      exp_max: 8.0,
      salary_min: 1800000,
      salary_max: 2400000,
      work_mode: 'hybrid',
      priority: 'high',
      status: 'in_progress',
      assigned_staff_id: createdStaff[0]?.id,
      created_by: approvedCompanyA.user_id,
      last_date: new Date(Date.now() + 15 * 86400000)
    },
    {
      job_code: 'JOB-2026-0002',
      title: 'Lead DevOps & Cloud Infrastructure Architect',
      company_id: approvedCompanyA.id,
      positions_required: 2,
      department: 'Infrastructure',
      description: '<p>Lead our cloud modernization journey on AWS and Kubernetes with zero-downtime CI/CD.</p>',
      responsibilities: '<p>Architect cloud clusters, manage infrastructure-as-code, audit security posture.</p>',
      exp_min: 5.0,
      exp_max: 10.0,
      salary_min: 2200000,
      salary_max: 3000000,
      work_mode: 'remote',
      priority: 'urgent',
      status: 'open',
      assigned_staff_id: createdStaff[1]?.id,
      created_by: approvedCompanyA.user_id,
      last_date: new Date(Date.now() + 10 * 86400000)
    },
    {
      job_code: 'JOB-2026-0003',
      title: 'Healthcare BI & Clinical Data Analyst',
      company_id: approvedCompanyB.id,
      positions_required: 2,
      department: 'Data Operations',
      description: '<p>Analyze clinical workflows and operational metrics across hospital networks.</p>',
      responsibilities: '<p>Build Tableau/PowerBI dashboards, query clinical SQL datastores, maintain HIPAA compliance.</p>',
      exp_min: 3.0,
      exp_max: 6.0,
      salary_min: 1200000,
      salary_max: 1600000,
      work_mode: 'onsite',
      priority: 'medium',
      status: 'in_progress',
      assigned_staff_id: createdStaff[2]?.id,
      created_by: approvedCompanyB.user_id,
      last_date: new Date(Date.now() + 20 * 86400000)
    },
    {
      job_code: 'JOB-2026-0004',
      title: 'Frontend UI/UX React Developer',
      company_id: approvedCompanyB.id,
      positions_required: 4,
      department: 'Product Development',
      description: '<p>Build responsive, accessible portal dashboards and patient engagement interfaces.</p>',
      responsibilities: '<p>Implement pixel-perfect designs, ensure WCAG compliance, unit-test UI components.</p>',
      exp_min: 2.0,
      exp_max: 5.0,
      salary_min: 1000000,
      salary_max: 1500000,
      work_mode: 'hybrid',
      priority: 'medium',
      status: 'open',
      assigned_staff_id: createdStaff[3]?.id,
      created_by: approvedCompanyB.user_id,
      last_date: new Date(Date.now() + 25 * 86400000)
    },
    {
      job_code: 'JOB-2026-0005',
      title: 'Senior Python & API Integration Engineer',
      company_id: approvedCompanyA.id,
      positions_required: 2,
      department: 'Core Platform',
      description: '<p>Design high-throughput background processing workers and enterprise partner integrations.</p>',
      responsibilities: '<p>Maintain async worker pipelines, optimize DB query plans, write robust unit tests.</p>',
      exp_min: 4.0,
      exp_max: 7.0,
      salary_min: 1600000,
      salary_max: 2200000,
      work_mode: 'remote',
      priority: 'low',
      status: 'fulfilled',
      fulfilled_at: new Date(),
      assigned_staff_id: createdStaff[4]?.id,
      created_by: approvedCompanyA.user_id,
      last_date: new Date(Date.now() - 2 * 86400000)
    }
  ];

  const createdJobs = [];
  for (const j of jobList) {
    let job = await prisma.jobs.findFirst({ where: { job_code: j.job_code } });
    if (!job) {
      job = await prisma.jobs.create({
        data: {
          job_code: j.job_code,
          custom_title: j.title,
          company_id: j.company_id,
          positions_required: j.positions_required,
          department: j.department,
          description: j.description,
          responsibilities: j.responsibilities,
          exp_min: j.exp_min,
          exp_max: j.exp_max,
          salary_min: j.salary_min,
          salary_max: j.salary_max,
          work_mode: j.work_mode,
          priority: j.priority,
          status: j.status,
          assigned_staff_id: j.assigned_staff_id,
          created_by: j.created_by,
          last_date: j.last_date,
          fulfilled_at: j.fulfilled_at
        }
      });
    }
    createdJobs.push(job);
  }
  console.log('✓ 5 Jobs verified/seeded');

  // 9. Seed 5 Mappings across Jobs and Candidates
  const mappingList = [
    {
      job_id: createdJobs[0].id,
      candidate_id: createdCandidates[0].id,
      submitted_by: createdStaff[0].id,
      match_score: 94,
      status: 'confirmed',
      joining_date: new Date(Date.now() + 14 * 86400000),
      company_remark: 'Outstanding technical interview. Confirmed with immediate offer.'
    },
    {
      job_id: createdJobs[1].id,
      candidate_id: createdCandidates[1].id,
      submitted_by: createdStaff[1].id,
      match_score: 89,
      status: 'shortlisted',
      company_remark: 'Shortlisted for final technical panel round.'
    },
    {
      job_id: createdJobs[4].id,
      candidate_id: createdCandidates[2].id,
      submitted_by: createdStaff[4].id,
      match_score: 91,
      status: 'confirmed',
      joining_date: new Date(Date.now() + 7 * 86400000),
      company_remark: 'Fast-tracked offer accepted. Position fulfilled.'
    },
    {
      job_id: createdJobs[3].id,
      candidate_id: createdCandidates[3].id,
      submitted_by: createdStaff[3].id,
      match_score: 82,
      status: 'viewed',
      company_remark: 'Portfolio reviewed; pending hiring manager screen.'
    },
    {
      job_id: createdJobs[0].id,
      candidate_id: createdCandidates[4].id,
      submitted_by: createdStaff[0].id,
      match_score: 85,
      status: 'submitted',
      submission_note: 'Strong architectural experience with microservices.'
    }
  ];

  for (const m of mappingList) {
    const existingMap = await prisma.job_candidates.findFirst({
      where: { job_id: m.job_id, candidate_id: m.candidate_id }
    });
    if (!existingMap) {
      await prisma.job_candidates.create({
        data: {
          job_id: m.job_id,
          candidate_id: m.candidate_id,
          submitted_by: m.submitted_by,
          match_score: m.match_score,
          status: m.status,
          joining_date: m.joining_date,
          company_remark: m.company_remark,
          submission_note: m.submission_note,
          acted_at: new Date()
        }
      });
    }
  }
  console.log('✓ 5 Job mappings verified/seeded');

  // 10. Seed 5 Audit Logs
  const auditLogsList = [
    {
      user_id: adminUser.id,
      action: 'login',
      module: 'auth',
      ip: '127.0.0.1',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
      new_value: { note: 'Administrator logged into portal' }
    },
    {
      user_id: adminUser.id,
      action: 'status_change',
      module: 'companies',
      record_id: createdCompanies[0].id,
      ip: '127.0.0.1',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
      old_value: { status: 'pending' },
      new_value: { status: 'approved', remark: 'Documents and GST verified' }
    },
    {
      user_id: createdCompanies[0].user_id,
      action: 'create',
      module: 'jobs',
      record_id: createdJobs[0].id,
      ip: '127.0.0.1',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
      new_value: { job_code: 'JOB-2026-0001', title: 'Senior Fullstack React & Node.js Engineer' }
    },
    {
      user_id: createdStaff[0].id,
      action: 'create',
      module: 'mappings',
      record_id: createdCandidates[0].id,
      ip: '127.0.0.1',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
      new_value: { candidate: 'Amit R. Kumar', job: 'JOB-2026-0001', match_score: 94 }
    },
    {
      user_id: adminUser.id,
      action: 'update',
      module: 'settings',
      ip: '127.0.0.1',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
      old_value: { auto_approve_company: 'false' },
      new_value: { auto_approve_company: 'false', max_failed_logins: 5 }
    }
  ];

  for (const a of auditLogsList) {
    await prisma.audit_logs.create({
      data: {
        user_id: a.user_id,
        action: a.action,
        module: a.module,
        record_id: a.record_id,
        ip: a.ip,
        user_agent: a.user_agent,
        old_value: a.old_value,
        new_value: a.new_value
      }
    });
  }
  console.log('✓ 5 Audit logs seeded');

  // 11. Seed 1 Soft-deleted Candidate for Trash testing
  let trashCand = await prisma.candidates.findFirst({ where: { email: 'archived.cand@example.com' } });
  if (!trashCand) {
    await prisma.candidates.create({
      data: {
        name: 'Vikramaditya Rao',
        email: 'archived.cand@example.com',
        mobile: '+91-9988776655',
        total_experience: 8.0,
        current_location: 'Mumbai',
        resume_path: '/uploads/resumes/archived_sample.pdf',
        uploaded_by: adminUser.id,
        deleted_at: new Date()
      }
    });
  }
  console.log('✓ Trash sample record verified/seeded');

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

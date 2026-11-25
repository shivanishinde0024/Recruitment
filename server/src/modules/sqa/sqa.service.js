const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { sanitizeCsvField } = require('../../utils/sanitize');

// Built-in verified credential ledger
const INITIAL_CERTIFICATES = [
  {
    code: 'SQA-2026-AI01',
    student_name: 'Dr. Vivek Ranade',
    program: 'Applied Artificial Intelligence & Prompt Engineering',
    pillar: 'Pillar 4: Applied AI & Data Intelligence',
    issue_date: 'January 15, 2026',
    grade: 'Master Fellow (99.2%)',
    status: 'VALID',
    badge: 'Executive Fellow'
  },
  {
    code: 'SQA-2026-STATS02',
    student_name: 'Aarav Sharma',
    program: 'Advanced Spreadsheet Engineering & Data Analytics',
    pillar: 'Pillar 1: Engineering & Emerging Technologies',
    issue_date: 'February 20, 2026',
    grade: 'High Distinction (97.5%)',
    status: 'VALID',
    badge: 'Distinguished Scholar'
  },
  {
    code: 'SQA-AI-2024-8842',
    student_name: 'Dr. Evelyn Reed',
    program: 'Autonomous Agent Architecture & Multi-Agent Swarms',
    pillar: 'Pillar 4: Applied AI & Data Intelligence',
    issue_date: 'October 14, 2024',
    grade: 'Master Fellow (98.4%)',
    status: 'VALID',
    badge: 'Founding Fellow'
  },
  {
    code: 'SQA-FS-2024-1092',
    student_name: 'Alex Chen',
    program: 'Cloud-Native Full-Stack Engineering & Microservices',
    pillar: 'Pillar 1: Engineering & Emerging Technologies',
    issue_date: 'November 05, 2024',
    grade: 'Distinction (95.0%)',
    status: 'VALID',
    badge: 'Certified Cloud Architect'
  },
  {
    code: 'SQA-UX-2024-5519',
    student_name: 'Sarah Jenkins',
    program: 'Spatial Design & HMI Human-Computer Interaction',
    pillar: 'Pillar 3: Creative Design & Media Lab',
    issue_date: 'December 01, 2024',
    grade: 'Honors (96.8%)',
    status: 'VALID',
    badge: 'Design Systems Lead'
  },
  {
    code: 'SQA-PM-2024-3321',
    student_name: 'Rohan Mehta',
    program: 'Strategic Product Leadership & Venture Unit Economics',
    pillar: 'Pillar 2: Strategic Business Leadership',
    issue_date: 'January 10, 2025',
    grade: 'High Distinction (97.0%)',
    status: 'VALID',
    badge: 'Product Fellow'
  }
];

class SqaService {
  /**
   * Submit an admissions/counseling lead
   */
  async createLead(data, ip = null) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const leadCode = `LEAD-${randomSuffix}`;

    const lead = await prisma.sqa_leads.create({
      data: {
        lead_code: leadCode,
        full_name: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        service_category: data.serviceCategory.trim(),
        sub_stream: data.subStream ? data.subStream.trim() : '',
        goals: data.goals ? data.goals.trim() : null,
        status: 'NEW',
        ip_address: ip
      }
    });

    return {
      id: leadCode,
      dbId: String(lead.id),
      fullName: lead.full_name,
      email: lead.email,
      phone: lead.phone,
      serviceCategory: lead.service_category,
      subStream: lead.sub_stream || '',
      status: lead.status,
      created_at: lead.created_at
    };
  }

  /**
   * List leads with filtering, search, and CRM summary metrics
   */
  async listLeads(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const where = {};
    const conditions = [];

    if (query.category && query.category.toLowerCase() !== 'all') {
      const cat = query.category.trim();
      const lower = cat.toLowerCase();

      // Build flexible search tokens matching category or pillar variants
      const tokens = [cat];
      if (lower.includes('roadmap')) {
        tokens.push('Roadmap', 'Career');
      } else if (lower.includes('design') || lower.includes('media')) {
        tokens.push('Design', 'Media', 'Creative');
      } else if (lower.includes('certif') || lower.includes('skill')) {
        tokens.push('Certification', 'Skill', 'Certifications');
      } else if (lower.includes('engineer') || lower.includes('tech')) {
        tokens.push('Engineering', 'Emerging', 'Technologies', 'Tech');
      } else if (lower.includes('ai') || lower.includes('data') || lower.includes('intelligence')) {
        tokens.push('AI', 'Data', 'Intelligence');
      } else if (lower.includes('placement') || lower.includes('internship')) {
        tokens.push('Placement', 'Internship');
      } else if (lower.includes('start-up') || lower.includes('startup') || lower.includes('research')) {
        tokens.push('Start-up', 'Startup', 'Research');
      } else if (lower.includes('soft') || lower.includes('personality')) {
        tokens.push('Soft', 'Personality');
      }

      conditions.push({
        OR: tokens.flatMap((t) => [
          { service_category: { contains: t } },
          { sub_stream: { contains: t } }
        ])
      });
    }

    if (query.pillar && query.pillar.toLowerCase() !== 'all') {
      conditions.push({ service_category: { contains: query.pillar.trim() } });
    }

    if (query.status && query.status.toLowerCase() !== 'all') {
      conditions.push({ status: query.status.toUpperCase() });
    }

    if (conditions.length === 1) {
      Object.assign(where, conditions[0]);
    } else if (conditions.length > 1) {
      where.AND = conditions;
    }

    // Global stats across all strategic pillars
    const allGlobalLeads = await prisma.sqa_leads.findMany();
    const totalAll = allGlobalLeads.length;
    const newCount = allGlobalLeads.filter(l => l.status === 'NEW').length;
    const contactedCount = allGlobalLeads.filter(l => l.status === 'CONTACTED').length;
    const enrolledCount = allGlobalLeads.filter(l => l.status === 'ENROLLED').length;
    const conversionRate = totalAll > 0 ? ((enrolledCount / totalAll) * 100).toFixed(1) : '0.0';

    const leads = await prisma.sqa_leads.findMany({
      where,
      orderBy: { id: 'desc' }
    });

    let filtered = leads;
    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      filtered = leads.filter(l =>
        (l.full_name && l.full_name.toLowerCase().includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.phone && l.phone.toLowerCase().includes(q)) ||
        (l.sub_stream && l.sub_stream.toLowerCase().includes(q)) ||
        (l.service_category && l.service_category.toLowerCase().includes(q)) ||
        (l.lead_code && l.lead_code.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    const items = paginated.map(l => ({
      id: l.lead_code || `LEAD-${l.id}`,
      dbId: String(l.id),
      fullName: l.full_name,
      email: l.email,
      phone: l.phone,
      serviceCategory: l.service_category,
      subStream: l.sub_stream || '',
      status: l.status,
      created_at: l.created_at
    }));

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalLeads: totalAll,
        newCount,
        contactedCount,
        enrolledCount,
        conversionRate: `${conversionRate}%`
      }
    };
  }

  /**
   * Update lead CRM status
   */
  async updateLeadStatus(idParam, status) {
    let where = {};
    if (/^\d+$/.test(String(idParam))) {
      where = { id: BigInt(idParam) };
    } else {
      where = { lead_code: idParam };
    }

    const existing = await prisma.sqa_leads.findFirst({ where });
    if (!existing) {
      throw ApiError.notFound('Lead record not found');
    }

    const updated = await prisma.sqa_leads.update({
      where: { id: existing.id },
      data: { status }
    });

    return {
      id: updated.lead_code || `LEAD-${updated.id}`,
      dbId: String(updated.id),
      fullName: updated.full_name,
      status: updated.status,
      updated_at: updated.updated_at
    };
  }

  /**
   * Delete lead from CRM
   */
  async deleteLead(idParam) {
    let where = {};
    if (/^\d+$/.test(String(idParam))) {
      where = { id: BigInt(idParam) };
    } else {
      where = { lead_code: idParam };
    }

    const existing = await prisma.sqa_leads.findFirst({ where });
    if (!existing) {
      throw ApiError.notFound('Lead record not found');
    }

    await prisma.sqa_leads.delete({
      where: { id: existing.id }
    });

    return { success: true, message: 'Lead deleted successfully' };
  }

  /**
   * Submit candidate application
   */
  async createApplication(data) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const appCode = `APP-${randomSuffix}`;

    const app = await prisma.sqa_applications.create({
      data: {
        app_code: appCode,
        full_name: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        service_category: data.serviceCategory || 'Corporate Internship & placement support',
        target_role: data.targetRole.trim(),
        experience_level: data.experienceLevel || null,
        resume_url: data.resumeUrl ? data.resumeUrl.trim() : null,
        statement: data.statement ? data.statement.trim() : null,
        status: 'NEW'
      }
    });

    // Also mirror into sqa_leads for counselor visibility
    await prisma.sqa_leads.create({
      data: {
        lead_code: appCode,
        full_name: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        service_category: data.serviceCategory || 'Corporate Internship & placement support',
        sub_stream: data.targetRole.trim(),
        goals: data.statement || `Experience: ${data.experienceLevel || 'Fresher'}`,
        status: 'NEW'
      }
    });

    return {
      id: appCode,
      dbId: String(app.id),
      fullName: app.full_name,
      email: app.email,
      phone: app.phone,
      serviceCategory: app.service_category,
      targetRole: app.target_role,
      status: app.status
    };
  }

  /**
   * Verify certificate from official registry
   */
  async verifyCertificate(codeParam) {
    const code = (codeParam || '').trim().toUpperCase();
    if (!code) {
      throw ApiError.badRequest('Certificate verification code is required');
    }

    // 1. Check in-memory pre-seeded registry
    const memoryMatch = INITIAL_CERTIFICATES.find(c => c.code.toUpperCase() === code);
    if (memoryMatch) {
      return {
        valid: true,
        code: memoryMatch.code,
        studentName: memoryMatch.student_name,
        program: memoryMatch.program,
        pillar: memoryMatch.pillar,
        issueDate: memoryMatch.issue_date,
        grade: memoryMatch.grade,
        status: memoryMatch.status,
        badge: memoryMatch.badge,
        message: 'Verified Active Credential in Ledger'
      };
    }

    // 2. Check database
    const dbMatch = await prisma.sqa_certificates.findFirst({
      where: { code }
    });

    if (dbMatch) {
      return {
        valid: true,
        code: dbMatch.code,
        studentName: dbMatch.student_name,
        program: dbMatch.program,
        pillar: dbMatch.pillar,
        issueDate: dbMatch.issue_date,
        grade: dbMatch.grade,
        status: dbMatch.status,
        badge: dbMatch.badge || 'Verified Scholar',
        message: 'Verified Active Credential in Ledger'
      };
    }

    return {
      valid: false,
      code,
      message: 'Certificate credential ID not found in official registry'
    };
  }

  /**
   * Export leads to sanitized CSV
   */
  async exportLeadsCsv() {
    const leads = await prisma.sqa_leads.findMany({
      orderBy: { id: 'desc' }
    });

    const headers = ['ID', 'Candidate Name', 'Email', 'Phone', 'Strategic Pillar', 'Specific Track', 'Status', 'Date'];
    const rows = leads.map(l => [
      l.lead_code || `LEAD-${l.id}`,
      `"${sanitizeCsvField(l.full_name).replace(/"/g, '""')}"`,
      `"${sanitizeCsvField(l.email).replace(/"/g, '""')}"`,
      `"${sanitizeCsvField(l.phone).replace(/"/g, '""')}"`,
      `"${sanitizeCsvField(l.service_category).replace(/"/g, '""')}"`,
      `"${sanitizeCsvField(l.sub_stream || '').replace(/"/g, '""')}"`,
      l.status,
      l.created_at ? new Date(l.created_at).toISOString().slice(0, 10) : ''
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

module.exports = new SqaService();


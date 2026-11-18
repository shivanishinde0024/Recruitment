/**
 * Configuration and dependency rules for generic masters engine.
 * Maps URL slugs to Prisma models, parent relation keys, and dependency guards.
 */

const MASTERS_CONFIG = {
  industries: {
    model: 'industries',
    nameField: 'name',
    checkInUse: async (prisma, id) => {
      const count = await prisma.companies.count({
        where: { industry_id: id, deleted_at: null }
      });
      return count > 0 ? `Industry is in use by ${count} active company profile(s)` : null;
    }
  },
  'company-types': {
    model: 'company_types',
    nameField: 'name',
    checkInUse: async (prisma, id) => {
      const count = await prisma.companies.count({
        where: { company_type_id: id, deleted_at: null }
      });
      return count > 0 ? `Company type is in use by ${count} active company profile(s)` : null;
    }
  },
  'job-categories': {
    model: 'job_categories',
    nameField: 'name',
    checkInUse: async (prisma, id) => {
      const jobsCount = await prisma.jobs.count({
        where: { category_id: id, deleted_at: null }
      });
      const titlesCount = await prisma.job_titles.count({
        where: { category_id: id, deleted_at: null }
      });
      if (jobsCount > 0 || titlesCount > 0) {
        return `Category is referenced by ${jobsCount} job(s) and ${titlesCount} title(s)`;
      }
      return null;
    }
  },
  'job-titles': {
    model: 'job_titles',
    nameField: 'name',
    parentKey: 'category_id',
    parentModel: 'job_categories',
    checkInUse: async (prisma, id) => {
      const count = await prisma.jobs.count({
        where: { title_id: id, deleted_at: null }
      });
      return count > 0 ? `Job title is referenced by ${count} active job requirement(s)` : null;
    }
  },
  skills: {
    model: 'skills',
    nameField: 'name',
    checkInUse: async (prisma, id) => {
      const jobSkillsCount = await prisma.job_skills.count({
        where: { skill_id: id }
      });
      const candSkillsCount = await prisma.candidate_skills.count({
        where: { skill_id: id }
      });
      if (jobSkillsCount > 0 || candSkillsCount > 0) {
        return `Skill is referenced by ${jobSkillsCount} job(s) and ${candSkillsCount} candidate(s)`;
      }
      return null;
    }
  },
  qualifications: {
    model: 'qualifications',
    nameField: 'name',
    checkInUse: async (prisma, id) => {
      const jobCount = await prisma.jobs.count({
        where: { qualification_id: id, deleted_at: null }
      });
      const candCount = await prisma.candidates.count({
        where: { qualification_id: id, deleted_at: null }
      });
      if (jobCount > 0 || candCount > 0) {
        return `Qualification is referenced by ${jobCount} job(s) and ${candCount} candidate(s)`;
      }
      return null;
    }
  },
  'employment-types': {
    model: 'employment_types',
    nameField: 'name',
    checkInUse: async (prisma, id) => {
      const count = await prisma.jobs.count({
        where: { employment_type_id: id, deleted_at: null }
      });
      return count > 0 ? `Employment type is referenced by ${count} active job(s)` : null;
    }
  },
  'experience-levels': {
    model: 'experience_levels',
    nameField: 'name',
    hasYears: true,
    checkInUse: async () => null
  },
  'candidate-sources': {
    model: 'candidate_sources',
    nameField: 'name',
    checkInUse: async (prisma, id) => {
      const count = await prisma.candidates.count({
        where: { source_id: id, deleted_at: null }
      });
      return count > 0 ? `Candidate source is referenced by ${count} candidate profile(s)` : null;
    }
  },
  countries: {
    model: 'countries',
    nameField: 'name',
    checkInUse: async (prisma, id) => {
      const stateCount = await prisma.states.count({
        where: { country_id: id, deleted_at: null }
      });
      return stateCount > 0 ? `Country has ${stateCount} linked state(s)` : null;
    }
  },
  states: {
    model: 'states',
    nameField: 'name',
    parentKey: 'country_id',
    parentModel: 'countries',
    checkInUse: async (prisma, id) => {
      const cityCount = await prisma.cities.count({
        where: { state_id: id, deleted_at: null }
      });
      return cityCount > 0 ? `State has ${cityCount} linked city/cities` : null;
    }
  },
  cities: {
    model: 'cities',
    nameField: 'name',
    parentKey: 'state_id',
    parentModel: 'states',
    checkInUse: async (prisma, id) => {
      const jobCount = await prisma.jobs.count({
        where: { city_id: id, deleted_at: null }
      });
      const compCount = await prisma.companies.count({
        where: { city_id: id, deleted_at: null }
      });
      if (jobCount > 0 || compCount > 0) {
        return `City is referenced by ${jobCount} job(s) and ${compCount} company profile(s)`;
      }
      return null;
    }
  }
};

module.exports = MASTERS_CONFIG;

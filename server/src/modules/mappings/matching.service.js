/**
 * Candidate Matching Algorithm (Guide §9.8 / REQ-MAP-01)
 * Computes a weighted match score (0-100) between a job requirement and a candidate profile.
 * - Skills: 50%
 * - Experience: 25%
 * - Location: 15%
 * - Qualification: 10%
 */

function calculateMatchScore(job, candidate) {
  // 1. Skills Score (Max 50 points)
  let skillsScore = 0;
  const jobSkills = job.skills || [];
  const candidateSkillIds = new Set((candidate.skills || []).map((cs) => String(cs.skill_id)));

  if (jobSkills.length === 0) {
    skillsScore = 50;
  } else {
    const mandatorySkills = jobSkills.filter((js) => js.is_mandatory);
    const optionalSkills = jobSkills.filter((js) => !js.is_mandatory);

    if (mandatorySkills.length > 0) {
      const matchedMandatory = mandatorySkills.filter((js) => candidateSkillIds.has(String(js.skill_id))).length;
      const mandatoryPart = (matchedMandatory / mandatorySkills.length) * 35;

      let optionalPart = 0;
      if (optionalSkills.length > 0) {
        const matchedOptional = optionalSkills.filter((js) => candidateSkillIds.has(String(js.skill_id))).length;
        optionalPart = (matchedOptional / optionalSkills.length) * 15;
      } else {
        // If no optional skills, roll remaining 15 into mandatory
        optionalPart = (matchedMandatory / mandatorySkills.length) * 15;
      }
      skillsScore = mandatoryPart + optionalPart;
    } else {
      const matchedCount = jobSkills.filter((js) => candidateSkillIds.has(String(js.skill_id))).length;
      skillsScore = (matchedCount / jobSkills.length) * 50;
    }
  }

  // 2. Experience Score (Max 25 points)
  let expScore = 0;
  const cExp = parseFloat(candidate.experience_years) || 0;
  const minExp = parseFloat(job.experience_min) || 0;
  const maxExp = parseFloat(job.experience_max) || 0;

  if (cExp >= minExp && (maxExp === 0 || cExp <= maxExp)) {
    expScore = 25;
  } else if (maxExp > 0 && cExp > maxExp) {
    // Slightly overqualified
    expScore = 20;
  } else if (minExp > 0) {
    expScore = Math.max(0, Math.min(25, (cExp / minExp) * 25));
  } else {
    expScore = 25;
  }

  // 3. Location Score (Max 15 points)
  let locScore = 0;
  if (!job.city_id && !job.state_id && !job.country_id) {
    locScore = 15; // Remote / unconstrained
  } else if (job.city_id && candidate.city_id && String(job.city_id) === String(candidate.city_id)) {
    locScore = 15;
  } else if (job.state_id && candidate.state_id && String(job.state_id) === String(candidate.state_id)) {
    locScore = 10;
  } else if (job.country_id && candidate.country_id && String(job.country_id) === String(candidate.country_id)) {
    locScore = 5;
  } else {
    locScore = 0;
  }

  // 4. Qualification Score (Max 10 points)
  let qualScore = 0;
  if (!job.qualification_id) {
    qualScore = 10;
  } else if (candidate.qualification_id && String(job.qualification_id) === String(candidate.qualification_id)) {
    qualScore = 10;
  } else {
    qualScore = 0;
  }

  const totalScore = Math.min(100, Math.round(skillsScore + expScore + locScore + qualScore));

  return {
    totalScore,
    breakdown: {
      skillsScore: Math.round(skillsScore),
      expScore: Math.round(expScore),
      locScore: Math.round(locScore),
      qualScore: Math.round(qualScore)
    }
  };
}

module.exports = {
  calculateMatchScore
};

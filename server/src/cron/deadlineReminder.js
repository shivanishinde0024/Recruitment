/**
 * Daily Deadline Reminder Service (REQ-DSH-07 / Flow F14 / Master §10)
 * Scans active job requisitions approaching their application deadline (last_date)
 * and dispatches in-app notifications and email alerts to assigned staff and company contacts.
 */

const prisma = require('../config/db');
const { notify } = require('../services/notify.service');

/**
 * Scan and dispatch alerts for approaching requisition deadlines.
 * Thresholds: 7 days, 3 days, 1 day, or overdue today.
 *
 * @returns {Promise<{ scanned_count: number, notifications_sent: number, alerts: Array }>}
 */
async function checkApproachingDeadlines() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Active jobs that have a last_date specified
  const activeJobs = await prisma.jobs.findMany({
    where: {
      status: { in: ['open', 'in_progress'] },
      deleted_at: null
    },
    include: {
      company: true,
      assignedStaff: true
    }
  });

  let notificationsSent = 0;
  const alertsDispatched = [];

  for (const job of activeJobs) {
    if (!job.last_date) continue;

    const deadline = new Date(job.last_date);
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Alert triggers: <= 7 days, <= 3 days, <= 1 day, or overdue (diffDays <= 0)
    if (diffDays <= 7) {
      const urgencyLabel = diffDays < 0
        ? `OVERDUE by ${Math.abs(diffDays)} day(s)`
        : diffDays === 0
        ? 'DUE TODAY'
        : `Due in ${diffDays} day(s)`;

      // Notify assigned staff if assigned
      if (job.assigned_to) {
        await notify({
          userId: job.assigned_to,
          type: 'job_deadline_reminder',
          title: `Requisition Deadline Alert: ${job.job_code}`,
          message: `Job "${job.title}" (${job.job_code}) for ${job.company?.company_name || 'Client'} is ${urgencyLabel} (${deadline.toISOString().split('T')[0]}).`,
          link: `/admin/jobs/${job.id}`,
          metadata: {
            jobId: String(job.id),
            jobCode: job.job_code,
            diffDays
          }
        });
        notificationsSent++;
      }

      // Notify company user(s) associated with company
      if (job.company_id) {
        const companyUsers = await prisma.users.findMany({
          where: {
            company_id: job.company_id,
            status: 'active',
            deleted_at: null
          }
        });

        for (const cu of companyUsers) {
          await notify({
            userId: cu.id,
            type: 'job_deadline_reminder',
            title: `Requisition Deadline Alert: ${job.job_code}`,
            message: `Your job requisition "${job.title}" is ${urgencyLabel}. Please review shortlisted candidates to fulfill open positions.`,
            link: `/company/jobs/${job.id}`,
            metadata: {
              jobId: String(job.id),
              jobCode: job.job_code,
              diffDays
            }
          });
          notificationsSent++;
        }
      }

      alertsDispatched.push({
        job_id: String(job.id),
        job_code: job.job_code,
        diff_days: diffDays,
        urgency: urgencyLabel
      });
    }
  }

  return {
    scanned_count: activeJobs.length,
    notifications_sent: notificationsSent,
    alerts: alertsDispatched
  };
}

module.exports = {
  checkApproachingDeadlines
};

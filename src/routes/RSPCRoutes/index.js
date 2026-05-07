import { host } from "../globalRoutes";

export const BASE = `${host}/research_procedures/api`;
export const STAFF_BASE = `${host}/research_procedures/api`;
export const GOVERNANCE_BASE = `${host}/research_procedures/api`;

export const fetchProjectsRoute = `${BASE}/projects/`;
export const fetchPublicationsRoute = `${BASE}/publications/`;
export const fetchPatentsRoute = `${BASE}/patents/`;
export const fetchScholarsRoute = `${BASE}/scholars/`;
export const fetchPhdStudentOptionsRoute = `${BASE}/students/phd-options/`;
export const fetchConsultanciesRoute = `${BASE}/consultancies/`;
export const fetchExpendituresRoute = `${BASE}/expenditures/`;
export const fetchMilestonesRoute = `${BASE}/milestones/`;
export const fetchFundingAgenciesRoute = `${BASE}/funding-agencies/`;
export const fetchReportsRoute = `${BASE}/reports/`;

export const fetchRecruitmentPostsRoute = `${STAFF_BASE}/recruitment-posts/`;
export const fetchStaffApplicationsRoute = `${STAFF_BASE}/applications/`;
export const fetchStaffAppointmentsRoute = `${STAFF_BASE}/appointments/`;

export const fetchApprovalRequestsRoute = `${GOVERNANCE_BASE}/approval-requests/`;
export const fetchProgressEntriesRoute = `${GOVERNANCE_BASE}/progress-entries/`;
export const fetchClosureRequestsRoute = `${GOVERNANCE_BASE}/closure-requests/`;
export const fetchManagedDocumentsRoute = `${GOVERNANCE_BASE}/documents/`;
export const fetchRuleDefinitionsRoute = `${GOVERNANCE_BASE}/rules/`;
export const fetchAutomationRulesRoute = `${GOVERNANCE_BASE}/automation-rules/`;
export const fetchAuditEventsRoute = `${GOVERNANCE_BASE}/audit-events/`;

export const governanceLoginRoute = `${GOVERNANCE_BASE}/auth/login/`;
export const governanceLogoutRoute = `${GOVERNANCE_BASE}/auth/logout/`;
export const governanceMeRoute = `${GOVERNANCE_BASE}/auth/me/`;
export const governanceChangePasswordRoute = `${GOVERNANCE_BASE}/auth/change-password/`;

export const updateProjectStatusRoute = (id) =>
  `${BASE}/projects/${id}/update_status/`;
export const projectDetailsRoute = (id) =>
  `${BASE}/projects/${id}/project_details/`;
export const saveProjectDraftRoute = (id) =>
  `${BASE}/projects/${id}/save_draft/`;
export const resubmitProjectRoute = (id) => `${BASE}/projects/${id}/resubmit/`;
export const vetProjectByHodRoute = (id) => `${BASE}/projects/${id}/vet_hod/`;
export const verifyProjectByAdminRoute = (id) =>
  `${BASE}/projects/${id}/verify_admin/`;
export const deanDecisionProjectRoute = (id) =>
  `${BASE}/projects/${id}/dean_decision/`;
export const directorDecisionProjectRoute = (id) =>
  `${BASE}/projects/${id}/director_decision/`;
export const modifyProjectDurationRoute = (id) =>
  `${BASE}/projects/${id}/modify_duration/`;
export const downloadProjectPdfRoute = (id) =>
  `${BASE}/projects/${id}/download_pdf/`;
export const approveExpenditureRoute = (id) =>
  `${BASE}/expenditures/${id}/approve/`;
export const rejectExpenditureRoute = (id) =>
  `${BASE}/expenditures/${id}/reject/`;
export const stipendDisbursementsRoute = `${BASE}/expenditures/stipend_disbursements/`;
export const verifyPublicationRoute = (id) =>
  `${BASE}/publications/${id}/verify/`;
export const updatePatentStatusRoute = (id) =>
  `${BASE}/patents/${id}/update_status/`;
export const updateScholarStatusRoute = (id) =>
  `${BASE}/scholars/${id}/update_status/`;

export const forwardApprovalRoute = (id) =>
  `${GOVERNANCE_BASE}/approval-requests/${id}/forward/`;
export const approveApprovalRoute = (id) =>
  `${GOVERNANCE_BASE}/approval-requests/${id}/approve/`;
export const rejectApprovalRoute = (id) =>
  `${GOVERNANCE_BASE}/approval-requests/${id}/reject/`;
export const projectInboxRoute = `${GOVERNANCE_BASE}/approval-requests/inbox/`;
export const projectInventoryRoute = `${GOVERNANCE_BASE}/approval-requests/project_inventory/`;
export const projectStaffRoute = `${GOVERNANCE_BASE}/approval-requests/project_staff/`;
export const documentHistoryRoute = (id) =>
  `${GOVERNANCE_BASE}/documents/${id}/history/`;
export const approveClosureRoute = (id) =>
  `${GOVERNANCE_BASE}/closure-requests/${id}/approve/`;
export const evaluateRuleRoute = (id) =>
  `${GOVERNANCE_BASE}/rules/${id}/evaluate/`;
export const executeAutomationRoute = (id) =>
  `${GOVERNANCE_BASE}/automation-rules/${id}/execute/`;
export const modifyStaffTenureRoute = (id) =>
  `${STAFF_BASE}/appointments/${id}/modify_tenure/`;
export const processStaffAppointmentAdminRoute = (id) =>
  `${STAFF_BASE}/appointments/${id}/process_admin/`;
export const deanDecisionStaffAppointmentRoute = (id) =>
  `${STAFF_BASE}/appointments/${id}/dean_decision/`;
export const instituteStatsRoute = `${BASE}/institute/stats/`;
export const complianceReportRoute = `${BASE}/compliance/report/`;

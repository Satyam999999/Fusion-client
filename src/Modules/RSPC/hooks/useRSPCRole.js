import { useSelector } from "react-redux";

// Maps raw role strings from Redux into a canonical RSPC role key
function resolveRole(raw) {
  const r = String(raw || "").toLowerCase();
  if (
    r === "faculty" ||
    r === "professor" ||
    r === "assistant professor" ||
    r === "associate professor"
  )
    return "FACULTY";
  if (r === "hod" || r === "department_head" || r === "departmenthead")
    return "HOD";
  if (r === "rspc_admin" || r === "sectionhead_rspc") return "RSPC_ADMIN";
  if (r === "dean_rspc") return "DEAN_RSPC";
  if (r === "director") return "DIRECTOR";
  return "FACULTY"; // least-privilege default
}

// Permission matrix — exactly matches the UC/BR permission image
const ROLE_MATRIX = {
  FACULTY: [
    "list_projects",
    "create_project",
    "save_draft",
    "resubmit",
    "submit_report",
    "add_expenditure",
    "add_milestone",
    "add_publication",
    "file_patent",
    "create_consultancy",
    "view_expenditures",
  ],
  HOD: ["list_projects", "vet_project", "view_expenditures"],
  RSPC_ADMIN: [
    "list_projects",
    "create_project",
    "save_draft",
    "verify_admin",
    "modify_duration",
    "update_status",
    "add_expenditure",
    "approve_exp_lte50k",
    "reject_expenditure",
    "submit_report",
    "compliance_report",
    "view_expenditures",
    "add_publication",
    "file_patent",
    "create_consultancy",
    "view_inbox",
    "view_inventory",
    "view_staff",
    "view_stipends",
    "modify_tenure",
    "process_staff_admin",
    "download_pdf",
    "view_details",
  ],
  DEAN_RSPC: [
    "list_projects",
    "dean_decision",
    "view_expenditures",
    "approve_exp_50k_200k",
    "view_inbox",
    "view_details",
    "dean_staff",
  ],
  DIRECTOR: [
    "list_projects",
    "director_decision",
    "view_expenditures",
    "approve_exp_gt200k",
    "view_inbox",
    "view_details",
  ],
};

export const ROLE_LABELS = {
  FACULTY: "Faculty (PI)",
  HOD: "Head of Department",
  RSPC_ADMIN: "RSPC Admin",
  DEAN_RSPC: "Dean RSPC",
  DIRECTOR: "Director",
};

export const ROLE_COLORS = {
  FACULTY: "blue",
  HOD: "teal",
  RSPC_ADMIN: "violet",
  DEAN_RSPC: "grape",
  DIRECTOR: "pink",
};

// Login visibility plan for the 5 RSPC roles.
// Keys map to RSPC frontend routes and are used by sidebar/route guards.
export const ROLE_LOGIN_VIEWS = {
  FACULTY: [
    "/research",
    "/research/forms",
    "/research/publications",
    "/research/patents",
    "/research/consultancy",
  ],
  HOD: ["/research", "/research/forms"],
  RSPC_ADMIN: [
    "/research",
    "/research/forms",
    "/research/publications",
    "/research/patents",
    "/research/consultancy",
    "/research/scholars",
    "/research/workflow-tools",
    "/staff/recruitment",
    "/staff/applications",
    "/staff/appointments",
    "/governance",
  ],
  DEAN_RSPC: [
    "/research",
    "/research/forms",
    "/research/scholars",
    "/research/workflow-tools",
    "/staff/recruitment",
    "/staff/applications",
    "/staff/appointments",
    "/governance",
  ],
  DIRECTOR: [
    "/research",
    "/research/forms",
    "/research/scholars",
    "/research/workflow-tools",
    "/governance",
  ],
};

export const ROLE_ACTION_PLAN = {
  FACULTY: [
    "List / Read projects",
    "Create / Edit own project",
    "Save Draft / Resubmit",
    "Submit Progress Report",
  ],
  HOD: ["List / Read projects", "Vet by HoD"],
  RSPC_ADMIN: [
    "List / Read projects",
    "Create / Edit own project",
    "Save Draft / Resubmit",
    "Verify (Admin)",
    "Modify Duration",
    "Approve Expenditure <= 50k",
    "Reject Expenditure",
    "Submit Progress Report",
    "Compliance Reports",
  ],
  DEAN_RSPC: [
    "List / Read projects",
    "Dean Decision",
    "Approve Expenditure 50k-200k",
  ],
  DIRECTOR: [
    "List / Read projects",
    "Director Decision",
    "Approve Expenditure > 200k",
  ],
};

// Returns { role, can, label, color }
export function useRSPCRole() {
  const raw = useSelector((s) => s.user?.rspcRole || s.user?.role || "");
  const role = resolveRole(raw);
  const permissions = ROLE_MATRIX[role] || [];

  function can(action) {
    return permissions.includes(action);
  }

  // Expenditure approval: returns true only if role is authorized AND amount is in range
  function canApproveExpenditure(amount) {
    const amt = parseFloat(amount) || 0;
    if (role === "RSPC_ADMIN" && amt <= 50000) return true;
    if (role === "DEAN_RSPC" && amt > 50000 && amt <= 200000) return true;
    if (role === "DIRECTOR" && amt > 200000) return true;
    return false;
  }

  function canRejectExpenditure() {
    return role === "RSPC_ADMIN";
  }

  return {
    role,
    can,
    canApproveExpenditure,
    canRejectExpenditure,
    visibleRoutes: ROLE_LOGIN_VIEWS[role] || ["/research"],
    actionPlan: ROLE_ACTION_PLAN[role] || [],
    label: ROLE_LABELS[role] || role,
    color: ROLE_COLORS[role] || "gray",
  };
}

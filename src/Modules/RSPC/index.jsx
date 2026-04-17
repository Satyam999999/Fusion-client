import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";

import ResearchProjects from "./researchProjects";
import RequestForms from "./requestForms";
import Publications from "./publications";
import Patents from "./patents";
import Consultancy from "./consultancy";
import Scholars from "./scholars";
import WorkflowTools from "./workflowTools";

function mapRoleToRspcRole(role) {
  if (role === "faculty" || role === "assistant professor" || role === "associate professor") {
    return "Professor";
  }
  if (role === "rspc_admin" || role === "sectionhead_rspc") {
    return "SectionHead_RSPC";
  }
  if (role === "hod") {
    return "HOD";
  }
  return "Professor";
}

export default function RSPCRoutes() {
  const rawRole = useSelector((state) => state.user.role || "");
  const activeRole = mapRoleToRspcRole(String(rawRole).toLowerCase());

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/research" replace />} />
      <Route path="/research" element={<ResearchProjects activeRole={activeRole} />} />
      <Route path="/research/forms" element={<RequestForms />} />
      <Route path="/research/publications" element={<Publications />} />
      <Route path="/research/patents" element={<Patents />} />
      <Route path="/research/consultancy" element={<Consultancy />} />
      <Route path="/research/scholars" element={<Scholars />} />
      <Route path="/research/workflow-tools" element={<WorkflowTools />} />
      <Route path="*" element={<Navigate to="/research" replace />} />
    </Routes>
  );
}

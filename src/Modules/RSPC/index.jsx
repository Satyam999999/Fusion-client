import { Navigate, Route, Routes } from "react-router-dom";
import PropTypes from "prop-types";

import ResearchProjects from "./researchProjects";
import RequestForms from "./requestForms";
import Publications from "./publications";
import Patents from "./patents";
import Consultancy from "./consultancy";
import Scholars from "./scholars";
import WorkflowTools from "./workflowTools";
import { useRSPCRole } from "./hooks/useRSPCRole";

// Roles allowed to access WorkflowTools — HOD removed (vet action is inline on project row)
const WORKFLOW_ROLES = new Set(["RSPC_ADMIN", "DEAN_RSPC", "DIRECTOR"]);

function RequireWorkflowRole({ children }) {
  const { role } = useRSPCRole();
  if (!WORKFLOW_ROLES.has(role)) {
    return <Navigate to="/research" replace />;
  }
  return children;
}

RequireWorkflowRole.propTypes = {
  children: PropTypes.node.isRequired,
};

function RequireRouteAccess({ route, children }) {
  const { visibleRoutes } = useRSPCRole();
  if (!visibleRoutes.includes(route)) {
    return <Navigate to="/research" replace />;
  }
  return children;
}

RequireRouteAccess.propTypes = {
  route: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default function RSPCRoutes() {
  return (
    <Routes>
      <Route
        index
        element={
          <RequireRouteAccess route="/research">
            <ResearchProjects />
          </RequireRouteAccess>
        }
      />
      <Route
        path="forms"
        element={
          <RequireRouteAccess route="/research/forms">
            <RequestForms />
          </RequireRouteAccess>
        }
      />
      <Route
        path="publications"
        element={
          <RequireRouteAccess route="/research/publications">
            <Publications />
          </RequireRouteAccess>
        }
      />
      <Route
        path="patents"
        element={
          <RequireRouteAccess route="/research/patents">
            <Patents />
          </RequireRouteAccess>
        }
      />
      <Route
        path="consultancy"
        element={
          <RequireRouteAccess route="/research/consultancy">
            <Consultancy />
          </RequireRouteAccess>
        }
      />
      <Route
        path="scholars"
        element={
          <RequireRouteAccess route="/research/scholars">
            <Scholars />
          </RequireRouteAccess>
        }
      />
      <Route
        path="workflow-tools"
        element={
          <RequireRouteAccess route="/research/workflow-tools">
            <RequireWorkflowRole>
              <WorkflowTools />
            </RequireWorkflowRole>
          </RequireRouteAccess>
        }
      />
      <Route path="*" element={<Navigate to="/research" replace />} />
    </Routes>
  );
}

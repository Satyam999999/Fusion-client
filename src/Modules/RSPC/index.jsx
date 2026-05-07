import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PropTypes from "prop-types";

import RSPCPageLoader from "./components/RSPCPageLoader";
import { useRSPCRole } from "./hooks/useRSPCRole";
import "./styles/uiTokens.css";

const ResearchProjects = lazy(() => import("./researchProjects"));
const RequestForms = lazy(() => import("./requestForms"));
const Publications = lazy(() => import("./publications"));
const Patents = lazy(() => import("./patents"));
const Consultancy = lazy(() => import("./consultancy"));
const Scholars = lazy(() => import("./scholars"));
const ManagementConsole = lazy(() => import("./managementConsole"));

// Roles allowed to access ManagementConsole — HOD removed (vet action is inline on project row)
const MANAGEMENT_ROLES = new Set(["RSPC_ADMIN", "DEAN_RSPC", "DIRECTOR"]);

function RequireManagementRole({ children }) {
  const { role } = useRSPCRole();
  if (!MANAGEMENT_ROLES.has(role)) {
    return <Navigate to="/research" replace />;
  }
  return children;
}

RequireManagementRole.propTypes = {
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
    <Suspense fallback={<RSPCPageLoader />}>
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
          path="management-console"
          element={
            <RequireRouteAccess route="/research/management-console">
              <RequireManagementRole>
                <ManagementConsole />
              </RequireManagementRole>
            </RequireRouteAccess>
          }
        />
        <Route path="*" element={<Navigate to="/research" replace />} />
      </Routes>
    </Suspense>
  );
}

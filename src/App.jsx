import { createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Notifications } from "@mantine/notifications";
import { useSelector } from "react-redux";
import { Layout } from "./components/layout";
import Dashboard from "./Modules/Dashboard/dashboardNotifications";
import Profile from "./Modules/Dashboard/StudentProfile/profilePage";
import LoginPage from "./pages/login";
import ForgotPassword from "./pages/forgotPassword";
import AcademicPage from "./Modules/Academic/index";
import ValidateAuth from "./helper/validateauth";
import FacultyProfessionalProfile from "./Modules/facultyProfessionalProfile/facultyProfessionalProfile";
import InactivityHandler from "./helper/inactivityhandler";
import Examination from "./Modules/Examination/examination";
import Database from "./Modules/Database/database";
import ProgrammeCurriculumRoutes from "./Modules/Program_curriculum/programmCurriculum";
import RSPCRoutes from "./Modules/RSPC";
import StaffRecruitment from "./Modules/Staff/staffRecruitment";
import StaffApplications from "./Modules/Staff/staffApplications";
import StaffAppointments from "./Modules/Staff/staffAppointments";
import Governance from "./Modules/Governance/governance";
import NotFoundPage from "./components/NotFoundPage";

const theme = createTheme({
  breakpoints: {
    xxs: "300px",
    xs: "375px",
    sm: "768px",
    md: "992px",
    lg: "1200px",
    xl: "1408px",
  },
});

export default function App() {
  const location = useLocation();
  const accessibleModules = useSelector(
    (state) => state.user.currentAccessibleModules || {},
  );
  const moduleAliases = {
    rspc: ["research_procedures", "research"],
  };

  const normalizedAccessibleModules = Object.entries(accessibleModules).reduce(
    (acc, [key, value]) => {
      acc[String(key).toLowerCase()] = Boolean(value);
      return acc;
    },
    {},
  );

  const hasModuleAccess = (moduleId) => {
    if (moduleId === "home") return true;
    if (String(moduleId).toLowerCase() === "rspc") return true;
    const moduleKey = String(moduleId).toLowerCase();
    if (normalizedAccessibleModules[moduleKey]) return true;
    const aliases = (moduleAliases[moduleKey] || []).map((alias) =>
      String(alias).toLowerCase(),
    );
    return aliases.some((alias) => normalizedAccessibleModules[alias]);
  };

  const guardModule = (moduleId, element) =>
    hasModuleAccess(moduleId) ? element : <Navigate to="/dashboard" replace />;

  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-center" autoClose={2000} limit={1} />
      {location.pathname !== "/accounts/login" && <ValidateAuth />}
      {location.pathname !== "/accounts/login" && <InactivityHandler />}

      <Routes>
        <Route path="/" element={<Navigate to="/accounts/login" replace />} />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/academics"
          element={guardModule(
            "course_registration",
            <Layout>
              <AcademicPage />
            </Layout>,
          )}
        />
        <Route
          path="/profile"
          element={
            <Layout>
              <Profile />
            </Layout>
          }
        />
        <Route
          path="/facultyprofessionalprofile/*"
          element={
            <Layout>
              <FacultyProfessionalProfile />
            </Layout>
          }
        />
        <Route
          path="/programme_curriculum/*"
          element={guardModule(
            "program_and_curriculum",
            <div>
              <ProgrammeCurriculumRoutes />
            </div>,
          )}
        />
        <Route
          path="/research/*"
          element={guardModule(
            "rspc",
            <Layout>
              <RSPCRoutes />
            </Layout>,
          )}
        />
        <Route
          path="/staff/recruitment"
          element={guardModule(
            "rspc",
            <Layout>
              <StaffRecruitment />
            </Layout>,
          )}
        />
        <Route
          path="/staff/applications"
          element={guardModule(
            "rspc",
            <Layout>
              <StaffApplications />
            </Layout>,
          )}
        />
        <Route
          path="/staff/appointments"
          element={guardModule(
            "rspc",
            <Layout>
              <StaffAppointments />
            </Layout>,
          )}
        />
        <Route
          path="/governance"
          element={guardModule(
            "rspc",
            <Layout>
              <Governance />
            </Layout>,
          )}
        />
        <Route path="/accounts/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ForgotPassword />} />
        <Route
          path="/examination/*"
          element={guardModule("examinations", <Examination />)}
        />
        <Route
          path="/database/*"
          element={guardModule("database", <Database />)}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MantineProvider>
  );
}

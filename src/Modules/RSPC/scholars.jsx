import { useEffect, useState, useRef } from "react";
import {
  Tabs,
  Button,
  Text,
  Paper,
  Grid,
  Badge,
  Loader,
  Center,
  Flex,
  Select,
  Alert,
} from "@mantine/core";
import {
  CheckCircle,
  CaretCircleLeft,
  CaretCircleRight,
  Warning,
} from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import RSPCBreadcrumbs from "./components/RSPCBreadcrumbs";
import ScholarsTable from "./components/tables/scholarsTable";
import classes from "./styles/researchProjectsStyle.module.css";
import formClasses from "./styles/formStyle.module.css";
import {
  fetchScholarsRoute,
  fetchPhdStudentOptionsRoute,
} from "../../routes/RSPCRoutes";
import { badgeColor } from "./helpers/badgeColours";
import { useRSPCRole } from "./hooks/useRSPCRole";

// Human-readable labels for raw progress_status enum values
const PROGRESS_LABELS = {
  REGISTERED: "Registered",
  COURSEWORK: "Coursework",
  COMPREHENSIVE_EXAM: "Comprehensive Exam",
  SYNOPSIS_PHASE: "Synopsis Phase",
  RESEARCH_PHASE: "Research Phase",
  THESIS_WRITING: "Thesis Writing",
  DEFENSE_READY: "Defense Ready",
  DEFENDED: "Defended",
  COMPLETED: "Completed",
};

const FELLOWSHIP_OPTIONS = [
  { value: "GATE", label: "GATE" },
  { value: "NET", label: "NET" },
  { value: "CSIR", label: "CSIR" },
  { value: "DBT", label: "DBT" },
  { value: "INSTITUTE", label: "Institute Fellowship" },
  { value: "SPONSORED", label: "Sponsored" },
  { value: "SELF_FUNDED", label: "Self Funded" },
  { value: "OTHER", label: "Other" },
];

const PROGRESS_OPTIONS = Object.entries(PROGRESS_LABELS).map(([v, l]) => ({
  value: v,
  label: l,
}));

function Scholars() {
  const { role } = useRSPCRole();
  const canMutateScholars = role === "RSPC_ADMIN";
  const [scholars, setScholars] = useState([]);
  const [students, setStudents] = useState([]);  // PhD students for selector
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [activeTab, setActiveTab] = useState("0");
  const [form, setForm] = useState({
    student: "",          // student PK (integer as string)
    fellowship_type: "",
    enrollment_date: "",
    expected_completion: "",
    progress_status: "COURSEWORK",
  });
  const tabsListRef = useRef(null);

  // Load scholars list with AbortController to prevent memory leaks on unmount
  const loadScholars = (signal) => {
    setLoading(true);
    setLoadError(null);
    axios
      .get(fetchScholarsRoute, { signal })
      .then((res) => {
        setScholars(res.data.results || res.data);
      })
      .catch((e) => {
        if (axios.isCancel(e)) return;
        setLoadError("Failed to load scholars. Please refresh.");
      })
      .finally(() => setLoading(false));
  };

  // Fetch PhD students once for the registration selector
  const loadStudents = (signal) => {
    axios
      .get(fetchPhdStudentOptionsRoute, { signal })
      .then((res) => {
        const list = res.data.results || res.data || [];
        setStudents(
          list.map((s) => ({
            value: String(s.id),
            label: s.name || s.username || String(s.id),
          }))
        );
      })
      .catch((e) => {
        if (axios.isCancel(e)) return;
        // Non-critical — show empty select with a fallback message
        setStudents([]);
      });
  };

  useEffect(() => {
    const controller = new AbortController();
    loadScholars(controller.signal);
    loadStudents(controller.signal);
    return () => controller.abort();   // cancel on unmount
  }, []);

  const handleRegister = async () => {
    setFieldErrors({});
    const studentValue = (form.student || "").trim();
    if (!studentValue) {
      setFieldErrors({ student: "Please select a student." });
      return;
    }
    if (!form.enrollment_date) {
      setFieldErrors({ enrollment_date: "Enrollment date is required." });
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(fetchScholarsRoute, {
        student: studentValue,
        fellowship_type: form.fellowship_type,
        enrollment_date: form.enrollment_date,
        expected_completion: form.expected_completion || null,
        progress_status: form.progress_status,
      });
      notifications.show({
        title: "Registered",
        message: "Scholar registered successfully",
        color: "green",
      });
      const controller = new AbortController();
      loadScholars(controller.signal);
      setActiveTab("0");
      setForm({
        student: "",
        fellowship_type: "",
        enrollment_date: "",
        expected_completion: "",
        progress_status: "COURSEWORK",
      });
    } catch (e) {
      // Surface DRF field-level errors so the user knows what to fix
      const errData = e.response?.data;
      if (errData && typeof errData === "object" && !errData.error) {
        // DRF validation error dict: { field: [msg, ...], ... }
        const mapped = {};
        Object.entries(errData).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v.join(" ") : String(v);
        });
        setFieldErrors(mapped);
        notifications.show({
          title: "Validation Error",
          message: "Please fix the highlighted fields.",
          color: "orange",
        });
      } else {
        notifications.show({
          title: "Error",
          message: errData?.error || errData?.detail || "Failed to register scholar",
          color: "red",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const progressCounts = scholars.reduce((acc, s) => {
    acc[s.progress_status] = (acc[s.progress_status] || 0) + 1;
    return acc;
  }, {});

  const tabItems = [
    {
      title: "All Scholars",
      component: loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : loadError ? (
        <Alert icon={<Warning size={18} />} color="red" title="Load Error" mt="md">
          {loadError}
        </Alert>
      ) : (
        <ScholarsTable scholars={scholars} onRefresh={() => {
          const c = new AbortController();
          loadScholars(c.signal);
        }} canUpdate={canMutateScholars} />
      ),
    },
    {
      title: "Progress Summary",
      component: (
        <Paper className={formClasses.formContainer}>
          <Text fw={700} size="lg" mb="md">
            Scholar Progress Overview
          </Text>
          <Flex wrap="wrap" gap="sm" justify="center">
            {Object.entries(progressCounts).map(([status, count]) => (
              <Paper
                key={status}
                p="md"
                withBorder
                style={{ minWidth: 160, textAlign: "center" }}
              >
                <Badge
                  color={badgeColor[status] || "gray"}
                  size="xl"
                  style={{ color: "#3f3f3f" }}
                  mb={8}
                >
                  {/* Display human-readable label instead of raw enum */}
                  {PROGRESS_LABELS[status] || status}
                </Badge>
                <Text size="xl" fw={700}>
                  {count}
                </Text>
                <Text size="xs" c="dimmed">
                  scholars
                </Text>
              </Paper>
            ))}
            {scholars.length === 0 && (
              <Text c="dimmed">
                No scholars found. Register one using the tab above.
              </Text>
            )}
          </Flex>
        </Paper>
      ),
    },
    ...(canMutateScholars
      ? [{
      title: "Register Scholar",
      component: (
        <Paper className={formClasses.formContainer}>
          <Text fw={700} size="lg" mb="md">
            Register New Research Scholar
          </Text>
          <Grid gutter="md">
            {/* Student selector — binds to student PK, not a free-text name */}
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Student"
                placeholder="Search PhD student..."
                required
                searchable
                data={students}
                value={form.student}
                onChange={(val) => setForm((f) => ({ ...f, student: val || "" }))}
                error={fieldErrors.student}
                nothingFoundMessage="No PhD students found"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Fellowship Type"
                placeholder="Select fellowship"
                data={FELLOWSHIP_OPTIONS}
                value={form.fellowship_type}
                onChange={(val) => setForm((f) => ({ ...f, fellowship_type: val || "" }))}
                error={fieldErrors.fellowship_type}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                Enrollment Date <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="date"
                value={form.enrollment_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, enrollment_date: e.target.value }))
                }
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 6,
                  border: fieldErrors.enrollment_date ? "1px solid red" : "1px solid #ced4da",
                  fontSize: 14,
                }}
              />
              {fieldErrors.enrollment_date && (
                <Text c="red" size="xs" mt={4}>{fieldErrors.enrollment_date}</Text>
              )}
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                Expected Completion
              </label>
              <input
                type="date"
                value={form.expected_completion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expected_completion: e.target.value }))
                }
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 6,
                  border: "1px solid #ced4da", fontSize: 14,
                }}
              />
              {fieldErrors.expected_completion && (
                <Text c="red" size="xs" mt={4}>{fieldErrors.expected_completion}</Text>
              )}
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Initial Progress Status"
                data={PROGRESS_OPTIONS}
                value={form.progress_status}
                onChange={(val) => setForm((f) => ({ ...f, progress_status: val || "COURSEWORK" }))}
                error={fieldErrors.progress_status}
              />
            </Grid.Col>
          </Grid>

          {/* Generic non-field error */}
          {fieldErrors.non_field_errors && (
            <Alert icon={<Warning size={16} />} color="red" mt="md">
              {fieldErrors.non_field_errors}
            </Alert>
          )}

          <div className={formClasses.submitButtonContainer}>
            <Button
              color="#15ABFF"
              style={{ borderRadius: 8 }}
              onClick={handleRegister}
              loading={submitting}
              leftSection={<CheckCircle size={18} />}
            >
              Register Scholar
            </Button>
          </div>
        </Paper>
      ),
    }]
      : []),
  ];

  const handleTabNav = (dir) => {
    const n =
      dir === "next"
        ? Math.min(+activeTab + 1, tabItems.length - 1)
        : Math.max(+activeTab - 1, 0);
    setActiveTab(String(n));
    tabsListRef.current?.scrollBy({
      left: dir === "next" ? 50 : -50,
      behavior: "smooth",
    });
  };

  return (
    <>
      <RSPCBreadcrumbs projectTitle="Research Scholars" />
      <Flex justify="space-between" align="center" mt="lg">
        <Flex align="center">
          <Button
            onClick={() => handleTabNav("prev")}
            variant="subtle"
            p={0}
            mr={4}
            color="#15ABFF"
            disabled={+activeTab === 0}
          >
            <CaretCircleLeft size={28} />
          </Button>
          <div className={classes.fusionTabsContainer} ref={tabsListRef}>
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                {tabItems.map((item, i) => (
                  <Tabs.Tab
                    key={i}
                    value={String(i)}
                    className={
                      activeTab === String(i)
                        ? classes.fusionActiveRecentTab
                        : ""
                    }
                  >
                    <Text className={classes.fusionText}>{item.title}</Text>
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>
          </div>
          <Button
            onClick={() => handleTabNav("next")}
            variant="subtle"
            p={0}
            ml={4}
            color="#15ABFF"
            disabled={+activeTab === tabItems.length - 1}
          >
            <CaretCircleRight size={28} />
          </Button>
        </Flex>
      </Flex>
      <div style={{ marginTop: 16 }}>{tabItems[+activeTab]?.component}</div>
    </>
  );
}
export default Scholars;

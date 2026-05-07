import { useEffect, useState, useRef } from "react";
import {
  Tabs,
  Button,
  Flex,
  Text,
  Paper,
  Grid,
  TextInput,
  Textarea,
  Select,
  Title,
  Loader,
  Center,
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
import ConsultancyTable from "./components/tables/consultancyTable";
import DetailViewModal from "./components/modals/detailViewModal";
import classes from "./styles/researchProjectsStyle.module.css";
import formClasses from "./styles/formStyle.module.css";
import { fetchConsultanciesRoute } from "../../routes/RSPCRoutes";
import { useRSPCRole } from "./hooks/useRSPCRole";

const CLIENT_TYPES = [
  { value: "INDUSTRY", label: "Industry" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "NGO", label: "NGO" },
  { value: "ACADEMIC", label: "Academic" },
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "OTHER", label: "Other" },
];

function Consultancy() {
  const { can } = useRSPCRole();
  const [consultancies, setConsultancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [activeTab, setActiveTab] = useState("0");
  const [viewData, setViewData] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    client_name: "",
    client_type: "INDUSTRY",
    client_email: "",
    contract_amount: "",
    faculty_share: "",
    institute_share: "",
    start_date: "",
    end_date: "",
    description: "",
  });
  const tabsListRef = useRef(null);

  const loadConsultancies = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await axios.get(fetchConsultanciesRoute);
      setConsultancies(res.data.results || res.data);
    } catch (e) {
      setLoadError("Failed to load consultancies.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadConsultancies();
  }, []);

  const handleSubmit = async () => {
    setFieldErrors({});
    if (!form.title || !form.client_name || !form.start_date) {
      notifications.show({
        title: "Validation",
        message: "Title, client name, and start date are required",
        color: "red",
      });
      return;
    }

    const contractAmount = Number(form.contract_amount || 0);
    const instituteShare = Number(form.institute_share || 0);
    const facultyShare = Number(form.faculty_share || 0);

    if (!contractAmount || contractAmount < 50000) {
      setFieldErrors((prev) => ({
        ...prev,
        contract_amount: "Contract amount must be at least 50,000.",
      }));
      return;
    }

    if (instituteShare < contractAmount * 0.3) {
      setFieldErrors((prev) => ({
        ...prev,
        institute_share: "Institute share must be at least 30% of contract amount.",
      }));
      return;
    }

    if (facultyShare + instituteShare > contractAmount) {
      setFieldErrors((prev) => ({
        ...prev,
        faculty_share: "Faculty + Institute share cannot exceed contract amount.",
      }));
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(fetchConsultanciesRoute, {
        ...form,
        contract_amount: contractAmount,
        faculty_share: facultyShare,
        institute_share: instituteShare,
        status: "SUBMITTED",
      });
      notifications.show({
        title: "Created",
        message: "Consultancy project created",
        color: "green",
      });
      await loadConsultancies();
      setActiveTab("0");
      setForm({
        title: "",
        client_name: "",
        client_type: "INDUSTRY",
        client_email: "",
        contract_amount: "",
        faculty_share: "",
        institute_share: "",
        start_date: "",
        end_date: "",
        description: "",
      });
    } catch (e) {
      const data = e?.response?.data;
      if (data && typeof data === "object") {
        const mappedErrors = {};
        Object.entries(data).forEach(([k, v]) => {
          if (k === "error" || k === "code" || k === "details") return;
          mappedErrors[k] = Array.isArray(v) ? v.join(" ") : String(v);
        });
        if (Object.keys(mappedErrors).length > 0) {
          setFieldErrors(mappedErrors);
        }
      }
      const detailMessage =
        data?.details && typeof data.details === "object"
          ? Object.entries(data.details)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(" ") : String(value)}`)
              .join("; ")
          : "";
      notifications.show({
        title: "Error",
        message:
          detailMessage ||
          e?.response?.data?.error ||
          e?.response?.data?.detail ||
          "Failed to create consultancy",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const tabItems = [
    {
      title: "All Consultancies",
      component: loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : loadError ? (
        <Alert icon={<Warning size={18} />} color="red" title="Load Error" mt="md">
          {loadError}
        </Alert>
      ) : (
        <ConsultancyTable
          consultancies={consultancies}
          onRefresh={loadConsultancies}
          onView={(row) => {
            setViewData(row);
            setViewOpen(true);
          }}
        />
      ),
    },
  ];

  // Only Faculty and RSPC Admin can create consultancies
  if (can("create_consultancy")) {
    tabItems.push({
      title: "New Consultancy",
      component: (
        <Paper className={formClasses.formContainer}>
          <Title order={4} className={formClasses.formTitle}>
            New Consultancy Project
          </Title>
          <Grid gutter="md">
            <Grid.Col span={{ base: 12 }}>
              <TextInput
                label="Project Title"
                required
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Client Name"
                required
                value={form.client_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, client_name: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Client Type"
                data={CLIENT_TYPES}
                value={form.client_type}
                onChange={(v) => setForm((f) => ({ ...f, client_type: v }))}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Client Email"
                type="email"
                value={form.client_email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, client_email: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Contract Amount (₹)"
                type="number"
                value={form.contract_amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contract_amount: e.target.value }))
                }
                error={fieldErrors.contract_amount}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Faculty Share (₹)"
                type="number"
                value={form.faculty_share}
                onChange={(e) =>
                  setForm((f) => ({ ...f, faculty_share: e.target.value }))
                }
                error={fieldErrors.faculty_share}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Institute Share (₹)"
                type="number"
                value={form.institute_share}
                onChange={(e) =>
                  setForm((f) => ({ ...f, institute_share: e.target.value }))
                }
                error={fieldErrors.institute_share}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Start Date"
                type="date"
                required
                value={form.start_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_date: e.target.value }))
                }
                error={fieldErrors.start_date}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="End Date"
                type="date"
                value={form.end_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, end_date: e.target.value }))
                }
                error={fieldErrors.end_date}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12 }}>
              <Textarea
                label="Description"
                minRows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </Grid.Col>
          </Grid>
          <div className={formClasses.submitButtonContainer}>
            <Button
              color="#15ABFF"
              style={{ borderRadius: 8 }}
              onClick={handleSubmit}
              leftSection={<CheckCircle size={18} />}
              loading={submitting}
            >
              Create Consultancy
            </Button>
          </div>
        </Paper>
      ),
    });
  }

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
      <RSPCBreadcrumbs projectTitle="Consultancy" />
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
      <DetailViewModal
        opened={viewOpen}
        onClose={() => setViewOpen(false)}
        data={viewData}
        titleField="title"
        fields={[
          { label: "Client", key: "client_name" },
          { label: "Client Type", key: "client_type" },
          { label: "Status", key: "status" },
          {
            label: "Contract Amount",
            key: "contract_amount",
            format: (v) => (v ? `₹${Number(v).toLocaleString("en-IN")}` : null),
          },
          {
            label: "Start Date",
            key: "start_date",
            format: (v) => (v ? new Date(v).toLocaleDateString() : null),
          },
          {
            label: "End Date",
            key: "end_date",
            format: (v) => (v ? new Date(v).toLocaleDateString() : null),
          },
          { label: "Description", key: "description" },
        ]}
      />
    </>
  );
}
export default Consultancy;

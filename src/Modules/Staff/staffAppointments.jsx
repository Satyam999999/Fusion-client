import { useEffect, useRef, useState } from "react";
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
  Loader,
  Center,
} from "@mantine/core";
import {
  CaretCircleLeft,
  CaretCircleRight,
  CheckCircle,
} from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import classes from "../RSPC/styles/researchProjectsStyle.module.css";
import formClasses from "../RSPC/styles/formStyle.module.css";
import DetailViewModal from "../RSPC/components/modals/detailViewModal";
import StaffAppointmentsTable from "./components/tables/staffAppointmentsTable";
import {
  fetchStaffApplicationsRoute,
  fetchStaffAppointmentsRoute,
} from "../../routes/RSPCRoutes/index";

function StaffAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("0");
  const [viewData, setViewData] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [form, setForm] = useState({
    appointment_id: "",
    application: null,
    appointment_number: "",
    employee_code: "",
    designation: "",
    joining_date: "",
    contract_end_date: "",
    probation_months: 12,
    pay_level: "",
    notes: "",
  });
  const tabsListRef = useRef(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [apptRes, appRes] = await Promise.all([
        axios.get(fetchStaffAppointmentsRoute),
        axios.get(fetchStaffApplicationsRoute),
      ]);
      setAppointments(apptRes.data.results || apptRes.data);
      setApplications(appRes.data.results || appRes.data);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load staff appointments",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSubmit = async () => {
    if (
      !form.application ||
      !form.appointment_number ||
      !form.employee_code ||
      !form.designation ||
      !form.joining_date
    ) {
      notifications.show({
        title: "Validation",
        message:
          "Application, appointment number, employee code, designation, and joining date are required",
        color: "red",
      });
      return;
    }

    try {
      await axios.post(fetchStaffAppointmentsRoute, {
        ...form,
        appointment_id: form.appointment_id ? Number(form.appointment_id) : undefined,
        application: Number(form.application),
      });
      notifications.show({
        title: "Created",
        message: `Appointment created${form.appointment_id ? ` (ID: ${form.appointment_id})` : ""}`,
        color: "green",
      });
      setForm({
        appointment_id: "",
        application: null,
        appointment_number: "",
        employee_code: "",
        designation: "",
        joining_date: "",
        contract_end_date: "",
        probation_months: 12,
        pay_level: "",
        notes: "",
      });
      setActiveTab("0");
      loadAll();
    } catch (err) {
      const msg = err.response?.data
        ? JSON.stringify(err.response.data)
        : "Failed to create appointment";
      notifications.show({ title: "Error", message: msg, color: "red" });
    }
  };

  const existingApplicationIds = new Set(
    (appointments || []).map((item) => String(item.application)),
  );
  const availableApplications = (applications || []).filter((app) => {
    const isApprovedByAdmin = String(app.status || "").toUpperCase() === "SELECTED";
    return isApprovedByAdmin && !existingApplicationIds.has(String(app.id));
  });
  const applicationOptions = availableApplications.map((app) => ({
    value: String(app.id),
    label: `${app.application_number} - ${app.applicant_name}`,
  }));

  const tabItems = [
    {
      title: "Appointments",
      component: loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : (
        <StaffAppointmentsTable
          appointments={appointments}
          onRefresh={loadAll}
          onView={(row) => {
            setViewData(row);
            setViewOpen(true);
          }}
        />
      ),
    },
    {
      title: "Create Appointment",
      component: (
        <Paper className={formClasses.formContainer}>
          <Text fw={700} size="lg" className={formClasses.formTitle}>
            Create Staff Appointment
          </Text>
          <Grid gutter="md">
            <Grid.Col span={6}>
              <TextInput
                label="Staff Appointment ID"
                type="number"
                value={form.appointment_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, appointment_id: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Select
                label="Selected Application"
                required
                data={applicationOptions}
                value={form.application}
                onChange={(v) => setForm((f) => ({ ...f, application: v }))}
                searchable
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Appointment Number"
                required
                value={form.appointment_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, appointment_number: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Employee Code"
                required
                value={form.employee_code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, employee_code: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Designation"
                required
                value={form.designation}
                onChange={(e) =>
                  setForm((f) => ({ ...f, designation: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Joining Date"
                type="date"
                required
                value={form.joining_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, joining_date: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Contract End Date"
                type="date"
                value={form.contract_end_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contract_end_date: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Probation (Months)"
                type="number"
                value={form.probation_months}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    probation_months: Number(e.target.value || 0),
                  }))
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Pay Level"
                value={form.pay_level}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pay_level: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label="Notes"
                minRows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
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
            >
              Create Appointment
            </Button>
          </div>
        </Paper>
      ),
    },
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
      <Text fw={700} size="xl" mt="sm" ml={{ md: "lg" }}>
        Staff Appointments
      </Text>
      <Flex justify="flex-start" align="center" mt="lg">
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
            <Tabs.List style={{ flexWrap: "nowrap" }}>
              {tabItems.map((item, i) => (
                <Tabs.Tab
                  key={i}
                  value={String(i)}
                  className={
                    activeTab === String(i) ? classes.fusionActiveRecentTab : ""
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
      <div style={{ marginTop: 16 }}>{tabItems[+activeTab]?.component}</div>

      <DetailViewModal
        opened={viewOpen}
        onClose={() => setViewOpen(false)}
        data={viewData}
        titleField="appointment_number"
        title="Appointment Details"
        fields={[
          { label: "Staff Appointment ID", key: "id" },
          { label: "Employee Code", key: "employee_code" },
          { label: "Applicant", key: "applicant_name" },
          { label: "Post", key: "post_title" },
          { label: "Designation", key: "designation" },
          {
            label: "Joining Date",
            key: "joining_date",
            format: (v) => (v ? new Date(v).toLocaleDateString() : "-"),
          },
          {
            label: "Contract End Date",
            key: "contract_end_date",
            format: (v) => (v ? new Date(v).toLocaleDateString() : "-"),
          },
          {
            label: "Probation",
            key: "probation_months",
            format: (v) => `${v || 0} months`,
          },
          { label: "Pay Level", key: "pay_level" },
          { label: "Notes", key: "notes" },
        ]}
      />
    </>
  );
}

export default StaffAppointments;

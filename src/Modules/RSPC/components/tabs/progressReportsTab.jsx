import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Grid,
  Select,
  TextInput,
  Textarea,
  Button,
  Text,
  Paper,
  Table,
  Badge,
  ActionIcon,
  Group,
  Loader,
  Center,
} from "@mantine/core";
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import { fetchReportsRoute } from "../../../../routes/RSPCRoutes";
import { useRSPCRole } from "../../hooks/useRSPCRole";
import formClasses from "../../styles/formStyle.module.css";

export default function ProgressReportsTab({ visibleProjects, onProjectsRefresh }) {
  const { role, can } = useRSPCRole();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const projectLabelById = visibleProjects.reduce((acc, project) => {
    acc[String(project.id)] = `${project.project_number} - ${project.title}`;
    return acc;
  }, {});

  const [form, setForm] = useState({
    project: "",
    report_type: "QUARTERLY",
    period_from: "",
    period_to: "",
    summary: "",
    achievements: "",
    challenges: "",
    next_steps: "",
  });

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(fetchReportsRoute);
      setReports(data.results || data || []);
    } catch (err) {
      notifications.show({
        title: "Error",
        message: "Failed to load progress reports.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleSubmit = async () => {
    if (
      !form.project ||
      !form.report_type ||
      !form.period_from ||
      !form.period_to ||
      !form.summary ||
      !form.achievements ||
      !form.challenges ||
      !form.next_steps
    ) {
      notifications.show({
        title: "Validation",
        message: "Project, report type, period dates, summary, achievements, challenges, and next steps are required.",
        color: "red",
      });
      return;
    }
    try {
      await axios.post(fetchReportsRoute, {
        project: Number(form.project),
        report_type: form.report_type,
        period_from: form.period_from,
        period_to: form.period_to,
        summary: form.summary,
        achievements: form.achievements,
        challenges: form.challenges,
        next_steps: form.next_steps,
        submitted_date: new Date().toISOString().slice(0, 10),
        status: "SUBMITTED",
      });
      notifications.show({ title: "Success", message: "Progress report submitted", color: "green" });
      setForm({
        project: "",
        report_type: "QUARTERLY",
        period_from: "",
        period_to: "",
        summary: "",
        achievements: "",
        challenges: "",
        next_steps: "",
      });
      loadReports();
    } catch (err) {
      const data = err?.response?.data;
      const detailMessage =
        data && typeof data === "object"
          ? Object.entries(data)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(" ") : String(value)}`)
              .join("; ")
          : "";
      notifications.show({
        title: "Error",
        message: detailMessage || data?.error || data?.detail || "Failed to submit report",
        color: "red",
      });
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.patch(`${fetchReportsRoute}${id}/`, { status: "APPROVED" });
      notifications.show({ title: "Success", message: "Report approved", color: "green" });
      loadReports();
    } catch {
      notifications.show({ title: "Error", message: "Verification failed", color: "red" });
    }
  };

  const projectOptions = visibleProjects.map((p) => ({ value: String(p.id), label: `${p.project_number} - ${p.title}` }));

  return (
    <div>
      {role === "FACULTY" && (
        <Paper className={formClasses.formContainer} mb="xl">
          <Text fw={700} size="lg" className={formClasses.formTitle}>Submit Progress Report</Text>
          <Grid gutter="md">
            <Grid.Col span={12}>
              <Select
                label="Select Project"
                data={projectOptions}
                value={form.project}
                onChange={(v) => setForm({ ...form, project: v })}
                required
                searchable
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                label="Report Type"
                data={[
                  { value: "QUARTERLY", label: "Quarterly" },
                  { value: "HALF_YEARLY", label: "Half Yearly" },
                  { value: "ANNUAL", label: "Annual" },
                  { value: "FINAL", label: "Final" },
                  { value: "UTILIZATION", label: "Utilization Certificate" }
                ]}
                value={form.report_type}
                onChange={(v) => setForm({ ...form, report_type: v })}
                required
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput label="Period From" type="date" value={form.period_from} onChange={(e) => setForm({ ...form, period_from: e.target.value })} required />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput label="Period To" type="date" value={form.period_to} onChange={(e) => setForm({ ...form, period_to: e.target.value })} required />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea minRows={3} label="Summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea minRows={3} label="Achievements" value={form.achievements} onChange={(e) => setForm({ ...form, achievements: e.target.value })} />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea minRows={3} label="Challenges" value={form.challenges} onChange={(e) => setForm({ ...form, challenges: e.target.value })} />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea minRows={3} label="Next Steps" value={form.next_steps} onChange={(e) => setForm({ ...form, next_steps: e.target.value })} />
            </Grid.Col>
          </Grid>
          <div className={formClasses.submitButtonContainer}>
            <Button color="#15ABFF" onClick={handleSubmit} leftSection={<CheckCircle size={18} />}>Submit Report</Button>
          </div>
        </Paper>
      )}

      <Text fw={600} mb="sm">Submitted Progress Reports</Text>
      <Paper withBorder style={{ overflowX: "auto" }}>
        {loading ? (
          <Center py="xl"><Loader size="md" /></Center>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Report ID</Table.Th>
                <Table.Th>Project</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Period</Table.Th>
                <Table.Th>Status</Table.Th>
                {role === "RSPC_ADMIN" && <Table.Th>Actions</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {reports.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{row.id}</Table.Td>
                  <Table.Td>{projectLabelById[String(row.project)] || row.project}</Table.Td>
                  <Table.Td>{row.report_type}</Table.Td>
                  <Table.Td>{row.period_from} to {row.period_to}</Table.Td>
                  <Table.Td>
                    <Badge color={row.status === "APPROVED" ? "green" : "orange"} variant="light">
                      {row.status || "PENDING"}
                    </Badge>
                  </Table.Td>
                  {role === "RSPC_ADMIN" && (
                    <Table.Td>
                      {row.status !== "APPROVED" && (
                        <Group gap="xs">
                          <ActionIcon color="green" onClick={() => handleApprove(row.id)}>
                            <CheckCircle size={20} />
                          </ActionIcon>
                        </Group>
                      )}
                    </Table.Td>
                  )}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </div>
  );
}

ProgressReportsTab.propTypes = {
  visibleProjects: PropTypes.array.isRequired,
  onProjectsRefresh: PropTypes.func.isRequired,
};

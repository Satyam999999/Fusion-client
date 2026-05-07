import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Grid,
  Select,
  TextInput,
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
import { CheckCircle } from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import { fetchClosureRequestsRoute } from "../../../../routes/RSPCRoutes";
import { useRSPCRole } from "../../hooks/useRSPCRole";
import formClasses from "../../styles/formStyle.module.css";

// The backend approve closure request URL template generator:
const approveClosureRequestRoute = (id) => `${fetchClosureRequestsRoute}${id}/approve/`;

export default function ProjectClosuresTab({ visibleProjects, onProjectsRefresh }) {
  const { role } = useRSPCRole();
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    project: "",
    closure_reason: "",
    closure_date: "",
  });

  const loadClosures = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(fetchClosureRequestsRoute);
      setClosures(data.results || data || []);
    } catch (err) {
      notifications.show({
        title: "Error",
        message: "Failed to load project closures.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClosures();
  }, []);

  const handleSubmit = async () => {
    if (!form.project || !form.closure_reason || !form.closure_date) {
      notifications.show({ title: "Validation", message: "Please fill all fields", color: "red" });
      return;
    }
    const selectedProject = visibleProjects.find(p => String(p.id) === form.project);
    try {
      await axios.post(fetchClosureRequestsRoute, { 
        project: Number(form.project),
        project_number: selectedProject?.project_number,
        closure_reason: form.closure_reason,
        closure_date: form.closure_date
      });
      notifications.show({ title: "Success", message: "Project Closure Request submitted", color: "green" });
      setForm({ project: "", closure_reason: "", closure_date: "" });
      loadClosures();
    } catch (err) {
      notifications.show({ title: "Error", message: err.response?.data?.error || "Failed to submit closure request", color: "red" });
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(approveClosureRequestRoute(id));
      notifications.show({ title: "Success", message: "Closure request approved and project finalized", color: "green" });
      loadClosures();
      onProjectsRefresh(); // Refresh main projects table since the project was marked closed
    } catch {
      notifications.show({ title: "Error", message: "Approval failed", color: "red" });
    }
  };

  const projectOptions = visibleProjects.map((p) => ({ value: String(p.id), label: `${p.project_number} - ${p.title}` }));

  return (
    <div>
      {role === "FACULTY" && (
        <Paper className={formClasses.formContainer} mb="xl">
          <Text fw={700} size="lg" className={formClasses.formTitle}>Request Project Closure</Text>
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
            <Grid.Col span={6}>
              <TextInput label="Closure Reason" value={form.closure_reason} onChange={(e) => setForm({ ...form, closure_reason: e.target.value })} required />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="Closure Date" type="date" value={form.closure_date} onChange={(e) => setForm({ ...form, closure_date: e.target.value })} required />
            </Grid.Col>
          </Grid>
          <div className={formClasses.submitButtonContainer}>
            <Button color="#15ABFF" onClick={handleSubmit} leftSection={<CheckCircle size={18} />}>Submit Request</Button>
          </div>
        </Paper>
      )}

      <Text fw={600} mb="sm">Project Closure Requests</Text>
      <Paper withBorder style={{ overflowX: "auto" }}>
        {loading ? (
          <Center py="xl"><Loader size="md" /></Center>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Project Ext Number</Table.Th>
                <Table.Th>Closure Date</Table.Th>
                <Table.Th>Reason</Table.Th>
                <Table.Th>Status</Table.Th>
                {role === "RSPC_ADMIN" && <Table.Th>Actions</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {closures.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{row.id}</Table.Td>
                  <Table.Td>{row.project_number || row.project}</Table.Td>
                  <Table.Td>{row.closure_date}</Table.Td>
                  <Table.Td>{row.closure_reason}</Table.Td>
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

ProjectClosuresTab.propTypes = {
  visibleProjects: PropTypes.array.isRequired,
  onProjectsRefresh: PropTypes.func.isRequired,
};

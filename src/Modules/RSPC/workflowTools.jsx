import { useState } from "react";
import { Button, Grid, Paper, ScrollArea, Table, Tabs, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import {
  downloadProjectPdfRoute,
  projectDetailsRoute,
  modifyProjectDurationRoute,
  projectInboxRoute,
  projectInventoryRoute,
  projectStaffRoute,
  documentHistoryRoute,
  modifyStaffTenureRoute,
} from "../../routes/RSPCRoutes";

function WorkflowTools() {
  const [projectId, setProjectId] = useState("");
  const [staffAppointmentId, setStaffAppointmentId] = useState("");
  const [durationYears, setDurationYears] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");
  const [documentId, setDocumentId] = useState("");

  const [inboxRows, setInboxRows] = useState([]);
  const [fundRows, setFundRows] = useState([]);
  const [staffRows, setStaffRows] = useState([]);
  const [historyRows, setHistoryRows] = useState([]);
  const [projectDetails, setProjectDetails] = useState(null);

  const loadInbox = async () => {
    try {
      const response = await axios.get(projectInboxRoute);
      setInboxRows(response.data.results || response.data);
    } catch {
      notifications.show({ title: "Error", message: "Failed to load project inbox", color: "red" });
    }
  };

  const loadInventory = async () => {
    try {
      const response = await axios.get(projectInventoryRoute, { params: { project_id: projectId || undefined } });
      setFundRows(response.data.results || response.data);
    } catch {
      notifications.show({ title: "Error", message: "Failed to load project inventory", color: "red" });
    }
  };

  const loadStaffRequests = async () => {
    try {
      const response = await axios.get(projectStaffRoute, { params: { project_id: projectId || undefined } });
      setStaffRows(response.data.results || response.data);
    } catch {
      notifications.show({ title: "Error", message: "Failed to load project staff requests", color: "red" });
    }
  };

  const loadProjectDetails = async () => {
    if (!projectId) {
      notifications.show({ title: "Validation", message: "Project ID is required", color: "red" });
      return;
    }
    try {
      const response = await axios.get(projectDetailsRoute(projectId));
      setProjectDetails(response.data);
    } catch {
      notifications.show({ title: "Error", message: "Failed to load project details", color: "red" });
    }
  };

  const downloadPdf = async () => {
    if (!projectId) {
      notifications.show({ title: "Validation", message: "Project ID is required", color: "red" });
      return;
    }
    try {
      const response = await axios.get(downloadProjectPdfRoute(projectId), { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `project_${projectId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      notifications.show({ title: "Error", message: "Failed to generate PDF", color: "red" });
    }
  };

  const modifyDuration = async () => {
    if (!projectId || !durationYears) {
      notifications.show({ title: "Validation", message: "Project ID and years are required", color: "red" });
      return;
    }
    try {
      await axios.post(modifyProjectDurationRoute(projectId), { years: Number(durationYears) });
      notifications.show({ title: "Updated", message: "Project duration updated", color: "green" });
    } catch {
      notifications.show({ title: "Error", message: "Failed to update duration", color: "red" });
    }
  };

  const modifyTenure = async () => {
    if (!staffAppointmentId || !contractEndDate) {
      notifications.show({ title: "Validation", message: "Appointment ID and end date are required", color: "red" });
      return;
    }
    try {
      await axios.post(modifyStaffTenureRoute(staffAppointmentId), { contract_end_date: contractEndDate });
      notifications.show({ title: "Updated", message: "Staff tenure updated", color: "green" });
    } catch {
      notifications.show({ title: "Error", message: "Failed to update staff tenure", color: "red" });
    }
  };

  const loadHistory = async () => {
    if (!documentId) {
      notifications.show({ title: "Validation", message: "Document ID is required", color: "red" });
      return;
    }
    try {
      const response = await axios.get(documentHistoryRoute(documentId));
      setHistoryRows(response.data.results || response.data);
    } catch {
      notifications.show({ title: "Error", message: "Failed to load document history", color: "red" });
    }
  };

  return (
    <>
      <Text fw={700} size="xl" mt="sm">Workflow Tools (UC-012 to UC-019)</Text>
      <Grid mt="md" gutter="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" withBorder>
            <Text fw={600} mb="sm">Project Actions</Text>
            <TextInput label="Project ID" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
            <Button mt="sm" fullWidth onClick={loadProjectDetails}>View Project Details</Button>
            <Button mt="sm" fullWidth color="teal" onClick={downloadPdf}>Download Project PDF</Button>
            <TextInput mt="sm" label="Duration (Years)" value={durationYears} onChange={(e) => setDurationYears(e.target.value)} />
            <Button mt="sm" fullWidth color="indigo" onClick={modifyDuration}>Modify Project Duration</Button>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" withBorder>
            <Text fw={600} mb="sm">Staff Tenure</Text>
            <TextInput label="Staff Appointment ID" value={staffAppointmentId} onChange={(e) => setStaffAppointmentId(e.target.value)} />
            <TextInput mt="sm" type="date" label="Contract End Date" value={contractEndDate} onChange={(e) => setContractEndDate(e.target.value)} />
            <Button mt="sm" fullWidth color="orange" onClick={modifyTenure}>Modify Staff Tenure</Button>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" withBorder>
            <Text fw={600} mb="sm">Document Tracking History</Text>
            <TextInput label="Document ID" value={documentId} onChange={(e) => setDocumentId(e.target.value)} />
            <Button mt="sm" fullWidth color="grape" onClick={loadHistory}>View History</Button>
          </Paper>
        </Grid.Col>
      </Grid>

      <Tabs mt="md" defaultValue="inbox">
        <Tabs.List>
          <Tabs.Tab value="inbox">Project Inbox</Tabs.Tab>
          <Tabs.Tab value="inventory">Project Inventory</Tabs.Tab>
          <Tabs.Tab value="staff">Project Staff Requests</Tabs.Tab>
          <Tabs.Tab value="history">File Tracking</Tabs.Tab>
          <Tabs.Tab value="details">Project Details</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="inbox" pt="md">
          <Button mb="sm" onClick={loadInbox}>Refresh Inbox</Button>
          <DataTable rows={inboxRows} columns={["id", "title", "module_name", "status", "request_type", "assigned_role"]} />
        </Tabs.Panel>

        <Tabs.Panel value="inventory" pt="md">
          <Button mb="sm" onClick={loadInventory}>Load Funds Requests</Button>
          <DataTable rows={fundRows} columns={["id", "reference_id", "title", "status", "request_type"]} />
        </Tabs.Panel>

        <Tabs.Panel value="staff" pt="md">
          <Button mb="sm" onClick={loadStaffRequests}>Load Staff Requests</Button>
          <DataTable rows={staffRows} columns={["id", "reference_id", "title", "status", "request_type"]} />
        </Tabs.Panel>

        <Tabs.Panel value="history" pt="md">
          <DataTable rows={historyRows} columns={["id", "method", "path", "status_code", "created_at"]} />
        </Tabs.Panel>

        <Tabs.Panel value="details" pt="md">
          {projectDetails ? (
            <Paper p="md" withBorder>
              <Text fw={700}>{projectDetails.title}</Text>
              <Text size="sm" c="dimmed">Project Number: {projectDetails.project_number}</Text>
              <Text size="sm" c="dimmed">Status: {projectDetails.status}</Text>
              <Text mt="sm">{projectDetails.description}</Text>
              <Text mt="sm" fw={600}>Co-PI Details</Text>
              {(projectDetails.co_pi_details || []).map((copi) => (
                <Text key={copi.id} size="sm">{copi.name} ({copi.designation || "-"})</Text>
              ))}
            </Paper>
          ) : (
            <Text c="dimmed">Load project details using the Project ID form above.</Text>
          )}
        </Tabs.Panel>
      </Tabs>
    </>
  );
}

function DataTable({ rows, columns }) {
  return (
    <ScrollArea h={260}>
      <Table>
        <Table.Thead>
          <Table.Tr>
            {columns.map((col) => <Table.Th key={col}>{col}</Table.Th>)}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length}><Text c="dimmed">No records</Text></Table.Td>
            </Table.Tr>
          ) : rows.map((row) => (
            <Table.Tr key={row.id || JSON.stringify(row)}>
              {columns.map((col) => <Table.Td key={col}>{String(row[col] ?? "-")}</Table.Td>)}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}

export default WorkflowTools;

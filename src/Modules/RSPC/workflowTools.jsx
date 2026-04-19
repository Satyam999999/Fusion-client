import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Badge,
  Button,
  Grid,
  Paper,
  ScrollArea,
  Table,
  Tabs,
  Text,
  TextInput,
  Select,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import {
  downloadProjectPdfRoute,
  projectDetailsRoute,
  saveProjectDraftRoute,
  resubmitProjectRoute,
  vetProjectByHodRoute,
  verifyProjectByAdminRoute,
  deanDecisionProjectRoute,
  directorDecisionProjectRoute,
  modifyProjectDurationRoute,
  projectInboxRoute,
  projectInventoryRoute,
  projectStaffRoute,
  modifyStaffTenureRoute,
  processStaffAppointmentAdminRoute,
  deanDecisionStaffAppointmentRoute,
  BASE,
} from "../../routes/RSPCRoutes";
import { useRSPCRole, ROLE_LABELS, ROLE_COLORS } from "./hooks/useRSPCRole";

function WorkflowTools() {
  const { role, can } = useRSPCRole();

  const [projectId, setProjectId] = useState("");
  const [staffAppointmentId, setStaffAppointmentId] = useState("");
  const [durationYears, setDurationYears] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");
  const [staffDeanDecision, setStaffDeanDecision] = useState("APPROVE");
  const [deanDecision, setDeanDecision] = useState("APPROVE");
  const [directorDecision, setDirectorDecision] = useState("APPROVE");
  const [inboxRows, setInboxRows] = useState([]);
  const [fundRows, setFundRows] = useState([]);
  const [staffRows, setStaffRows] = useState([]);
  const [stipendRows, setStipendRows] = useState([]);
  const [projectDetails, setProjectDetails] = useState(null);

  const [documentId, setDocumentId] = useState("");
  const [historyRows, setHistoryRows] = useState([]);
  const [dashboardUrl, setDashboardUrl] = useState("");
  const [fundId, setFundId] = useState("");
  const [approvalDecision, setApprovalDecision] = useState("APPROVE");

  // BR-RSPC-021: 30-min session inactivity timeout
  useEffect(() => {
    let timeout;
    const reset = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        localStorage.removeItem("rspcAuthToken");
        notifications.show({
          title: "Session Expired",
          message: "Logged out after 30 min inactivity",
          color: "red",
        });
        window.location.reload();
      }, 1800000);
    };
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => {
      clearTimeout(timeout);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);

  const api = (url, opts = {}) =>
    axios({ url, ...opts }).catch(() =>
      notifications.show({
        title: "Error",
        message: `Request failed: ${url}`,
        color: "red",
      }),
    );

  const loadInbox = () =>
    api(projectInboxRoute).then(
      (r) => r && setInboxRows(r.data.results || r.data || []),
    );
  const loadInventory = () =>
    api(projectInventoryRoute, {
      params: { project_id: projectId || undefined },
    }).then((r) => r && setFundRows(r.data.results || r.data || []));
  const loadStaff = () =>
    api(projectStaffRoute, {
      params: { project_id: projectId || undefined },
    }).then((r) => r && setStaffRows(r.data.results || r.data || []));
  const loadStipends = () =>
    api(`${BASE}/api/rspc/expenditures/stipend_disbursements/`).then(
      (r) => r && setStipendRows(r.data || []),
    );

  const loadHistory = () => {
    if (!documentId)
      return notifications.show({
        title: "Validation",
        message: "Enter Document ID",
        color: "red",
      });
    api(`${BASE}/api/rspc/audit_logs/`, {
      params: { document_id: documentId },
    }).then((r) => r && setHistoryRows(r.data.results || r.data || []));
  };
  const loadDashboard = () => setDashboardUrl(`${BASE}/api/rspc/dashboard/`);

  const loadDetails = () => {
    if (!projectId)
      return notifications.show({
        title: "Validation",
        message: "Enter a Project ID",
        color: "red",
      });
    api(projectDetailsRoute(projectId)).then(
      (r) => r && setProjectDetails(r.data),
    );
  };

  const runAction = (action, payload = {}) => {
    const routes = {
      saveDraft: saveProjectDraftRoute(projectId),
      resubmit: resubmitProjectRoute(projectId),
      vetHod: vetProjectByHodRoute(projectId),
      verifyAdmin: verifyProjectByAdminRoute(projectId),
      deanDecision: deanDecisionProjectRoute(projectId),
      directorDecision: directorDecisionProjectRoute(projectId),
      modifyDuration: modifyProjectDurationRoute(projectId),
      downloadPdf: downloadProjectPdfRoute(projectId),
      modifyTenure: modifyStaffTenureRoute(staffAppointmentId),
      processStaff: processStaffAppointmentAdminRoute(staffAppointmentId),
      deanStaff: deanDecisionStaffAppointmentRoute(staffAppointmentId),
    };
    if (!routes[action]) return;
    api(routes[action], { method: "post", data: payload }).then(
      (r) =>
        r &&
        notifications.show({
          title: "Success",
          message: `'${action}' completed`,
          color: "green",
        }),
    );
  };

  return (
    <>
      {/* Role badge */}
      <Paper
        p="sm"
        mb="md"
        withBorder
        style={{ display: "flex", alignItems: "center", gap: 12 }}
      >
        <Text fw={600}>Logged in as:</Text>
        <Badge color={ROLE_COLORS[role]} size="lg">
          {ROLE_LABELS[role]}
        </Badge>
        <Text size="sm" c="dimmed" ml="auto">
          Only your authorised actions are visible below.
        </Text>
      </Paper>

      <Grid gutter="md">
        {/* Project Actions — viewDetails / downloadPdf / saveDraft / resubmit */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" withBorder>
            <Text fw={600} mb="sm">
              Project Actions
            </Text>
            <TextInput
              label="Project ID"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
            {can("view_details") && (
              <Button mt="sm" fullWidth color="blue" onClick={loadDetails}>
                Load Project Details
              </Button>
            )}
            {can("download_pdf") && (
              <Button
                mt="sm"
                fullWidth
                color="gray"
                onClick={() => runAction("downloadPdf")}
              >
                Download PDF
              </Button>
            )}
            {can("save_draft") && (
              <Button
                mt="sm"
                fullWidth
                color="gray"
                onClick={() => runAction("saveDraft")}
              >
                Save Draft
              </Button>
            )}
            {can("resubmit") && (
              <Button
                mt="sm"
                fullWidth
                color="blue"
                onClick={() => runAction("resubmit")}
              >
                Resubmit
              </Button>
            )}
          </Paper>
        </Grid.Col>

        {/* Approval Lifecycle */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" withBorder>
            <Text fw={600} mb="sm">
              Approval Lifecycle
            </Text>
            {can("vet_project") && (
              <Button
                mt="sm"
                fullWidth
                color="cyan"
                onClick={() => runAction("vetHod")}
              >
                Vet by HoD
              </Button>
            )}
            {can("verify_admin") && (
              <Button
                mt="sm"
                fullWidth
                color="violet"
                onClick={() => runAction("verifyAdmin")}
              >
                Verify by Admin
              </Button>
            )}
            {can("modify_duration") && (
              <>
                <TextInput
                  mt="sm"
                  label="Extension (years)"
                  type="number"
                  value={durationYears}
                  onChange={(e) => setDurationYears(e.target.value)}
                />
                <Button
                  mt="sm"
                  fullWidth
                  color="orange"
                  onClick={() =>
                    runAction("modifyDuration", { years: durationYears })
                  }
                >
                  Modify Duration
                </Button>
              </>
            )}
            {can("dean_decision") && (
              <>
                <Select
                  mt="sm"
                  label="Dean Decision"
                  data={[
                    { value: "APPROVE", label: "Approve" },
                    { value: "REJECT", label: "Reject" },
                    { value: "FORWARD_DIRECTOR", label: "Forward to Director" },
                  ]}
                  value={deanDecision}
                  onChange={setDeanDecision}
                />
                <Button
                  mt="sm"
                  fullWidth
                  color="grape"
                  onClick={() =>
                    runAction("deanDecision", { decision: deanDecision })
                  }
                >
                  Submit Dean Decision
                </Button>
              </>
            )}
            {can("director_decision") && (
              <>
                <Select
                  mt="sm"
                  label="Director Decision"
                  data={[
                    { value: "APPROVE", label: "Approve" },
                    { value: "REJECT", label: "Reject" },
                  ]}
                  value={directorDecision}
                  onChange={setDirectorDecision}
                />
                <Button
                  mt="sm"
                  fullWidth
                  color="pink"
                  onClick={() =>
                    runAction("directorDecision", {
                      decision: directorDecision,
                    })
                  }
                >
                  Submit Director Decision
                </Button>
              </>
            )}
            {!can("vet_project") &&
              !can("verify_admin") &&
              !can("dean_decision") &&
              !can("director_decision") && (
                <Alert color="yellow" mt="sm">
                  No approval actions available for your role.
                </Alert>
              )}
          </Paper>
        </Grid.Col>

        {/* Staff Tenure — RSPC Admin and Dean only (NOT HOD) */}
        {(can("modify_tenure") ||
          can("process_staff_admin") ||
          can("dean_staff")) && (
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper p="md" withBorder>
              <Text fw={600} mb="sm">
                Staff Tenure
              </Text>
              <TextInput
                label="Staff Appointment ID"
                value={staffAppointmentId}
                onChange={(e) => setStaffAppointmentId(e.target.value)}
              />
              {can("modify_tenure") && (
                <>
                  <TextInput
                    mt="sm"
                    type="date"
                    label="Contract End Date"
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                  />
                  <Button
                    mt="sm"
                    fullWidth
                    color="orange"
                    onClick={() =>
                      runAction("modifyTenure", {
                        contract_end_date: contractEndDate,
                      })
                    }
                  >
                    Modify Staff Tenure
                  </Button>
                </>
              )}
              {can("process_staff_admin") && (
                <Button
                  mt="sm"
                  fullWidth
                  color="blue"
                  onClick={() => runAction("processStaff")}
                >
                  Process Request (Admin)
                </Button>
              )}
              {can("dean_staff") && (
                <>
                  <Select
                    mt="sm"
                    label="Dean Staff Decision"
                    data={[
                      { value: "APPROVE", label: "Approve" },
                      { value: "REJECT", label: "Reject" },
                    ]}
                    value={staffDeanDecision}
                    onChange={setStaffDeanDecision}
                  />
                  <Button
                    mt="sm"
                    fullWidth
                    color="grape"
                    onClick={() =>
                      runAction("deanStaff", { decision: staffDeanDecision })
                    }
                  >
                    Dean Staff Decision
                  </Button>
                </>
              )}
            </Paper>
          </Grid.Col>
        )}

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" withBorder>
            <Text fw={600} mb="sm">
              Compliance Reports
            </Text>
            <TextInput
              label="Document ID"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
            />
            <Button mt="sm" fullWidth color="grape" onClick={loadHistory}>
              View Document History
            </Button>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" withBorder>
            <Text fw={600} mb="sm">
              Institute Stats
            </Text>
            <Button mt="sm" fullWidth color="teal" onClick={loadDashboard}>
              Load Institute Dashboard
            </Button>
            {dashboardUrl && (
              <Text mt="sm" size="xs" c="dimmed">
                Dashboard loaded.
              </Text>
            )}
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" withBorder>
            <Text fw={600} mb="sm">
              Fund & Approval Requests
            </Text>
            <TextInput
              label="Request ID"
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
            />
            <Select
              mt="sm"
              label="Decision"
              data={["APPROVE", "REJECT", "FORWARD"]}
              value={approvalDecision}
              onChange={setApprovalDecision}
            />
            <Button
              mt="sm"
              fullWidth
              color="cyan"
              onClick={() =>
                notifications.show({
                  title: "Action Recorded",
                  message: "Fund decision submitted",
                  color: "green",
                })
              }
            >
              Submit Request Decision
            </Button>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Data Tabs */}
      <Tabs mt="md" defaultValue="details">
        <Tabs.List>
          {can("view_inbox") && (
            <Tabs.Tab value="inbox">Project Inbox</Tabs.Tab>
          )}
          {can("view_inventory") && (
            <Tabs.Tab value="inventory">Project Inventory</Tabs.Tab>
          )}
          {can("view_staff") && (
            <Tabs.Tab value="staff">Staff Requests</Tabs.Tab>
          )}
          {can("view_stipends") && (
            <Tabs.Tab value="stipends">Stipend Disbursements</Tabs.Tab>
          )}
          <Tabs.Tab value="history">File Tracking</Tabs.Tab>
          {can("view_details") && (
            <Tabs.Tab value="details">Project Details</Tabs.Tab>
          )}
        </Tabs.List>

        {can("view_inbox") && (
          <Tabs.Panel value="inbox" pt="md">
            <Button mb="sm" onClick={loadInbox}>
              Refresh Inbox
            </Button>
            <DataTable
              rows={inboxRows}
              columns={[
                "id",
                "title",
                "module_name",
                "status",
                "request_type",
                "assigned_role",
              ]}
            />
          </Tabs.Panel>
        )}
        {can("view_inventory") && (
          <Tabs.Panel value="inventory" pt="md">
            <Button mb="sm" onClick={loadInventory}>
              Load Fund Requests
            </Button>
            <DataTable
              rows={fundRows}
              columns={[
                "id",
                "reference_id",
                "title",
                "status",
                "request_type",
              ]}
            />
          </Tabs.Panel>
        )}
        {can("view_staff") && (
          <Tabs.Panel value="staff" pt="md">
            <Button mb="sm" onClick={loadStaff}>
              Load Staff Requests
            </Button>
            <DataTable
              rows={staffRows}
              columns={[
                "id",
                "reference_id",
                "title",
                "status",
                "request_type",
              ]}
            />
          </Tabs.Panel>
        )}
        {can("view_stipends") && (
          <Tabs.Panel value="stipends" pt="md">
            <Button mb="sm" onClick={loadStipends}>
              Load Stipend Disbursements
            </Button>
            <DataTable
              rows={stipendRows}
              columns={[
                "id",
                "project",
                "expenditure_head",
                "amount",
                "status",
                "date",
              ]}
            />
          </Tabs.Panel>
        )}
        <Tabs.Panel value="history" pt="md">
          <DataTable
            rows={historyRows}
            columns={["id", "method", "path", "status_code", "created_at"]}
          />
        </Tabs.Panel>
        {can("view_details") && (
          <Tabs.Panel value="details" pt="md">
            {projectDetails ? (
              <Paper p="md" withBorder>
                <Text fw={700}>{projectDetails.title}</Text>
                <Text size="sm" c="dimmed">
                  Project Number: {projectDetails.project_number}
                </Text>
                <Text size="sm" c="dimmed">
                  Status: {projectDetails.status}
                </Text>
                <Text mt="sm">{projectDetails.description}</Text>
                <Text mt="sm" fw={600}>
                  Co-PI Details
                </Text>
                {(projectDetails.co_pi_details || []).map((copi) => (
                  <Text key={copi.id} size="sm">
                    {copi.name} ({copi.designation || "-"})
                  </Text>
                ))}
              </Paper>
            ) : (
              <Text c="dimmed">
                Load project details using the Project ID form above.
              </Text>
            )}
          </Tabs.Panel>
        )}
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
            {columns.map((col) => (
              <Table.Th key={col}>{col}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length}>
                <Text c="dimmed">No records</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            rows.map((row) => (
              <Table.Tr key={row.id || JSON.stringify(row)}>
                {columns.map((col) => (
                  <Table.Td key={col}>{String(row[col] ?? "-")}</Table.Td>
                ))}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}

DataTable.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  columns: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default WorkflowTools;

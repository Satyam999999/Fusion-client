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
  approveApprovalRoute,
  forwardApprovalRoute,
  rejectApprovalRoute,
  documentHistoryRoute,
  complianceReportRoute,
  stipendDisbursementsRoute,
  BASE,
} from "../../routes/RSPCRoutes";
import { useRSPCRole, ROLE_LABELS, ROLE_COLORS } from "./hooks/useRSPCRole";

function ManagementConsole() {
  const { role, can } = useRSPCRole();

  const isPositiveIntegerId = (value) => /^\d+$/.test(String(value || "").trim());

  const [projectNumber, setProjectNumber] = useState("");
  const [resolvedProjectId, setResolvedProjectId] = useState("");
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
  const [complianceStats, setComplianceStats] = useState(null);
  const [complianceRows, setComplianceRows] = useState([]);
  const [fundId, setFundId] = useState("");
  const [approvalDecision, setApprovalDecision] = useState("APPROVE");
  const [activeTab, setActiveTab] = useState("compliance");

  const projectStatus = String(projectDetails?.status || "").toUpperCase();
  const canShowVetButton =
    can("vet_project") &&
    ["SUBMITTED", "UNDER_REVIEW", "DRAFT", "PROPOSED"].includes(projectStatus);

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "—";

  const formatCurrency = (value) =>
    value === null || value === undefined || value === ""
      ? "—"
      : `₹${Number(value).toLocaleString("en-IN")}`;

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
    axios({ url, ...opts }).catch((error) => {
      const apiMessage =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        error?.message ||
        `Request failed: ${url}`;

      notifications.show({
        title: "Error",
        message: apiMessage,
        color: "red",
      });
      return null;
    });

  const loadInbox = () =>
    api(projectInboxRoute).then(
      (r) => r && setInboxRows(r.data.results || r.data || []),
    );
  const loadInventory = () =>
    api(projectInventoryRoute, {
      params: { project_id: resolvedProjectId || undefined },
    }).then((r) => r && setFundRows(r.data.results || r.data || []));
  const loadStaff = () =>
    api(projectStaffRoute, {
      params: { project_id: resolvedProjectId || undefined },
    }).then((r) => r && setStaffRows(r.data.results || r.data || []));
  const loadStipends = () =>
    api(stipendDisbursementsRoute).then(
      (r) => r && setStipendRows(r.data || []),
    );

  const loadHistory = () => {
    if (!documentId)
      return notifications.show({
        title: "Validation",
        message: "Enter Document ID",
        color: "red",
      });

    if (!isPositiveIntegerId(documentId)) {
      notifications.show({
        title: "Validation",
        message: "Document ID must be a positive number.",
        color: "red",
      });
      return;
    }

    api(documentHistoryRoute(documentId)).then((r) => {
      if (!r) return;
      const rows = Array.isArray(r.data) ? r.data : [];
      setHistoryRows(rows);
    });
  };
  const loadComplianceReport = () => {
    api(complianceReportRoute).then((r) => {
      if (!r) return;

      const payload = r.data || {};
      setComplianceStats(payload);

      const rows = [
        ...(payload?.projects?.status_rows || []).map((row) => ({
          section: "Projects",
          status: row.status,
          count: row.count,
        })),
        ...(payload?.reports?.status_rows || []).map((row) => ({
          section: "Reports",
          status: row.status,
          count: row.count,
        })),
        ...(payload?.expenditures?.status_rows || []).map((row) => ({
          section: "Expenditures",
          status: row.status,
          count: row.count,
        })),
      ];

      setComplianceRows(rows);
      setActiveTab("compliance");
    });
  };

  useEffect(() => {
    if (activeTab === "compliance" && complianceRows.length === 0) {
      loadComplianceReport();
    }

    if (activeTab === "stipends" && stipendRows.length === 0) {
      loadStipends();
    }
  }, [activeTab]);

  const resolveProjectByNumber = async () => {
    const q = String(projectNumber || "").trim();
    if (!q) {
      notifications.show({
        title: "Validation",
        message: "Project Number is required.",
        color: "red",
      });
      return null;
    }

    const r = await api(`${BASE}/projects/`, { params: { search: q } });
    if (!r) return null;

    const rows = Array.isArray(r.data) ? r.data : r.data?.results || [];
    const exact = rows.find(
      (row) => String(row.project_number || "").trim().toLowerCase() === q.toLowerCase(),
    );
    const match = exact || rows[0] || null;

    if (!match) {
      setResolvedProjectId("");
      setProjectDetails(null);
      notifications.show({
        title: "Not Found",
        message: "No project found for the given Project Number.",
        color: "red",
      });
      return null;
    }

    setResolvedProjectId(String(match.id));
    return match;
  };

  const loadDetails = async () => {
    if (!projectNumber)
      return notifications.show({
        title: "Validation",
        message: "Enter a Project Number",
        color: "red",
      });

    const project = await resolveProjectByNumber();
    if (!project) return;

    api(projectDetailsRoute(project.id)).then((r) => r && setProjectDetails(r.data));
  };

  const runAction = async (action, payload = {}) => {
    let projectPk = resolvedProjectId;

    const requiresProject = [
      "saveDraft",
      "resubmit",
      "vetHod",
      "verifyAdmin",
      "deanDecision",
      "directorDecision",
      "modifyDuration",
      "downloadPdf",
    ];
    const requiresStaff = ["modifyTenure", "processStaff", "deanStaff"];

    if (requiresProject.includes(action) && !projectNumber) {
      notifications.show({
        title: "Validation",
        message: "Project Number is required.",
        color: "red",
      });
      return;
    }

    if (requiresProject.includes(action) && !projectPk) {
      const project = await resolveProjectByNumber();
      if (!project) return;
      projectPk = String(project.id);
    }

    const routes = {
      saveDraft: saveProjectDraftRoute(projectPk),
      resubmit: resubmitProjectRoute(projectPk),
      vetHod: vetProjectByHodRoute(projectPk),
      verifyAdmin: verifyProjectByAdminRoute(projectPk),
      deanDecision: deanDecisionProjectRoute(projectPk),
      directorDecision: directorDecisionProjectRoute(projectPk),
      modifyDuration: modifyProjectDurationRoute(projectPk),
      downloadPdf: downloadProjectPdfRoute(projectPk),
      modifyTenure: modifyStaffTenureRoute(staffAppointmentId),
      processStaff: processStaffAppointmentAdminRoute(staffAppointmentId),
      deanStaff: deanDecisionStaffAppointmentRoute(staffAppointmentId),
    };

    if (requiresStaff.includes(action) && !staffAppointmentId) {
      notifications.show({
        title: "Validation",
        message: "Staff Appointment ID is required.",
        color: "red",
      });
      return;
    }

    if (requiresStaff.includes(action) && !isPositiveIntegerId(staffAppointmentId)) {
      notifications.show({
        title: "Validation",
        message: "Staff Appointment ID must be a positive number.",
        color: "red",
      });
      return;
    }

    if (action === "modifyDuration" && !durationYears) {
      notifications.show({
        title: "Validation",
        message: "Extension years are required.",
        color: "red",
      });
      return;
    }

    if (action === "modifyTenure" && !contractEndDate) {
      notifications.show({
        title: "Validation",
        message: "Contract end date is required.",
        color: "red",
      });
      return;
    }

    if (!routes[action]) return;

    // Download endpoint is GET and returns a PDF blob.
    if (action === "downloadPdf") {
      api(routes[action], { method: "get", responseType: "blob" }).then((r) => {
        if (!r) return;
        const blobUrl = window.URL.createObjectURL(new Blob([r.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `project_${projectNumber || projectPk}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
        notifications.show({
          title: "Success",
          message: "Project PDF downloaded.",
          color: "green",
        });
      });
      return;
    }

    api(routes[action], { method: "post", data: payload }).then((r) => {
      if (!r) return;

      notifications.show({
        title: "Success",
        message: `'${action}' completed`,
        color: "green",
      });

      if (requiresProject.includes(action) && projectPk) {
        api(projectDetailsRoute(projectPk)).then((detailsResponse) => {
          if (!detailsResponse) return;
          setProjectDetails(detailsResponse.data);
        });
      }
    });
  };

  return (
    <>
      {/* Role badge */}
      <Paper
        p="sm"
        mb="md"
        withBorder
        className="rspc-role-banner"
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
              label="Project Number"
              value={projectNumber}
              onChange={(e) => {
                setProjectNumber(e.target.value);
                setResolvedProjectId("");
                setProjectDetails(null);
              }}
              onBlur={() => {
                if (String(projectNumber || "").trim()) {
                  loadDetails();
                }
              }}
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

            {can("view_details") && (
              <>
                <Text mt="md" fw={600}>
                  Project Details
                </Text>
                {projectDetails ? (
                  <Paper p="md" mt="xs" withBorder>
                    <Text fw={700} size="lg">
                      {projectDetails.title || "Untitled Project"}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Project Number: {projectDetails.project_number || "—"}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Status: {projectDetails.status || "—"}
                    </Text>
                    <Grid mt="sm" gutter="sm">
                      <Grid.Col span={6}>
                        <Text size="xs" c="dimmed">
                          Principal Investigator
                        </Text>
                        <Text size="sm" fw={500}>
                          {projectDetails.pi_name || projectDetails.principal_investigator?.name || projectDetails.principal_investigator || "—"}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="xs" c="dimmed">
                          Funding Agency
                        </Text>
                        <Text size="sm" fw={500}>
                          {projectDetails.funding_agency_name || projectDetails.funding_agency?.name || projectDetails.funding_agency || "—"}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="xs" c="dimmed">
                          Sanctioned Amount
                        </Text>
                        <Text size="sm" fw={500}>
                          {formatCurrency(projectDetails.sanctioned_amount)}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="xs" c="dimmed">
                          Utilized Amount
                        </Text>
                        <Text size="sm" fw={500}>
                          {formatCurrency(projectDetails.utilized_amount)}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="xs" c="dimmed">
                          Start Date
                        </Text>
                        <Text size="sm" fw={500}>
                          {formatDate(projectDetails.start_date)}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="xs" c="dimmed">
                          End Date
                        </Text>
                        <Text size="sm" fw={500}>
                          {formatDate(projectDetails.original_end_date || projectDetails.extended_end_date || projectDetails.actual_end_date)}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="xs" c="dimmed">
                          Research Area
                        </Text>
                        <Text size="sm" fw={500}>
                          {projectDetails.research_area?.name || projectDetails.research_area || "—"}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="xs" c="dimmed">
                          Duration
                        </Text>
                        <Text size="sm" fw={500}>
                          {projectDetails.duration_months ? `${projectDetails.duration_months} months` : "—"}
                        </Text>
                      </Grid.Col>
                    </Grid>
                    {projectDetails.description && (
                      <>
                        <Text mt="sm" size="xs" c="dimmed">
                          Description
                        </Text>
                        <Text size="sm">{projectDetails.description}</Text>
                      </>
                    )}
                  </Paper>
                ) : (
                  <Text size="sm" c="dimmed" mt="xs">
                    Enter Project Number and click Load Project Details.
                  </Text>
                )}
              </>
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
      </Grid>

      {/* Data Tabs */}
      <Tabs mt="md" value={activeTab} onChange={(value) => setActiveTab(value || "compliance") }>
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
          <Tabs.Tab value="compliance">Compliance Report</Tabs.Tab>
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
                "project_number",
                "title",
                "status",
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
                "project_id",
                "project_number",
                "pi_name",
              ]}
            />
          </Tabs.Panel>
        )}
        {can("view_stipends") && (
          <Tabs.Panel value="stipends" pt="md">
            <Button mb="sm" onClick={loadStipends}>
              Refresh Stipend Disbursements
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
        <Tabs.Panel value="compliance" pt="md">
          <Button mb="sm" onClick={loadComplianceReport}>
            Refresh Compliance Report
          </Button>
          <DataTable
            rows={complianceRows}
            columns={["section", "status", "count"]}
          />
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

export default ManagementConsole;

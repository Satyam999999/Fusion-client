import { useEffect, useState } from "react";
import {
  Tabs,
  Paper,
  Text,
  Grid,
  TextInput,
  Textarea,
  Select,
  Button,
  Table,
  ScrollArea,
  Badge,
} from "@mantine/core";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import {
  fetchApprovalRequestsRoute,
  fetchProgressEntriesRoute,
  fetchClosureRequestsRoute,
  fetchManagedDocumentsRoute,
  fetchRuleDefinitionsRoute,
  fetchAutomationRulesRoute,
  fetchAuditEventsRoute,
  governanceLoginRoute,
  governanceLogoutRoute,
  governanceMeRoute,
  governanceChangePasswordRoute,
  forwardApprovalRoute,
  approveApprovalRoute,
  rejectApprovalRoute,
  approveClosureRoute,
  evaluateRuleRoute,
  executeAutomationRoute,
} from "../../routes/RSPCRoutes/index";

function Governance() {
  const [activeTab, setActiveTab] = useState("auth");

  const [authForm, setAuthForm] = useState({ username: "", password: "" });
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
  });
  const [me, setMe] = useState(null);

  const [approvals, setApprovals] = useState([]);
  const [approvalForm, setApprovalForm] = useState({
    module_name: "RSPC",
    reference_id: "",
    title: "",
    description: "",
    assigned_role: "RSPC_ADMIN",
  });

  const [progressEntries, setProgressEntries] = useState([]);
  const [progressForm, setProgressForm] = useState({
    project: "",
    report_date: "",
    percent_complete: 0,
    summary: "",
    risks: "",
    action_items: "",
  });

  const [closures, setClosures] = useState([]);
  const [closureForm, setClosureForm] = useState({
    project: "",
    closure_reason: "",
    closure_date: "",
    status: "SUBMITTED",
  });

  const [documents, setDocuments] = useState([]);
  const [documentForm, setDocumentForm] = useState({
    title: "",
    category: "REPORT",
    project: "",
    file: null,
  });

  const [rules, setRules] = useState([]);
  const [ruleForm, setRuleForm] = useState({
    name: "",
    field_name: "status",
    operator: "eq",
    expected_value: "ONGOING",
  });
  const [ruleEvalPayload, setRuleEvalPayload] = useState(
    '{"status":"ONGOING"}',
  );

  const [automations, setAutomations] = useState([]);
  const [automationForm, setAutomationForm] = useState({
    name: "",
    trigger_event: "manual",
    rule: "",
    action_type: "NOTIFY",
    action_payload: '{"status":"COMPLETED"}',
    is_active: true,
  });

  const [auditEvents, setAuditEvents] = useState([]);

  const loadAll = async () => {
    try {
      const [a, p, c, d, r, au, ae] = await Promise.all([
        axios.get(fetchApprovalRequestsRoute),
        axios.get(fetchProgressEntriesRoute),
        axios.get(fetchClosureRequestsRoute),
        axios.get(fetchManagedDocumentsRoute),
        axios.get(fetchRuleDefinitionsRoute),
        axios.get(fetchAutomationRulesRoute),
        axios.get(fetchAuditEventsRoute),
      ]);
      setApprovals(a.data.results || a.data);
      setProgressEntries(p.data.results || p.data);
      setClosures(c.data.results || c.data);
      setDocuments(d.data.results || d.data);
      setRules(r.data.results || r.data);
      setAutomations(au.data.results || au.data);
      setAuditEvents(ae.data.results || ae.data);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load governance data",
        color: "red",
      });
    }
  };

  const loadMe = async () => {
    try {
      const response = await axios.get(governanceMeRoute);
      setMe(response.data);
    } catch {
      setMe(null);
    }
  };

  useEffect(() => {
    loadAll();
    loadMe();
  }, []);

  const handleLogin = async () => {
    try {
      const response = await axios.post(governanceLoginRoute, authForm);
      localStorage.setItem("rspcAuthToken", response.data.token);
      notifications.show({
        title: "Success",
        message: "Logged in",
        color: "green",
      });
      loadMe();
    } catch {
      notifications.show({
        title: "Error",
        message: "Login failed",
        color: "red",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(governanceLogoutRoute);
    } catch {
      // Ignore server-side token delete failures
    }
    localStorage.removeItem("rspcAuthToken");
    setMe(null);
    notifications.show({
      title: "Logged out",
      message: "Session ended",
      color: "blue",
    });
  };

  const handlePasswordChange = async () => {
    try {
      await axios.post(governanceChangePasswordRoute, passwordForm);
      notifications.show({
        title: "Success",
        message: "Password changed",
        color: "green",
      });
      setPasswordForm({ old_password: "", new_password: "" });
    } catch {
      notifications.show({
        title: "Error",
        message: "Password change failed",
        color: "red",
      });
    }
  };

  const createApproval = async () => {
    try {
      await axios.post(fetchApprovalRequestsRoute, approvalForm);
      notifications.show({
        title: "Created",
        message: "Approval request created",
        color: "green",
      });
      setApprovalForm({
        module_name: "RSPC",
        reference_id: "",
        title: "",
        description: "",
        assigned_role: "RSPC_ADMIN",
      });
      loadAll();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to create approval request",
        color: "red",
      });
    }
  };

  const actOnApproval = async (id, actionName) => {
    const endpoint =
      actionName === "approve"
        ? approveApprovalRoute(id)
        : actionName === "reject"
          ? rejectApprovalRoute(id)
          : forwardApprovalRoute(id);
    try {
      await axios.post(endpoint, {});
      notifications.show({
        title: "Updated",
        message: `Request ${actionName}d`,
        color: "green",
      });
      loadAll();
    } catch {
      notifications.show({
        title: "Error",
        message: "Action failed",
        color: "red",
      });
    }
  };

  const createProgress = async () => {
    try {
      await axios.post(fetchProgressEntriesRoute, {
        ...progressForm,
        project: progressForm.project ? Number(progressForm.project) : null,
      });
      notifications.show({
        title: "Created",
        message: "Progress report created",
        color: "green",
      });
      setProgressForm({
        project: "",
        report_date: "",
        percent_complete: 0,
        summary: "",
        risks: "",
        action_items: "",
      });
      loadAll();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to create progress report",
        color: "red",
      });
    }
  };

  const createClosure = async () => {
    try {
      await axios.post(fetchClosureRequestsRoute, {
        ...closureForm,
        project: Number(closureForm.project),
      });
      notifications.show({
        title: "Created",
        message: "Closure request created",
        color: "green",
      });
      setClosureForm({
        project: "",
        closure_reason: "",
        closure_date: "",
        status: "SUBMITTED",
      });
      loadAll();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to create closure request",
        color: "red",
      });
    }
  };

  const approveClosure = async (id) => {
    try {
      await axios.post(approveClosureRoute(id), {});
      notifications.show({
        title: "Approved",
        message: "Closure approved",
        color: "green",
      });
      loadAll();
    } catch {
      notifications.show({
        title: "Error",
        message: "Approval failed",
        color: "red",
      });
    }
  };

  const uploadDocument = async () => {
    if (!documentForm.file) {
      notifications.show({
        title: "Validation",
        message: "Select a file",
        color: "red",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", documentForm.title);
    formData.append("category", documentForm.category);
    if (documentForm.project) formData.append("project", documentForm.project);
    formData.append("file", documentForm.file);

    try {
      await axios.post(fetchManagedDocumentsRoute, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      notifications.show({
        title: "Uploaded",
        message: "Document uploaded",
        color: "green",
      });
      setDocumentForm({
        title: "",
        category: "REPORT",
        project: "",
        file: null,
      });
      loadAll();
    } catch {
      notifications.show({
        title: "Error",
        message: "Upload failed",
        color: "red",
      });
    }
  };

  const createRule = async () => {
    try {
      await axios.post(fetchRuleDefinitionsRoute, ruleForm);
      notifications.show({
        title: "Created",
        message: "Rule created",
        color: "green",
      });
      setRuleForm({
        name: "",
        field_name: "status",
        operator: "eq",
        expected_value: "ONGOING",
      });
      loadAll();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to create rule",
        color: "red",
      });
    }
  };

  const evaluateRule = async (id) => {
    try {
      const payload = JSON.parse(ruleEvalPayload || "{}");
      const response = await axios.post(evaluateRuleRoute(id), { payload });
      notifications.show({
        title: "Rule Evaluation",
        message: `Result: ${response.data.result}`,
        color: response.data.result ? "green" : "yellow",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Rule evaluation failed",
        color: "red",
      });
    }
  };

  const createAutomation = async () => {
    try {
      await axios.post(fetchAutomationRulesRoute, {
        ...automationForm,
        rule: automationForm.rule ? Number(automationForm.rule) : null,
        action_payload: JSON.parse(automationForm.action_payload || "{}"),
      });
      notifications.show({
        title: "Created",
        message: "Automation rule created",
        color: "green",
      });
      setAutomationForm({
        name: "",
        trigger_event: "manual",
        rule: "",
        action_type: "NOTIFY",
        action_payload: '{"status":"COMPLETED"}',
        is_active: true,
      });
      loadAll();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to create automation",
        color: "red",
      });
    }
  };

  const executeAutomation = async (id) => {
    try {
      await axios.post(executeAutomationRoute(id), {
        payload: { percent_complete: 100, project_id: 1 },
      });
      notifications.show({
        title: "Executed",
        message: "Automation executed",
        color: "green",
      });
      loadAll();
    } catch {
      notifications.show({
        title: "Error",
        message: "Execution failed",
        color: "red",
      });
    }
  };

  return (
    <>
      <Text fw={700} size="xl" mt="sm" ml={{ md: "lg" }}>
        Governance and Controls
      </Text>
      <Tabs value={activeTab} onChange={setActiveTab} mt="md">
        <Tabs.List>
          <Tabs.Tab value="auth">Authentication and Security</Tabs.Tab>
          <Tabs.Tab value="approval">Approval Workflow</Tabs.Tab>
          <Tabs.Tab value="progress">Progress Reporting</Tabs.Tab>
          <Tabs.Tab value="closure">Project Closure</Tabs.Tab>
          <Tabs.Tab value="documents">Document Management</Tabs.Tab>
          <Tabs.Tab value="automation">Workflow Automation</Tabs.Tab>
          <Tabs.Tab value="traceability">Traceability and Integrity</Tabs.Tab>
          <Tabs.Tab value="rules">Rule Engine</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="auth" pt="md">
          <Grid>
            <Grid.Col span={6}>
              <Paper p="md" withBorder>
                <Text fw={600} mb="sm">
                  Login
                </Text>
                <TextInput
                  label="Username"
                  value={authForm.username}
                  onChange={(e) =>
                    setAuthForm((f) => ({ ...f, username: e.target.value }))
                  }
                />
                <TextInput
                  mt="sm"
                  label="Password"
                  type="password"
                  value={authForm.password}
                  onChange={(e) =>
                    setAuthForm((f) => ({ ...f, password: e.target.value }))
                  }
                />
                <Button mt="md" onClick={handleLogin}>
                  Login
                </Button>
                <Button mt="md" ml="sm" variant="light" onClick={handleLogout}>
                  Logout
                </Button>
                <Text mt="md" size="sm">
                  Current:{" "}
                  {me?.authenticated ? `${me.username}` : "Not authenticated"}
                </Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={6}>
              <Paper p="md" withBorder>
                <Text fw={600} mb="sm">
                  Change Password
                </Text>
                <TextInput
                  label="Old Password"
                  type="password"
                  value={passwordForm.old_password}
                  onChange={(e) =>
                    setPasswordForm((f) => ({
                      ...f,
                      old_password: e.target.value,
                    }))
                  }
                />
                <TextInput
                  mt="sm"
                  label="New Password"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm((f) => ({
                      ...f,
                      new_password: e.target.value,
                    }))
                  }
                />
                <Button mt="md" onClick={handlePasswordChange}>
                  Update Password
                </Button>
              </Paper>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="approval" pt="md">
          <Paper p="md" withBorder>
            <Text fw={600} mb="sm">
              Create Approval Request
            </Text>
            <Grid>
              <Grid.Col span={4}>
                <TextInput
                  label="Module"
                  value={approvalForm.module_name}
                  onChange={(e) =>
                    setApprovalForm((f) => ({
                      ...f,
                      module_name: e.target.value,
                    }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput
                  label="Reference ID"
                  value={approvalForm.reference_id}
                  onChange={(e) =>
                    setApprovalForm((f) => ({
                      ...f,
                      reference_id: e.target.value,
                    }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput
                  label="Assigned Role"
                  value={approvalForm.assigned_role}
                  onChange={(e) =>
                    setApprovalForm((f) => ({
                      ...f,
                      assigned_role: e.target.value,
                    }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <TextInput
                  label="Title"
                  value={approvalForm.title}
                  onChange={(e) =>
                    setApprovalForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea
                  label="Description"
                  value={approvalForm.description}
                  onChange={(e) =>
                    setApprovalForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                />
              </Grid.Col>
            </Grid>
            <Button mt="md" onClick={createApproval}>
              Create
            </Button>
          </Paper>
          <ScrollArea h={280} mt="md">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {approvals.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>{row.title}</Table.Td>
                    <Table.Td>
                      <Badge>{row.status}</Badge>
                    </Table.Td>
                    <Table.Td>{row.assigned_role || "-"}</Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        onClick={() => actOnApproval(row.id, "forward")}
                      >
                        Forward
                      </Button>
                      <Button
                        size="xs"
                        ml={6}
                        color="green"
                        onClick={() => actOnApproval(row.id, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        size="xs"
                        ml={6}
                        color="red"
                        onClick={() => actOnApproval(row.id, "reject")}
                      >
                        Reject
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="progress" pt="md">
          <Paper p="md" withBorder>
            <Text fw={600} mb="sm">
              Create Progress Entry
            </Text>
            <Grid>
              <Grid.Col span={3}>
                <TextInput
                  label="Project ID"
                  value={progressForm.project}
                  onChange={(e) =>
                    setProgressForm((f) => ({ ...f, project: e.target.value }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput
                  type="date"
                  label="Date"
                  value={progressForm.report_date}
                  onChange={(e) =>
                    setProgressForm((f) => ({
                      ...f,
                      report_date: e.target.value,
                    }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput
                  type="number"
                  label="Percent Complete"
                  value={progressForm.percent_complete}
                  onChange={(e) =>
                    setProgressForm((f) => ({
                      ...f,
                      percent_complete: Number(e.target.value || 0),
                    }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea
                  label="Summary"
                  value={progressForm.summary}
                  onChange={(e) =>
                    setProgressForm((f) => ({ ...f, summary: e.target.value }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Textarea
                  label="Risks"
                  value={progressForm.risks}
                  onChange={(e) =>
                    setProgressForm((f) => ({ ...f, risks: e.target.value }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Textarea
                  label="Action Items"
                  value={progressForm.action_items}
                  onChange={(e) =>
                    setProgressForm((f) => ({
                      ...f,
                      action_items: e.target.value,
                    }))
                  }
                />
              </Grid.Col>
            </Grid>
            <Button mt="md" onClick={createProgress}>
              Create
            </Button>
          </Paper>
          <ScrollArea h={280} mt="md">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Project</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Complete %</Table.Th>
                  <Table.Th>Summary</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {progressEntries.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>
                      {row.project_number || row.project || "-"}
                    </Table.Td>
                    <Table.Td>{row.report_date}</Table.Td>
                    <Table.Td>{row.percent_complete}</Table.Td>
                    <Table.Td>{row.summary}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="closure" pt="md">
          <Paper p="md" withBorder>
            <Text fw={600} mb="sm">
              Create Closure Request
            </Text>
            <Grid>
              <Grid.Col span={3}>
                <TextInput
                  label="Project ID"
                  value={closureForm.project}
                  onChange={(e) =>
                    setClosureForm((f) => ({ ...f, project: e.target.value }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput
                  type="date"
                  label="Closure Date"
                  value={closureForm.closure_date}
                  onChange={(e) =>
                    setClosureForm((f) => ({
                      ...f,
                      closure_date: e.target.value,
                    }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <Select
                  label="Status"
                  data={["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]}
                  value={closureForm.status}
                  onChange={(v) =>
                    v && setClosureForm((f) => ({ ...f, status: v }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea
                  label="Closure Reason"
                  value={closureForm.closure_reason}
                  onChange={(e) =>
                    setClosureForm((f) => ({
                      ...f,
                      closure_reason: e.target.value,
                    }))
                  }
                />
              </Grid.Col>
            </Grid>
            <Button mt="md" onClick={createClosure}>
              Create
            </Button>
          </Paper>
          <ScrollArea h={260} mt="md">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Project</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {closures.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>{row.project_number || row.project}</Table.Td>
                    <Table.Td>{row.closure_date}</Table.Td>
                    <Table.Td>
                      <Badge>{row.status}</Badge>
                    </Table.Td>
                    <Table.Td>
                      {row.status !== "APPROVED" && (
                        <Button
                          size="xs"
                          color="green"
                          onClick={() => approveClosure(row.id)}
                        >
                          Approve
                        </Button>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="documents" pt="md">
          <Paper p="md" withBorder>
            <Text fw={600} mb="sm">
              Upload Document
            </Text>
            <Grid>
              <Grid.Col span={4}>
                <TextInput
                  label="Title"
                  value={documentForm.title}
                  onChange={(e) =>
                    setDocumentForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <Select
                  label="Category"
                  data={["PROPOSAL", "SANCTION", "REPORT", "CLOSURE", "OTHER"]}
                  value={documentForm.category}
                  onChange={(v) =>
                    v && setDocumentForm((f) => ({ ...f, category: v }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput
                  label="Project ID"
                  value={documentForm.project}
                  onChange={(e) =>
                    setDocumentForm((f) => ({ ...f, project: e.target.value }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <input
                  type="file"
                  onChange={(e) =>
                    setDocumentForm((f) => ({
                      ...f,
                      file: e.target.files?.[0] || null,
                    }))
                  }
                />
              </Grid.Col>
            </Grid>
            <Button mt="md" onClick={uploadDocument}>
              Upload
            </Button>
          </Paper>
          <ScrollArea h={260} mt="md">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Checksum</Table.Th>
                  <Table.Th>File</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {documents.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>{row.title}</Table.Td>
                    <Table.Td>{row.category}</Table.Td>
                    <Table.Td>
                      {row.checksum_sha256
                        ? `${row.checksum_sha256.slice(0, 12)}...`
                        : "-"}
                    </Table.Td>
                    <Table.Td>
                      {row.file_url ? (
                        <a href={row.file_url} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      ) : (
                        "-"
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="automation" pt="md">
          <Paper p="md" withBorder>
            <Text fw={600} mb="sm">
              Create Automation Rule
            </Text>
            <Grid>
              <Grid.Col span={4}>
                <TextInput
                  label="Name"
                  value={automationForm.name}
                  onChange={(e) =>
                    setAutomationForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput
                  label="Trigger Event"
                  value={automationForm.trigger_event}
                  onChange={(e) =>
                    setAutomationForm((f) => ({
                      ...f,
                      trigger_event: e.target.value,
                    }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <Select
                  label="Rule"
                  data={rules.map((r) => ({
                    value: String(r.id),
                    label: r.name,
                  }))}
                  value={automationForm.rule}
                  onChange={(v) =>
                    setAutomationForm((f) => ({ ...f, rule: v }))
                  }
                  searchable
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <Select
                  label="Action"
                  data={["NOTIFY", "UPDATE_PROJECT_STATUS", "AUTO_APPROVE"]}
                  value={automationForm.action_type}
                  onChange={(v) =>
                    v && setAutomationForm((f) => ({ ...f, action_type: v }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Action Payload JSON"
                  value={automationForm.action_payload}
                  onChange={(e) =>
                    setAutomationForm((f) => ({
                      ...f,
                      action_payload: e.target.value,
                    }))
                  }
                />
              </Grid.Col>
            </Grid>
            <Button mt="md" onClick={createAutomation}>
              Create
            </Button>
          </Paper>
          <ScrollArea h={250} mt="md">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Action</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Run</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {automations.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>{row.name}</Table.Td>
                    <Table.Td>{row.action_type}</Table.Td>
                    <Table.Td>{row.last_run_status || "Never"}</Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        onClick={() => executeAutomation(row.id)}
                      >
                        Execute
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="traceability" pt="md">
          <Text fw={600} mb="sm">
            Audit Events
          </Text>
          <ScrollArea h={420}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Time</Table.Th>
                  <Table.Th>Method</Table.Th>
                  <Table.Th>Path</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Payload Hash</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {auditEvents.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>
                      {new Date(row.created_at).toLocaleString()}
                    </Table.Td>
                    <Table.Td>{row.method}</Table.Td>
                    <Table.Td>{row.path}</Table.Td>
                    <Table.Td>{row.status_code}</Table.Td>
                    <Table.Td>{row.username || "anonymous"}</Table.Td>
                    <Table.Td>
                      {row.payload_hash
                        ? `${row.payload_hash.slice(0, 12)}...`
                        : "-"}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="rules" pt="md">
          <Paper p="md" withBorder>
            <Text fw={600} mb="sm">
              Create Rule
            </Text>
            <Grid>
              <Grid.Col span={3}>
                <TextInput
                  label="Name"
                  value={ruleForm.name}
                  onChange={(e) =>
                    setRuleForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput
                  label="Field Name"
                  value={ruleForm.field_name}
                  onChange={(e) =>
                    setRuleForm((f) => ({ ...f, field_name: e.target.value }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <Select
                  label="Operator"
                  data={["eq", "ne", "gt", "gte", "lt", "lte", "contains"]}
                  value={ruleForm.operator}
                  onChange={(v) =>
                    v && setRuleForm((f) => ({ ...f, operator: v }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput
                  label="Expected Value"
                  value={ruleForm.expected_value}
                  onChange={(e) =>
                    setRuleForm((f) => ({
                      ...f,
                      expected_value: e.target.value,
                    }))
                  }
                />
              </Grid.Col>
            </Grid>
            <Button mt="md" onClick={createRule}>
              Create Rule
            </Button>
          </Paper>
          <Paper p="md" withBorder mt="md">
            <Text fw={600} mb="sm">
              Evaluate Payload JSON
            </Text>
            <Textarea
              minRows={3}
              value={ruleEvalPayload}
              onChange={(e) => setRuleEvalPayload(e.target.value)}
            />
          </Paper>
          <ScrollArea h={220} mt="md">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Expression</Table.Th>
                  <Table.Th>Evaluate</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rules.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>{row.name}</Table.Td>
                    <Table.Td>
                      {row.field_name} {row.operator} {row.expected_value}
                    </Table.Td>
                    <Table.Td>
                      <Button size="xs" onClick={() => evaluateRule(row.id)}>
                        Evaluate
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>
      </Tabs>
    </>
  );
}

export default Governance;

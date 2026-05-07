import PropTypes from "prop-types";
import cx from "clsx";
import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Badge,
  ScrollArea,
  Text,
  Flex,
  Modal,
  Grid,
  Select,
  TextInput,
  Textarea,
} from "@mantine/core";
import {
  ThumbsUp,
  ThumbsDown,
  ArrowsDownUp,
  ArrowUp,
  ArrowDown,
} from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import classes from "../../styles/tableStyle.module.css";
import { badgeColor } from "../../helpers/badgeColours";
import {
  approveExpenditureRoute,
  rejectExpenditureRoute,
  fetchExpendituresRoute,
  fetchProjectsRoute,
} from "../../../../routes/RSPCRoutes";
import { useRSPCRole } from "../../hooks/useRSPCRole";

const EXPENDITURE_HEAD_OPTIONS = [
  { value: "MANPOWER", label: "Manpower/Salary" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "CONSUMABLES", label: "Consumables" },
  { value: "TRAVEL", label: "Travel" },
  { value: "PUBLICATIONS", label: "Publications" },
  { value: "CONTINGENCY", label: "Contingency" },
  { value: "OVERHEAD", label: "Overhead" },
  { value: "SERVICES", label: "Services" },
  { value: "OTHER", label: "Other" },
];

function SortTh({ label, col, sortColumn, sortDirection, onSort }) {
  return (
    <Table.Th className={classes["header-cell"]} onClick={() => onSort(col)}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        {label}
        {sortColumn === col ? (
          sortDirection === "asc" ? (
            <ArrowUp size={14} />
          ) : (
            <ArrowDown size={14} />
          )
        ) : (
          <ArrowsDownUp size={14} />
        )}
      </div>
    </Table.Th>
  );
}

SortTh.propTypes = {
  label: PropTypes.string.isRequired,
  col: PropTypes.string.isRequired,
  sortColumn: PropTypes.string,
  sortDirection: PropTypes.oneOf(["asc", "desc"]).isRequired,
  onSort: PropTypes.func.isRequired,
};

function ExpenditureTable({
  expenditures,
  onRefresh,
  projects = [],
  fixedProjectId = null,
}) {
  const {
    canApproveExpenditure,
    canRejectExpenditureByAmount,
    can,
  } = useRSPCRole();
  const [scrolled, setScrolled] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createErrors, setCreateErrors] = useState({});
  const [projectScope, setProjectScope] = useState(projects || []);
  const [form, setForm] = useState({
    project: fixedProjectId ? String(fixedProjectId) : "",
    expenditure_head: "",
    description: "",
    amount: "",
    date: "",
    last_date: "",
    voucher_number: "",
    remarks: "",
  });

  const canCreateExpenditure = can("add_expenditure");

  useEffect(() => {
    setProjectScope(projects || []);
  }, [projects]);

  useEffect(() => {
    if (!fixedProjectId) return;
    setForm((prev) => ({ ...prev, project: String(fixedProjectId) }));
  }, [fixedProjectId]);

  useEffect(() => {
    if ((projectScope || []).length > 0) return;

    let active = true;
    axios
      .get(fetchProjectsRoute)
      .then((response) => {
        if (!active) return;
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.results || [];
        setProjectScope(data);
      })
      .catch(() => {
        if (!active) return;
        setProjectScope([]);
      });

    return () => {
      active = false;
    };
  }, [projectScope.length]);

  const handleSort = (col) => {
    if (sortColumn === col)
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const sortData = (data) => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      const av =
        typeof a[sortColumn] === "string"
          ? a[sortColumn].toLowerCase()
          : a[sortColumn];
      const bv =
        typeof b[sortColumn] === "string"
          ? b[sortColumn].toLowerCase()
          : b[sortColumn];
      if (av == null) return 1;
      if (bv == null) return -1;
      return (
        (av < bv ? -1 : av > bv ? 1 : 0) * (sortDirection === "asc" ? 1 : -1)
      );
    });
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(approveExpenditureRoute(id));
      notifications.show({
        title: "Approved",
        message: "Expenditure approved",
        color: "green",
      });
      onRefresh?.();
    } catch {
      notifications.show({
        title: "Error",
        message: "Action failed",
        color: "red",
      });
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.post(rejectExpenditureRoute(id));
      notifications.show({
        title: "Rejected",
        message: "Expenditure rejected",
        color: "orange",
      });
      onRefresh?.();
    } catch {
      notifications.show({
        title: "Error",
        message: "Action failed",
        color: "red",
      });
    }
  };

  const handleCreate = async () => {
    setCreateErrors({});
    const selectedProject = fixedProjectId || form.project;

    if (!selectedProject || !form.expenditure_head || !form.description || !form.amount || !form.date) {
      notifications.show({
        title: "Validation",
        message: "Project, head, description, amount, and date are required.",
        color: "red",
      });
      return;
    }

    const numericAmount = Number(form.amount);
    if (!numericAmount || numericAmount <= 0) {
      setCreateErrors({ amount: "Amount must be greater than 0." });
      return;
    }

    const selectedProjectData = (projectScope || []).find(
      (p) => String(p.id) === String(selectedProject),
    );
    const projectStatus = String(selectedProjectData?.status || "").toUpperCase();
    if (["COMPLETED", "TERMINATED", "REJECTED"].includes(projectStatus)) {
      notifications.show({
        title: "Validation",
        message: "Expenditures cannot be added to closed projects.",
        color: "red",
      });
      return;
    }

    if (selectedProjectData?.start_date && form.date) {
      const projectStart = new Date(selectedProjectData.start_date);
      const expenditureDate = new Date(form.date);
      if (!Number.isNaN(projectStart.getTime()) && !Number.isNaN(expenditureDate.getTime()) && expenditureDate < projectStart) {
        setCreateErrors({
          date: "Expenditure date cannot be earlier than project start date.",
        });
        return;
      }
    }

    const sanctionedAmount = Number(selectedProjectData?.sanctioned_amount || 0);
    if (sanctionedAmount > 0) {
      const projectExpenditures = (expenditures || []).filter(
        (row) => String(row.project) === String(selectedProject),
      );

      const committedTotal = projectExpenditures.reduce((sum, row) => {
        if (String(row.status || "").toUpperCase() === "REJECTED") return sum;
        return sum + Number(row.amount || 0);
      }, 0);
      const proposedTotal = committedTotal + numericAmount;
      if (proposedTotal > sanctionedAmount) {
        const remainingBudget = Math.max(sanctionedAmount - committedTotal, 0);
        const remainingText = `Remaining budget is Rs ${remainingBudget.toLocaleString("en-IN")}.`;
        setCreateErrors({
          amount: `Expenditure exceeds sanctioned project budget. ${remainingText}`,
        });
        notifications.show({
          title: "Validation",
          message: `Expenditure exceeds sanctioned project budget. ${remainingText}`,
          color: "red",
        });
        return;
      }

      if (form.expenditure_head === "MANPOWER") {
        const manpowerTotal = projectExpenditures.reduce((sum, row) => {
          if (String(row.status || "").toUpperCase() === "REJECTED") return sum;
          if (String(row.expenditure_head || "").toUpperCase() !== "MANPOWER") return sum;
          return sum + Number(row.amount || 0);
        }, 0);
        const proposedManpower = manpowerTotal + numericAmount;
        const manpowerCap = sanctionedAmount * 0.6;
        if (proposedManpower > manpowerCap) {
          setCreateErrors({ amount: "Manpower expenditure cannot exceed 60% of sanctioned amount." });
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      await axios.post(fetchExpendituresRoute, {
        project: Number(selectedProject),
        expenditure_head: form.expenditure_head,
        description: form.description,
        amount: numericAmount,
        date: form.date,
        last_date: form.last_date || null,
        voucher_number: form.voucher_number || null,
        remarks: form.remarks || null,
      });

      notifications.show({
        title: "Created",
        message: "Expenditure request submitted successfully.",
        color: "green",
      });

      setCreateOpen(false);
      setForm({
        project: fixedProjectId ? String(fixedProjectId) : "",
        expenditure_head: "",
        description: "",
        amount: "",
        date: "",
        last_date: "",
        voucher_number: "",
        remarks: "",
      });
      onRefresh?.();
    } catch (e) {
      const data = e?.response?.data;
      let firstErrorMessage = "";
      if (data && typeof data === "object") {
        const mapped = {};
        Object.entries(data).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v.join(" ") : String(v);
        });
        setCreateErrors(mapped);
        firstErrorMessage = Object.values(mapped).find((v) => String(v || "").trim()) || "";
      }
      notifications.show({
        title: "Error",
        message:
          data?.error ||
          data?.detail ||
          firstErrorMessage ||
          "Failed to create expenditure.",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const projectOptions = (projectScope || []).map((p) => ({
    value: String(p.id),
    label: `${p.project_number || "-"} - ${p.title || "Untitled"}`,
  }));

  const rows = sortData(expenditures || []).map((row, i) => {
    const amount = parseFloat(row.amount) || 0;
    const showApprove =
      row.status === "PENDING" && canApproveExpenditure(amount);
    const showReject =
      row.status === "PENDING" && canRejectExpenditureByAmount(amount);

    return (
      <Table.Tr key={i}>
        <Table.Td className={classes["row-content"]}>
          <Badge
            color={badgeColor[row.status] || "gray"}
            size="md"
            style={{ minWidth: "80px", color: "#3f3f3f" }}
          >
            {row.status}
          </Badge>
        </Table.Td>
        <Table.Td className={classes["row-content"]}>
          {row.expenditure_head_display || row.expenditure_head}
        </Table.Td>
        <Table.Td className={classes["row-content"]}>
          {row.description}
        </Table.Td>
        <Table.Td className={classes["row-content"]}>
          ₹{Number(row.amount).toLocaleString("en-IN")}
        </Table.Td>
        <Table.Td className={classes["row-content"]}>
          {row.date ? new Date(row.date).toLocaleDateString() : "—"}
        </Table.Td>
        <Table.Td className={classes["row-content"]}>
          {showApprove || showReject ? (
            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
              {showApprove && (
                <Button
                  onClick={() => handleApprove(row.id)}
                  variant="outline"
                  color="green"
                  size="xs"
                  style={{ borderRadius: "8px" }}
                >
                  <ThumbsUp size={16} style={{ marginRight: 3 }} /> Approve
                </Button>
              )}
              {showReject && (
                <Button
                  onClick={() => handleReject(row.id)}
                  variant="outline"
                  color="red"
                  size="xs"
                  style={{ borderRadius: "8px" }}
                >
                  <ThumbsDown size={16} style={{ marginRight: 3 }} /> Reject
                </Button>
              )}
            </div>
          ) : row.status === "PENDING" ? (
            <Text size="xs" c="dimmed">
              Not in your tier
            </Text>
          ) : null}
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <>
      <Flex justify="flex-end" mb="sm">
        {canCreateExpenditure && (
          <Button color="#15ABFF" onClick={() => setCreateOpen(true)}>
            + Add Expenditure
          </Button>
        )}
      </Flex>

      <ScrollArea
        h={300}
        onScrollPositionChange={({ y }) => setScrolled(y !== 0)}
      >
        <Table highlightOnHover>
          <Table.Thead
            className={cx(classes.header, { [classes.scrolled]: scrolled })}
          >
            <Table.Tr>
              <SortTh
                label="Status"
                col="status"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortTh
                label="Head"
                col="expenditure_head"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortTh
                label="Description"
                col="description"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortTh
                label="Amount"
                col="amount"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortTh
                label="Date"
                col="date"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <Table.Th className={classes["header-cell"]}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(expenditures || []).length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" c="dimmed" py="sm">
                    No expenditures recorded
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <Modal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Expenditure"
        centered
      >
        <Grid>
          {!fixedProjectId && (
            <Grid.Col span={12}>
              <Select
                label="Project"
                data={projectOptions}
                searchable
                value={form.project}
                onChange={(v) => setForm((f) => ({ ...f, project: v || "" }))}
                error={createErrors.project}
                required
              />
            </Grid.Col>
          )}
          <Grid.Col span={12}>
            <Select
              label="Expenditure Head"
              data={EXPENDITURE_HEAD_OPTIONS}
              value={form.expenditure_head}
              onChange={(v) => setForm((f) => ({ ...f, expenditure_head: v || "" }))}
              error={createErrors.expenditure_head}
              required
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              error={createErrors.description}
              required
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              error={createErrors.amount}
              required
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              error={createErrors.date}
              required
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Last Date"
              type="date"
              value={form.last_date}
              onChange={(e) => setForm((f) => ({ ...f, last_date: e.target.value }))}
              error={createErrors.last_date}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Voucher Number"
              value={form.voucher_number}
              onChange={(e) => setForm((f) => ({ ...f, voucher_number: e.target.value }))}
              error={createErrors.voucher_number}
            />
          </Grid.Col>
        </Grid>

        <Flex justify="flex-end" gap="sm" mt="md">
          <Button variant="default" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button color="#15ABFF" onClick={handleCreate} loading={submitting}>
            Submit
          </Button>
        </Flex>
      </Modal>
    </>
  );
}
ExpenditureTable.propTypes = {
  expenditures: PropTypes.arrayOf(PropTypes.shape({})),
  onRefresh: PropTypes.func,
  projects: PropTypes.arrayOf(PropTypes.shape({})),
  fixedProjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
export default ExpenditureTable;

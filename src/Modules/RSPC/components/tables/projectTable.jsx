import PropTypes from "prop-types";
import cx from "clsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Badge, ScrollArea, Text, Group } from "@mantine/core";
import {
  ArrowsDownUp,
  ArrowUp,
  ArrowDown,
  CheckCircle,
} from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import classes from "../../styles/tableStyle.module.css";
import { badgeColor } from "../../helpers/badgeColours";
import DetailViewModal from "../modals/detailViewModal";
import { useRSPCRole } from "../../hooks/useRSPCRole";
import { vetProjectByHodRoute } from "../../../../routes/RSPCRoutes";

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

function ProjectTable({ projectsData, activeRole }) {
  const { role } = useRSPCRole();
  const [scrolled, setScrolled] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedProject, setSelectedProject] = useState(null);
  const [vettingId, setVettingId] = useState(null);
  const navigate = useNavigate();

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

  const getActionLabel = (status) => {
    if (activeRole === "Professor") {
      if (status === "SUBMITTED") return "Register";
      if (status === "ONGOING") return "Forms";
      if (status === "COMPLETED") return "Details";
      return "Details";
    }
    if (activeRole === "SectionHead_RSPC") {
      if (status === "REGISTERED") return "Commence";
      if (status === "ONGOING") return "Forms";
      if (status === "COMPLETED") return "Details";
      return "Details";
    }
    return "Details";
  };

  const handleAction = (row) => {
    const action = getActionLabel(row.status);
    if (action === "Forms" || action === "Register" || action === "Commence") {
      navigate("/research/forms", { state: { data: row } });
      return;
    }
    setSelectedProject(row);
  };

  // HOD: Vet project inline on the row
  const handleVet = async (projectId) => {
    setVettingId(projectId);
    try {
      await axios.post(vetProjectByHodRoute(projectId));
      notifications.show({
        title: "Vetted",
        message: "Project vetted successfully",
        color: "cyan",
      });
    } catch (e) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.error || "Vet action failed",
        color: "red",
      });
    } finally {
      setVettingId(null);
    }
  };

  const rows = sortData(projectsData || []).map((row, i) => {
    // HOD can vet projects that are in SUBMITTED state
    const canVet = role === "HOD" && row.status === "SUBMITTED";

    return (
      <Table.Tr key={row.id || i}>
        <Table.Td className={classes["row-content"]}>
          <Badge
            color={badgeColor[row.status] || "gray"}
            size="lg"
            style={{ minWidth: "120px", color: "#3f3f3f" }}
          >
            {row.status}
          </Badge>
        </Table.Td>
        <Table.Td
          className={classes["row-content"]}
          style={{ maxWidth: 260, textAlign: "left" }}
        >
          {row.title}
        </Table.Td>
        <Table.Td className={classes["row-content"]}>
          {row.project_number || "-"}
        </Table.Td>
        <Table.Td className={classes["row-content"]}>
          {row.pi_name || "-"}
        </Table.Td>
        <Table.Td className={classes["row-content"]}>
          {row.funding_agency_name || row.funding_agency || "-"}
        </Table.Td>
        <Table.Td className={classes["row-content"]}>
          {row.sanctioned_amount
            ? `INR ${Number(row.sanctioned_amount).toLocaleString("en-IN")}`
            : "-"}
        </Table.Td>
        <Table.Td className={classes["row-content"]}>
          {row.start_date ? new Date(row.start_date).toLocaleDateString() : "-"}
        </Table.Td>
        <Table.Td className={classes["row-content"]}>
          {row.original_end_date
            ? new Date(row.original_end_date).toLocaleDateString()
            : "-"}
        </Table.Td>
        <Table.Td className={classes["row-content"]}>
          <Group gap={6} wrap="nowrap" justify="center">
            {/* HOD: Vet button inline — their primary action */}
            {canVet && (
              <Button
                onClick={() => handleVet(row.id)}
                loading={vettingId === row.id}
                variant="filled"
                color="cyan"
                size="xs"
                style={{ borderRadius: "8px" }}
                leftSection={<CheckCircle size={14} />}
              >
                Vet
              </Button>
            )}
            {/* All other roles: standard Details/Forms action */}
            {role !== "HOD" && (
              <Button
                onClick={() => handleAction(row)}
                variant="outline"
                color="#15ABFF"
                size="xs"
                style={{ borderRadius: "8px" }}
              >
                {getActionLabel(row.status)}
              </Button>
            )}
            {/* HOD: non-SUBMITTED projects still get a Details view */}
            {role === "HOD" && !canVet && (
              <Button
                onClick={() => setSelectedProject(row)}
                variant="outline"
                color="gray"
                size="xs"
                style={{ borderRadius: "8px" }}
              >
                Details
              </Button>
            )}
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <>
      <ScrollArea
        h={420}
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
                label="Title"
                col="title"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortTh
                label="Project No."
                col="project_number"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortTh
                label="PI"
                col="pi_name"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortTh
                label="Funding Agency"
                col="funding_agency_name"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortTh
                label="Amount"
                col="sanctioned_amount"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortTh
                label="Start Date"
                col="start_date"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortTh
                label="End Date"
                col="original_end_date"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <Table.Th className={classes["header-cell"]}>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(projectsData || []).length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={9}>
                  <Text ta="center" c="dimmed" py="md">
                    No projects found
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <DetailViewModal
        opened={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        data={selectedProject}
        titleField="title"
        title="Project Details"
        fields={[
          { label: "Project Number", key: "project_number" },
          { label: "Principal Investigator", key: "pi_name" },
          { label: "Funding Agency", key: "funding_agency_name" },
          {
            label: "Sanctioned Amount",
            key: "sanctioned_amount",
            format: (value) =>
              value ? `INR ${Number(value).toLocaleString("en-IN")}` : "-",
          },
          {
            label: "Start Date",
            key: "start_date",
            format: (value) =>
              value ? new Date(value).toLocaleDateString() : "-",
          },
          {
            label: "End Date",
            key: "original_end_date",
            format: (value) =>
              value ? new Date(value).toLocaleDateString() : "-",
          },
          { label: "Status", key: "status" },
          { label: "Budget Utilization", key: "budget_utilization" },
        ]}
      />
    </>
  );
}

ProjectTable.propTypes = {
  projectsData: PropTypes.arrayOf(PropTypes.shape({})),
  activeRole: PropTypes.string,
};

export default ProjectTable;

import PropTypes from "prop-types";
import cx from "clsx";
import { useState } from "react";
import { Table, Button, Badge, ScrollArea, Text } from "@mantine/core";
import { ThumbsUp, ThumbsDown, ArrowsDownUp, ArrowUp, ArrowDown } from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import classes from "../../styles/tableStyle.module.css";
import { badgeColor } from "../../helpers/badgeColours";
import { approveExpenditureRoute, rejectExpenditureRoute } from "../../../../routes/RSPCRoutes/index";

function ExpenditureTable({ expenditures, onRefresh }) {
  const [scrolled, setScrolled] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (col) => {
    if (sortColumn === col) setSortDirection(d => d === "asc" ? "desc" : "asc");
    else { setSortColumn(col); setSortDirection("asc"); }
  };

  const sortData = (data) => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      const av = typeof a[sortColumn] === "string" ? a[sortColumn].toLowerCase() : a[sortColumn];
      const bv = typeof b[sortColumn] === "string" ? b[sortColumn].toLowerCase() : b[sortColumn];
      if (av == null) return 1; if (bv == null) return -1;
      return (av < bv ? -1 : av > bv ? 1 : 0) * (sortDirection === "asc" ? 1 : -1);
    });
  };

  const SortTh = ({ label, col }) => (
    <Table.Th className={classes["header-cell"]} onClick={() => handleSort(col)}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
        {label}
        {sortColumn === col
          ? sortDirection === "asc" ? <ArrowUp size={14}/> : <ArrowDown size={14}/>
          : <ArrowsDownUp size={14}/>}
      </div>
    </Table.Th>
  );

  const handleApprove = async (id) => {
    try {
      await axios.post(approveExpenditureRoute(id));
      notifications.show({ title:"Approved", message:"Expenditure approved", color:"green" });
      onRefresh();
    } catch { notifications.show({ title:"Error", message:"Action failed", color:"red" }); }
  };

  const handleReject = async (id) => {
    try {
      await axios.post(rejectExpenditureRoute(id));
      notifications.show({ title:"Rejected", message:"Expenditure rejected", color:"orange" });
      onRefresh();
    } catch { notifications.show({ title:"Error", message:"Action failed", color:"red" }); }
  };

  const rows = sortData(expenditures || []).map((row, i) => (
    <Table.Tr key={i}>
      <Table.Td className={classes["row-content"]}>
        <Badge color={badgeColor[row.status] || "gray"} size="md"
          style={{ minWidth:"80px", color:"#3f3f3f" }}>
          {row.status}
        </Badge>
      </Table.Td>
      <Table.Td className={classes["row-content"]}>{row.expenditure_head_display || row.expenditure_head}</Table.Td>
      <Table.Td className={classes["row-content"]}>{row.description}</Table.Td>
      <Table.Td className={classes["row-content"]}>₹{Number(row.amount).toLocaleString("en-IN")}</Table.Td>
      <Table.Td className={classes["row-content"]}>
        {row.date ? new Date(row.date).toLocaleDateString() : "—"}
      </Table.Td>
      <Table.Td className={classes["row-content"]}>
        {row.status === "PENDING" && (
          <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
            <Button onClick={() => handleApprove(row.id)} variant="outline"
              color="green" size="xs" style={{ borderRadius:"8px" }}>
              <ThumbsUp size={16} style={{ marginRight:3 }} /> Approve
            </Button>
            <Button onClick={() => handleReject(row.id)} variant="outline"
              color="red" size="xs" style={{ borderRadius:"8px" }}>
              <ThumbsDown size={16} style={{ marginRight:3 }} /> Reject
            </Button>
          </div>
        )}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <ScrollArea h={300} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
      <Table highlightOnHover>
        <Table.Thead className={cx(classes.header, { [classes.scrolled]: scrolled })}>
          <Table.Tr>
            <SortTh label="Status" col="status" />
            <SortTh label="Head" col="expenditure_head" />
            <SortTh label="Description" col="description" />
            <SortTh label="Amount" col="amount" />
            <SortTh label="Date" col="date" />
            <Table.Th className={classes["header-cell"]}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(expenditures || []).length === 0
            ? <Table.Tr><Table.Td colSpan={6}>
                <Text ta="center" c="dimmed" py="sm">No expenditures recorded</Text>
              </Table.Td></Table.Tr>
            : rows}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
ExpenditureTable.propTypes = {
  expenditures: PropTypes.array,
  onRefresh: PropTypes.func,
};
export default ExpenditureTable;

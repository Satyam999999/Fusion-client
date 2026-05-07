import PropTypes from "prop-types";
import cx from "clsx";
import { useState } from "react";
import { Table, Button, Badge, ScrollArea, Text } from "@mantine/core";
import { Eye, Trash, ArrowsDownUp, ArrowUp, ArrowDown } from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import classes from "../../styles/tableStyle.module.css";
import { badgeColor } from "../../helpers/badgeColours";
import { fetchConsultanciesRoute } from "../../../../routes/RSPCRoutes/index";
import ConfirmationModal from "../../helpers/confirmationModal";
import { useRSPCRole } from "../../hooks/useRSPCRole";

function ConsultancyTable({ consultancies, onView, onRefresh }) {
  const { role } = useRSPCRole();
  const [scrolled, setScrolled]           = useState(false);
  const [sortColumn, setSortColumn]       = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [deleteId, setDeleteId]           = useState(null);

  const canDelete = role === "RSPC_ADMIN";
  const canModerate = role === "RSPC_ADMIN";

  const handleSort = (col) => {
    if (sortColumn===col) setSortDirection(d=>d==="asc"?"desc":"asc");
    else { setSortColumn(col); setSortDirection("asc"); }
  };
  const sortData = (data) => {
    if(!sortColumn) return data;
    return [...data].sort((a,b)=>{
      const av=typeof a[sortColumn]==="string"?a[sortColumn].toLowerCase():a[sortColumn];
      const bv=typeof b[sortColumn]==="string"?b[sortColumn].toLowerCase():b[sortColumn];
      if(av==null)return 1; if(bv==null)return -1;
      return (av<bv?-1:av>bv?1:0)*(sortDirection==="asc"?1:-1);
    });
  };
  const SortTh=({label,col})=>(
    <Table.Th className={classes["header-cell"]} onClick={()=>handleSort(col)}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
        {label}
        {sortColumn===col?(sortDirection==="asc"?<ArrowUp size={14}/>:<ArrowDown size={14}/>):<ArrowsDownUp size={14}/>}
      </div>
    </Table.Th>
  );

  const handleDelete = async () => {
    try {
      await axios.delete(`${fetchConsultanciesRoute}${deleteId}/`);
      notifications.show({title:"Deleted",message:"Consultancy deleted",color:"orange"});
      setDeleteId(null);
      onRefresh && onRefresh();
    } catch { notifications.show({title:"Error",message:"Delete failed",color:"red"}); }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(`${fetchConsultanciesRoute}${id}/approve/`);
      notifications.show({ title: "Approved", message: "Consultancy approved", color: "green" });
      onRefresh && onRefresh();
    } catch (e) {
      const data = e?.response?.data;
      const detailMessage =
        data?.details && typeof data.details === "object"
          ? Object.entries(data.details)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(" ") : String(value)}`)
              .join("; ")
          : "";
      notifications.show({ title: "Error", message: detailMessage || data?.error || "Approval failed", color: "red" });
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.post(`${fetchConsultanciesRoute}${id}/reject/`);
      notifications.show({ title: "Rejected", message: "Consultancy rejected", color: "orange" });
      onRefresh && onRefresh();
    } catch (e) {
      const data = e?.response?.data;
      const detailMessage =
        data?.details && typeof data.details === "object"
          ? Object.entries(data.details)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(" ") : String(value)}`)
              .join("; ")
          : "";
      notifications.show({ title: "Error", message: detailMessage || data?.error || "Rejection failed", color: "red" });
    }
  };

  const terminalStatuses = ["APPROVED", "REJECTED", "CANCELLED", "COMPLETED"];

  const rows = sortData(consultancies||[]).map((row,i)=>(
    <Table.Tr key={i}>
      <Table.Td className={classes["row-content"]}>
        <Badge color={badgeColor[row.status]||"gray"} size="lg" style={{minWidth:"100px",color:"#3f3f3f"}}>{row.status_display || row.status}</Badge>
      </Table.Td>
      <Table.Td className={classes["row-content"]} style={{maxWidth:200,textAlign:"left"}}>{row.title}</Table.Td>
      <Table.Td className={classes["row-content"]}>{row.client_name}</Table.Td>
      <Table.Td className={classes["row-content"]}>{row.client_type||"—"}</Table.Td>
      <Table.Td className={classes["row-content"]}>₹{Number(row.contract_amount||0).toLocaleString("en-IN")}</Table.Td>
      <Table.Td className={classes["row-content"]}>{row.start_date?new Date(row.start_date).toLocaleDateString():"—"}</Table.Td>
      <Table.Td className={classes["row-content"]}>
        <div style={{display:"flex",gap:6,justifyContent:"center"}}>
          <Button onClick={()=>onView&&onView(row)} variant="outline" color="#15ABFF" size="xs" style={{borderRadius:"8px"}}>
            <Eye size={16} style={{margin:3}}/> View
          </Button>
          {canModerate && !terminalStatuses.includes(String(row.status || "").toUpperCase()) && (
            <>
              {["PROPOSED", "SUBMITTED", "NEGOTIATION"].includes(String(row.status || "").toUpperCase()) && (
                <Button onClick={()=>handleApprove(row.id)} variant="outline" color="green" size="xs" style={{borderRadius:"8px"}}>
                  Approve
                </Button>
              )}
              <Button onClick={()=>handleReject(row.id)} variant="outline" color="red" size="xs" style={{borderRadius:"8px"}}>
                Reject
              </Button>
            </>
          )}
          {canDelete && (
            <Button onClick={()=>setDeleteId(row.id)} variant="outline" color="red" size="xs" style={{borderRadius:"8px"}}>
              <Trash size={16} style={{margin:3}}/> Delete
            </Button>
          )}
        </div>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <ScrollArea h={350} onScrollPositionChange={({y})=>setScrolled(y!==0)}>
        <Table highlightOnHover>
          <Table.Thead className={cx(classes.header,{[classes.scrolled]:scrolled})}>
            <Table.Tr>
              <SortTh label="Status" col="status"/>
              <SortTh label="Title" col="title"/>
              <SortTh label="Client" col="client_name"/>
              <SortTh label="Client Type" col="client_type"/>
              <SortTh label="Amount" col="contract_amount"/>
              <SortTh label="Start Date" col="start_date"/>
              <Table.Th className={classes["header-cell"]}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(consultancies||[]).length===0
              ?<Table.Tr><Table.Td colSpan={7}><Text ta="center" c="dimmed" py="md">No consultancy projects found</Text></Table.Td></Table.Tr>
              :rows}
          </Table.Tbody>
        </Table>
      </ScrollArea>
      <ConfirmationModal opened={!!deleteId} onClose={()=>setDeleteId(null)}
        onConfirm={handleDelete} title="Delete Consultancy Project?"/>
    </>
  );
}
ConsultancyTable.propTypes={consultancies:PropTypes.array,onView:PropTypes.func,onRefresh:PropTypes.func};
export default ConsultancyTable;
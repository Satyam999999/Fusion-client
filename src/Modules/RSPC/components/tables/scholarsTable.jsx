import PropTypes from "prop-types";
import cx from "clsx";
import { useState } from "react";
import { Table, Button, Badge, ScrollArea, Text, Select } from "@mantine/core";
import { ArrowsDownUp, ArrowUp, ArrowDown, ArrowClockwise } from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import classes from "../../styles/tableStyle.module.css";
import { badgeColor } from "../../helpers/badgeColours";
import { updateScholarStatusRoute } from "../../../../routes/RSPCRoutes/index";

const PROGRESS_OPTIONS = [
  {value:"COURSEWORK",label:"Coursework"},{value:"COMPREHENSIVE_EXAM",label:"Comprehensive Exam"},
  {value:"SYNOPSIS_PHASE",label:"Synopsis Phase"},{value:"RESEARCH_PHASE",label:"Research Phase"},
  {value:"THESIS_WRITING",label:"Thesis Writing"},{value:"DEFENSE_READY",label:"Defense Ready"},
  {value:"DEFENDED",label:"Defended"},{value:"COMPLETED",label:"Completed"},
];

function ScholarsTable({ scholars, onRefresh }) {
  const [scrolled, setScrolled] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (col) => {
    if (sortColumn===col) setSortDirection(d=>d==="asc"?"desc":"asc");
    else { setSortColumn(col); setSortDirection("asc"); }
  };
  const sortData = (data) => {
    if(!sortColumn) return data;
    return [...data].sort((a,b)=>{
      const av=typeof a[sortColumn]==="string"?a[sortColumn].toLowerCase():a[sortColumn];
      const bv=typeof b[sortColumn]==="string"?b[sortColumn].toLowerCase():b[sortColumn];
      if(av==null) return 1; if(bv==null) return -1;
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

  const handleStatusUpdate = async (id, progress_status) => {
    try {
      await axios.post(updateScholarStatusRoute(id), { progress_status });
      notifications.show({title:"Updated",message:"Scholar status updated",color:"green"});
      onRefresh();
    } catch { notifications.show({title:"Error",message:"Update failed",color:"red"}); }
  };

  const rows = sortData(scholars||[]).map((row,i) => (
    <Table.Tr key={i}>
      <Table.Td className={classes["row-content"]}>
        <Badge color={badgeColor[row.progress_status]||"gray"} size="md"
          style={{minWidth:"110px",color:"#3f3f3f"}}>{row.progress_status}</Badge>
      </Table.Td>
      <Table.Td className={classes["row-content"]}>{row.student_name||row.student||"—"}</Table.Td>
      <Table.Td className={classes["row-content"]}>{row.fellowship_type||"—"}</Table.Td>
      <Table.Td className={classes["row-content"]}>
        {row.enrollment_date ? new Date(row.enrollment_date).toLocaleDateString() : "—"}
      </Table.Td>
      <Table.Td className={classes["row-content"]}>
        {row.expected_completion ? new Date(row.expected_completion).toLocaleDateString() : "—"}
      </Table.Td>
      <Table.Td className={classes["row-content"]}>
        <Select data={PROGRESS_OPTIONS} placeholder="Update stage" size="xs"
          value={null}
          onChange={(val)=>val&&handleStatusUpdate(row.id,val)}
          style={{width:160}}
          rightSection={<ArrowClockwise size={14}/>}
        />
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <ScrollArea h={350} onScrollPositionChange={({y})=>setScrolled(y!==0)}>
      <Table highlightOnHover>
        <Table.Thead className={cx(classes.header,{[classes.scrolled]:scrolled})}>
          <Table.Tr>
            <SortTh label="Stage" col="progress_status"/>
            <SortTh label="Scholar" col="student_name"/>
            <SortTh label="Fellowship" col="fellowship_type"/>
            <SortTh label="Enrolled" col="enrollment_date"/>
            <SortTh label="Expected Completion" col="expected_completion"/>
            <Table.Th className={classes["header-cell"]}>Update Stage</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(scholars||[]).length===0
            ?<Table.Tr><Table.Td colSpan={6}><Text ta="center" c="dimmed" py="md">No scholars found</Text></Table.Td></Table.Tr>
            :rows}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
ScholarsTable.propTypes = {scholars:PropTypes.array,onRefresh:PropTypes.func};
export default ScholarsTable;

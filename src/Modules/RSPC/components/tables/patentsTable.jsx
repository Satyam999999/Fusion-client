import PropTypes from "prop-types";
import cx from "clsx";
import { useState } from "react";
import { Table, Button, Badge, ScrollArea, Text, Select } from "@mantine/core";
import { Eye, ArrowClockwise, ArrowsDownUp, ArrowUp, ArrowDown } from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import classes from "../../styles/tableStyle.module.css";
import { badgeColor } from "../../helpers/badgeColours";
import { updatePatentStatusRoute } from "../../../../routes/RSPCRoutes/index";

const STATUS_OPTIONS = [
  {value:"FILED",label:"Filed"},{value:"PUBLISHED",label:"Published"},
  {value:"UNDER_EXAMINATION",label:"Under Examination"},{value:"GRANTED",label:"Granted"},
  {value:"REJECTED",label:"Rejected"},{value:"LAPSED",label:"Lapsed"},
];

function PatentsTable({ patents, onRefresh, onView }) {
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

  const SortTh = ({label,col}) => (
    <Table.Th className={classes["header-cell"]} onClick={()=>handleSort(col)}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
        {label}
        {sortColumn===col?(sortDirection==="asc"?<ArrowUp size={14}/>:<ArrowDown size={14}/>):<ArrowsDownUp size={14}/>}
      </div>
    </Table.Th>
  );

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.post(updatePatentStatusRoute(id), { status });
      notifications.show({ title:"Updated", message:"Patent status updated", color:"green" });
      onRefresh();
    } catch { notifications.show({ title:"Error", message:"Update failed", color:"red" }); }
  };

  const rows = sortData(patents||[]).map((row,i) => (
    <Table.Tr key={i}>
      <Table.Td className={classes["row-content"]}>
        <Badge color={badgeColor[row.status]||"gray"} size="lg"
          style={{minWidth:"120px",color:"#3f3f3f"}}>{row.status}</Badge>
      </Table.Td>
      <Table.Td className={classes["row-content"]} style={{maxWidth:220,textAlign:"left"}}>{row.title}</Table.Td>
      <Table.Td className={classes["row-content"]}>{row.application_number||"—"}</Table.Td>
      <Table.Td className={classes["row-content"]}>{row.patent_type}</Table.Td>
      <Table.Td className={classes["row-content"]}>{row.country}</Table.Td>
      <Table.Td className={classes["row-content"]}>
        {row.filing_date ? new Date(row.filing_date).toLocaleDateString() : "—"}
      </Table.Td>
      <Table.Td className={classes["row-content"]}>
        <div style={{display:"flex",gap:6,justifyContent:"center",alignItems:"center"}}>
          <Select data={STATUS_OPTIONS} placeholder="Update" size="xs"
            value={null}
            onChange={(val)=>val&&handleStatusUpdate(row.application_id,val)}
            style={{width:150}}
            rightSection={<ArrowClockwise size={14}/>}
          />
          <Button onClick={()=>onView&&onView(row)} variant="outline"
            color="#15ABFF" size="xs" style={{borderRadius:"8px"}}>
            <Eye size={16} style={{margin:3}}/> View
          </Button>
        </div>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <ScrollArea h={350} onScrollPositionChange={({y})=>setScrolled(y!==0)}>
      <Table highlightOnHover>
        <Table.Thead className={cx(classes.header,{[classes.scrolled]:scrolled})}>
          <Table.Tr>
            <SortTh label="Status" col="status"/>
            <SortTh label="Title" col="title"/>
            <SortTh label="Application No." col="application_number"/>
            <SortTh label="Type" col="patent_type"/>
            <SortTh label="Country" col="country"/>
            <SortTh label="Filing Date" col="filing_date"/>
            <Table.Th className={classes["header-cell"]}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(patents||[]).length===0
            ?<Table.Tr><Table.Td colSpan={7}><Text ta="center" c="dimmed" py="md">No patents found</Text></Table.Td></Table.Tr>
            :rows}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
PatentsTable.propTypes = {patents:PropTypes.array,onRefresh:PropTypes.func,onView:PropTypes.func};
export default PatentsTable;

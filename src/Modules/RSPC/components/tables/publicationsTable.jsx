import PropTypes from "prop-types";
import cx from "clsx";
import { useState } from "react";
import { Table, Button, Badge, ScrollArea, Text } from "@mantine/core";
import { Eye, CheckCircle, Trash, ArrowsDownUp, ArrowUp, ArrowDown } from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import classes from "../../styles/tableStyle.module.css";
import { verifyPublicationRoute, fetchPublicationsRoute } from "../../../../routes/RSPCRoutes/index";
import ConfirmationModal from "../../helpers/confirmationModal";

function PublicationsTable({ publications, onRefresh, onView }) {
  const [scrolled, setScrolled] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [deleteId, setDeleteId] = useState(null);

  const handleSort = (col) => {
    if (sortColumn===col) setSortDirection(d=>d==="asc"?"desc":"asc");
    else { setSortColumn(col); setSortDirection("asc"); }
  };
  const sortData = (data) => {
    if (!sortColumn) return data;
    return [...data].sort((a,b) => {
      const av=typeof a[sortColumn]==="string"?a[sortColumn].toLowerCase():a[sortColumn];
      const bv=typeof b[sortColumn]==="string"?b[sortColumn].toLowerCase():b[sortColumn];
      if(av==null)return 1; if(bv==null)return -1;
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

  const handleVerify = async (id) => {
    try {
      await axios.post(verifyPublicationRoute(id));
      notifications.show({title:"Verified",message:"Publication verified",color:"green"});
      onRefresh();
    } catch { notifications.show({title:"Error",message:"Action failed",color:"red"}); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${fetchPublicationsRoute}${deleteId}/`);
      notifications.show({title:"Deleted",message:"Publication deleted",color:"orange"});
      setDeleteId(null);
      onRefresh();
    } catch { notifications.show({title:"Error",message:"Delete failed",color:"red"}); }
  };

  const typeColors = {JOURNAL:"#15abff",CONFERENCE:"#50E3C2",BOOK:"#B8E986",PATENT:"#FFE082"};

  const rows = sortData(publications||[]).map((row,i) => (
    <Table.Tr key={i}>
      <Table.Td className={classes["row-content"]}>
        <Badge color={typeColors[row.publication_type]||"#E0E0E0"} size="md" style={{color:"#3f3f3f",minWidth:"80px"}}>{row.publication_type}</Badge>
      </Table.Td>
      <Table.Td className={classes["row-content"]} style={{maxWidth:240,textAlign:"left"}}>{row.title}</Table.Td>
      <Table.Td className={classes["row-content"]}>{row.journal_conference_name}</Table.Td>
      <Table.Td className={classes["row-content"]}>{row.year}</Table.Td>
      <Table.Td className={classes["row-content"]}>
        <Badge color={row.index_type==="SCI"||row.index_type==="SCIE"?"green":row.index_type==="SCOPUS"?"blue":"gray"} size="sm">{row.index_type}</Badge>
      </Table.Td>
      <Table.Td className={classes["row-content"]}>
        <Badge color={row.is_verified?"green":"gray"} size="sm">{row.is_verified?"Verified":"Unverified"}</Badge>
      </Table.Td>
      <Table.Td className={classes["row-content"]}>
        <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
          {!row.is_verified && (
            <Button onClick={()=>handleVerify(row.id)} variant="outline" color="#15ABFF" size="xs" style={{borderRadius:"8px"}}>
              <CheckCircle size={16} style={{marginRight:3}}/> Verify
            </Button>
          )}
          <Button onClick={()=>onView&&onView(row)} variant="outline" color="#15ABFF" size="xs" style={{borderRadius:"8px"}}>
            <Eye size={16} style={{margin:3}}/> View
          </Button>
          <Button onClick={()=>setDeleteId(row.id)} variant="outline" color="red" size="xs" style={{borderRadius:"8px"}}>
            <Trash size={16} style={{margin:3}}/> Delete
          </Button>
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
              <SortTh label="Type" col="publication_type"/>
              <SortTh label="Title" col="title"/>
              <SortTh label="Journal / Conference" col="journal_conference_name"/>
              <SortTh label="Year" col="year"/>
              <Table.Th className={classes["header-cell"]}>Index</Table.Th>
              <Table.Th className={classes["header-cell"]}>Status</Table.Th>
              <Table.Th className={classes["header-cell"]}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(publications||[]).length===0
              ?<Table.Tr><Table.Td colSpan={7}><Text ta="center" c="dimmed" py="md">No publications found</Text></Table.Td></Table.Tr>
              :rows}
          </Table.Tbody>
        </Table>
      </ScrollArea>
      <ConfirmationModal opened={!!deleteId} onClose={()=>setDeleteId(null)}
        onConfirm={handleDelete} title="Delete Publication?"/>
    </>
  );
}
PublicationsTable.propTypes = {publications:PropTypes.array,onRefresh:PropTypes.func,onView:PropTypes.func};
export default PublicationsTable;
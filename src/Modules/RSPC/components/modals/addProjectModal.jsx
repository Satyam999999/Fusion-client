import PropTypes from "prop-types";
import { useState } from "react";
import {
  Modal, Button, TextInput, Textarea, Select, Grid, Text, Alert
} from "@mantine/core";
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import { fetchProjectsRoute } from "../../../../routes/RSPCRoutes/index";
import classes from "../../styles/formStyle.module.css";

function AddProjectModal({ opened, onClose, fundingAgencies, onSuccess }) {
  const [form, setForm] = useState({
    title:"", project_number:"", description:"",
    sanctioned_amount:"", status:"PROPOSED",
    start_date:"", original_end_date:"",
  });
  const [agencyId, setAgencyId] = useState(null);
  const [loading, setLoading] = useState(false);

  const agencyOptions = (fundingAgencies||[]).map(a=>({value:String(a.id), label:a.name}));
  const statusOptions = [
    {value:"PROPOSED",label:"Proposed"},{value:"SUBMITTED",label:"Submitted"},
    {value:"APPROVED",label:"Approved"},{value:"SANCTIONED",label:"Sanctioned"},
    {value:"ONGOING",label:"Ongoing"},{value:"COMPLETED",label:"Completed"},
  ];

  const handleSubmit = async () => {
    if (!form.title || !form.project_number) {
      notifications.show({title:"Validation Error",message:"Title and Project Number are required",color:"red"});
      return;
    }
    setLoading(true);
    try {
      await axios.post(fetchProjectsRoute, { ...form, funding_agency: agencyId });
      notifications.show({title:"Success",message:"Project created successfully",color:"green"});
      onSuccess();
      onClose();
      setForm({title:"",project_number:"",description:"",sanctioned_amount:"",status:"PROPOSED",start_date:"",original_end_date:""});
    } catch(err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : "Failed to create project";
      notifications.show({title:"Error",message:msg,color:"red"});
    } finally { setLoading(false); }
  };

  return (
    <Modal opened={opened} onClose={onClose} size="lg"
      styles={{content:{borderLeft:"0.6rem solid #15ABFF"}}}
      title={<Text fw={700} size="lg" c="#15ABFF">New Project Proposal</Text>}
    >
      <Grid gutter="md">
        <Grid.Col span={12}>
          <TextInput label="Project Title" required placeholder="Enter project title"
            value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput label="Project Number" required placeholder="e.g. DST/2024/CS/001"
            value={form.project_number} onChange={e=>setForm(f=>({...f,project_number:e.target.value}))}/>
        </Grid.Col>
        <Grid.Col span={6}>
          <Select label="Status" data={statusOptions} value={form.status}
            onChange={v=>setForm(f=>({...f,status:v}))}/>
        </Grid.Col>
        <Grid.Col span={6}>
          <Select label="Funding Agency" data={agencyOptions} value={agencyId}
            onChange={setAgencyId} searchable placeholder="Select agency"/>
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput label="Sanctioned Amount (₹)" placeholder="e.g. 2500000"
            value={form.sanctioned_amount} onChange={e=>setForm(f=>({...f,sanctioned_amount:e.target.value}))}/>
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput label="Start Date" type="date" value={form.start_date}
            onChange={e=>setForm(f=>({...f,start_date:e.target.value}))}/>
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput label="End Date" type="date" value={form.original_end_date}
            onChange={e=>setForm(f=>({...f,original_end_date:e.target.value}))}/>
        </Grid.Col>
        <Grid.Col span={12}>
          <Textarea label="Description" placeholder="Project abstract / description"
            minRows={3} value={form.description}
            onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
        </Grid.Col>
      </Grid>
      <div style={{display:"flex",justifyContent:"flex-end",gap:12,marginTop:20}}>
        <Button variant="outline" color="#85B5D9" style={{borderRadius:8}} onClick={onClose}
          leftSection={<XCircle size={18}/>}>Cancel</Button>
        <Button color="#15ABFF" style={{borderRadius:8}} loading={loading}
          onClick={handleSubmit} leftSection={<CheckCircle size={18}/>}>Submit Proposal</Button>
      </div>
    </Modal>
  );
}
AddProjectModal.propTypes = {
  opened:PropTypes.bool.isRequired, onClose:PropTypes.func.isRequired,
  fundingAgencies:PropTypes.array, onSuccess:PropTypes.func.isRequired,
};
export default AddProjectModal;
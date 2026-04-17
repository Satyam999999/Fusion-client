import { useEffect, useState, useRef } from "react";
import { Tabs, Button, Flex, Text, Grid, TextInput, Textarea, Select,
         Paper, Divider, Badge, Loader, Center } from "@mantine/core";
import { CaretCircleLeft, CaretCircleRight, CheckCircle, Trash } from "@phosphor-icons/react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import RSPCBreadcrumbs from "./components/RSPCBreadcrumbs";
import ExpenditureTable from "./components/tables/expenditureTable";
import { badgeColor } from "./helpers/badgeColours";
import classes from "./styles/researchProjectsStyle.module.css";
import formClasses from "./styles/formStyle.module.css";
import FormAppendixPanel from "../../components/FormAppendixPanel";
import { fetchExpendituresRoute, fetchMilestonesRoute, updateProjectStatusRoute,
         fetchReportsRoute } from "../../routes/RSPCRoutes/index";

const STATUS_OPTIONS = [
  {value:"PROPOSED",label:"Proposed"},{value:"SUBMITTED",label:"Submitted"},
  {value:"UNDER_REVIEW",label:"Under Review"},{value:"SANCTIONED",label:"Sanctioned"},
  {value:"ONGOING",label:"Ongoing"},{value:"EXTENDED",label:"Extended"},
  {value:"COMPLETED",label:"Completed"},{value:"TERMINATED",label:"Terminated"},
];
const EXP_HEADS = [
  {value:"MANPOWER",label:"Manpower"},{value:"EQUIPMENT",label:"Equipment"},
  {value:"CONSUMABLES",label:"Consumables"},{value:"TRAVEL",label:"Travel"},
  {value:"PUBLICATIONS",label:"Publications"},{value:"OVERHEAD",label:"Overhead"},
  {value:"OTHER",label:"Other"},
];
const MILESTONE_STATUS = [
  {value:"PENDING",label:"Pending"},{value:"IN_PROGRESS",label:"In Progress"},
  {value:"COMPLETED",label:"Completed"},{value:"DELAYED",label:"Delayed"},
];
const REPORT_TYPES = [
  {value:"QUARTERLY",label:"Quarterly"},{value:"HALF_YEARLY",label:"Half Yearly"},
  {value:"ANNUAL",label:"Annual"},{value:"FINAL",label:"Final"},
  {value:"UTILIZATION",label:"Utilization Certificate"},
];

function RequestForms() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { data }  = location.state || {};
  const [activeTab, setActiveTab] = useState("0");
  const [expenditures, setExpenditures] = useState([]);
  const [milestones, setMilestones]     = useState([]);
  const [reports, setReports]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [newStatus, setNewStatus]       = useState(data?.status||"");
  const [expForm,  setExpForm]  = useState({expenditure_head:"EQUIPMENT",description:"",amount:"",date:""});
  const [milForm,  setMilForm]  = useState({title:"",description:"",due_date:"",status:"PENDING"});
  const [repForm,  setRepForm]  = useState({report_type:"QUARTERLY",period_from:"",period_to:"",summary:"",report_file:""});
  const tabsListRef = useRef(null);

  const reload = async () => {
    if (!data) return;
    setLoading(true);
    try {
      const [eR,mR,rR] = await Promise.all([
        axios.get(fetchExpendituresRoute, {params:{project:data.id}}),
        axios.get(fetchMilestonesRoute,   {params:{project:data.id}}),
        axios.get(fetchReportsRoute,      {params:{project:data.id}}),
      ]);
      setExpenditures(eR.data.results||eR.data);
      setMilestones(mR.data.results||mR.data);
      setReports(rR.data.results||rR.data);
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  };
  useEffect(() => { reload(); }, [data]);

  if (!data) return (
    <div style={{padding:"5%",textAlign:"center"}}>
      <Text c="dimmed">No project selected.</Text>
      <Button mt="md" color="#15ABFF" onClick={()=>navigate("/research")}>Back to Projects</Button>
    </div>
  );

  const handleStatusUpdate = async () => {
    try {
      await axios.post(updateProjectStatusRoute(data.id), {status:newStatus});
      notifications.show({title:"Updated",message:"Project status updated",color:"green"});
    } catch(e) { notifications.show({title:"Error",message:e.response?.data?.error||"Update failed",color:"red"}); }
  };

  const handleAddExpenditure = async () => {
    if (!expForm.amount||!expForm.date||!expForm.description) { notifications.show({title:"Validation",message:"All expenditure fields required",color:"red"}); return; }
    try {
      await axios.post(fetchExpendituresRoute, {...expForm, project:data.id});
      notifications.show({title:"Added",message:"Expenditure recorded",color:"green"});
      setExpForm({expenditure_head:"EQUIPMENT",description:"",amount:"",date:""});
      const r = await axios.get(fetchExpendituresRoute,{params:{project:data.id}});
      setExpenditures(r.data.results||r.data);
    } catch(e){ notifications.show({title:"Error",message:e.response?.data?.error||"Failed",color:"red"}); }
  };

  const handleAddMilestone = async () => {
    if (!milForm.title||!milForm.due_date) { notifications.show({title:"Validation",message:"Title and due date required",color:"red"}); return; }
    try {
      await axios.post(fetchMilestonesRoute, {...milForm, project:data.id});
      notifications.show({title:"Added",message:"Milestone added",color:"green"});
      setMilForm({title:"",description:"",due_date:"",status:"PENDING"});
      const r = await axios.get(fetchMilestonesRoute,{params:{project:data.id}});
      setMilestones(r.data.results||r.data);
    } catch(e){ notifications.show({title:"Error",message:"Failed to add milestone",color:"red"}); }
  };

  const handleAddReport = async () => {
    if (!repForm.period_from||!repForm.period_to||!repForm.summary) { notifications.show({title:"Validation",message:"Period dates and summary required",color:"red"}); return; }
    try {
      await axios.post(fetchReportsRoute, {...repForm, project:data.id, report_file:"N/A"});
      notifications.show({title:"Submitted",message:"Report submitted",color:"green"});
      setRepForm({report_type:"QUARTERLY",period_from:"",period_to:"",summary:"",report_file:""});
      const r = await axios.get(fetchReportsRoute,{params:{project:data.id}});
      setReports(r.data.results||r.data);
    } catch(e){ notifications.show({title:"Error",message:"Failed to submit report",color:"red"}); }
  };

  const tabItems = [
    {
      title: "Project Overview",
      component: (
        <Paper className={formClasses.formContainer}>
          <Text fw={700} size="lg" className={formClasses.formTitle}>Project Details</Text>
          <Grid gutter="md">
            {[
              ["Project Number",data.project_number],
              ["Status",null],
              ["Funding Agency",data.funding_agency_name||data.funding_agency],
              ["Sanctioned Amount",data.sanctioned_amount?`₹${Number(data.sanctioned_amount).toLocaleString("en-IN")}`:null],
              ["Start Date",data.start_date?new Date(data.start_date).toLocaleDateString():null],
              ["End Date",data.original_end_date?new Date(data.original_end_date).toLocaleDateString():null],
            ].map(([label,val],i) => (
              <Grid.Col span={6} key={i}>
                <Text size="sm" c="dimmed">{label}</Text>
                {label==="Status"
                  ? <Badge color={badgeColor[data.status]||"gray"} size="lg" style={{color:"#3f3f3f"}}>{data.status}</Badge>
                  : <Text fw={500}>{val||"—"}</Text>}
              </Grid.Col>
            ))}
            <Grid.Col span={12}><Text size="sm" c="dimmed">Description</Text><Text>{data.description}</Text></Grid.Col>
          </Grid>
        </Paper>
      ),
    },
    {
      title: "Update Status",
      component: (
        <Paper className={formClasses.formContainer}>
          <Text fw={700} size="lg" className={formClasses.formTitle}>Update Project Status</Text>
          <Grid gutter="md" style={{maxWidth:500,margin:"0 auto"}}>
            <Grid.Col span={12}>
              <Select label="New Status" data={STATUS_OPTIONS} value={newStatus} onChange={setNewStatus}/>
            </Grid.Col>
            <Grid.Col span={12}>
              <div className={formClasses.submitButtonContainer}>
                <Button color="#15ABFF" style={{borderRadius:8}} onClick={handleStatusUpdate}
                  leftSection={<CheckCircle size={18}/>}>Update Status</Button>
              </div>
            </Grid.Col>
          </Grid>
        </Paper>
      ),
    },
    {
      title: "Expenditures",
      component: loading ? <Center py="xl"><Loader/></Center> : (
        <Paper className={formClasses.formContainer}>
          <Text fw={700} size="lg" className={formClasses.formTitle}>Project Expenditures</Text>
          <ExpenditureTable expenditures={expenditures} onRefresh={reload}/>
          <Divider my="lg" label="Add New Expenditure" labelPosition="center"/>
          <Grid gutter="md">
            <Grid.Col span={6}><Select label="Expenditure Head" data={EXP_HEADS} value={expForm.expenditure_head} onChange={v=>setExpForm(f=>({...f,expenditure_head:v}))} required/></Grid.Col>
            <Grid.Col span={6}><TextInput label="Amount (₹)" type="number" value={expForm.amount} onChange={e=>setExpForm(f=>({...f,amount:e.target.value}))} required/></Grid.Col>
            <Grid.Col span={6}><TextInput label="Date" type="date" value={expForm.date} onChange={e=>setExpForm(f=>({...f,date:e.target.value}))} required/></Grid.Col>
            <Grid.Col span={6}><TextInput label="Description" value={expForm.description} onChange={e=>setExpForm(f=>({...f,description:e.target.value}))} required/></Grid.Col>
            <Grid.Col span={12}><div className={formClasses.submitButtonContainer}><Button color="green" style={{borderRadius:8}} onClick={handleAddExpenditure}>+ Add Expenditure</Button></div></Grid.Col>
          </Grid>
        </Paper>
      ),
    },
    {
      title: "Milestones",
      component: loading ? <Center py="xl"><Loader/></Center> : (
        <Paper className={formClasses.formContainer}>
          <Text fw={700} size="lg" className={formClasses.formTitle}>Project Milestones</Text>
          {milestones.length === 0
            ? <Text ta="center" c="dimmed" mb="md">No milestones recorded.</Text>
            : milestones.map((m,i) => (
              <Paper key={i} p="sm" mb="sm" withBorder style={{borderLeft:"3px solid #15ABFF"}}>
                <Flex justify="space-between" align="center">
                  <Text fw={600}>{m.title}</Text>
                  <Badge color={badgeColor[m.status]||"gray"} size="sm">{m.status}</Badge>
                </Flex>
                <Text size="sm" c="dimmed">Due: {m.due_date?new Date(m.due_date).toLocaleDateString():"—"}</Text>
                {m.description && <Text size="sm" mt={4}>{m.description}</Text>}
              </Paper>
            ))}
          <Divider my="lg" label="Add New Milestone" labelPosition="center"/>
          <Grid gutter="md">
            <Grid.Col span={8}><TextInput label="Milestone Title" required value={milForm.title} onChange={e=>setMilForm(f=>({...f,title:e.target.value}))}/></Grid.Col>
            <Grid.Col span={4}><Select label="Status" data={MILESTONE_STATUS} value={milForm.status} onChange={v=>setMilForm(f=>({...f,status:v}))}/></Grid.Col>
            <Grid.Col span={6}><TextInput label="Due Date" type="date" required value={milForm.due_date} onChange={e=>setMilForm(f=>({...f,due_date:e.target.value}))}/></Grid.Col>
            <Grid.Col span={6}><TextInput label="Description" value={milForm.description} onChange={e=>setMilForm(f=>({...f,description:e.target.value}))}/></Grid.Col>
            <Grid.Col span={12}><div className={formClasses.submitButtonContainer}><Button color="green" style={{borderRadius:8}} onClick={handleAddMilestone}>+ Add Milestone</Button></div></Grid.Col>
          </Grid>
        </Paper>
      ),
    },
    {
      title: "Reports",
      component: loading ? <Center py="xl"><Loader/></Center> : (
        <Paper className={formClasses.formContainer}>
          <Text fw={700} size="lg" className={formClasses.formTitle}>Project Reports</Text>
          {reports.length === 0
            ? <Text ta="center" c="dimmed" mb="md">No reports submitted.</Text>
            : reports.map((r,i) => (
              <Paper key={i} p="sm" mb="sm" withBorder style={{borderLeft:"3px solid #50E3C2"}}>
                <Flex justify="space-between" align="center">
                  <Text fw={600}>{r.report_type} Report</Text>
                  <Badge color={badgeColor[r.status]||"gray"} size="sm">{r.status}</Badge>
                </Flex>
                <Text size="sm" c="dimmed">Period: {r.period_from} → {r.period_to}</Text>
                <Text size="sm" mt={4}>{r.summary}</Text>
              </Paper>
            ))}
          <Divider my="lg" label="Submit New Report" labelPosition="center"/>
          <Grid gutter="md">
            <Grid.Col span={4}><Select label="Report Type" data={REPORT_TYPES} value={repForm.report_type} onChange={v=>setRepForm(f=>({...f,report_type:v}))}/></Grid.Col>
            <Grid.Col span={4}><TextInput label="Period From" type="date" value={repForm.period_from} onChange={e=>setRepForm(f=>({...f,period_from:e.target.value}))} required/></Grid.Col>
            <Grid.Col span={4}><TextInput label="Period To" type="date" value={repForm.period_to} onChange={e=>setRepForm(f=>({...f,period_to:e.target.value}))} required/></Grid.Col>
            <Grid.Col span={12}><Textarea label="Summary" minRows={3} value={repForm.summary} onChange={e=>setRepForm(f=>({...f,summary:e.target.value}))} required/></Grid.Col>
            <Grid.Col span={12}><div className={formClasses.submitButtonContainer}><Button color="green" style={{borderRadius:8}} onClick={handleAddReport}>+ Submit Report</Button></div></Grid.Col>
          </Grid>
        </Paper>
      ),
    },
    {
      title: "Form Appendix",
      component: (
        <div style={{ padding: "3% 5%" }}>
          <FormAppendixPanel module="research" />
        </div>
      ),
    },
  ];

  const handleTabNav = (dir) => {
    const n = dir==="next"?Math.min(+activeTab+1,tabItems.length-1):Math.max(+activeTab-1,0);
    setActiveTab(String(n));
    tabsListRef.current?.scrollBy({left:dir==="next"?50:-50,behavior:"smooth"});
  };

  return (
    <>
      <RSPCBreadcrumbs projectTitle={data.title||data.project_number}/>
      <Flex justify="space-between" align="center" mt="lg">
        <Flex align="center">
          <Button onClick={()=>handleTabNav("prev")} variant="subtle" p={0} mr={4} color="#15ABFF" disabled={+activeTab===0}><CaretCircleLeft size={28}/></Button>
          <div className={classes.fusionTabsContainer} ref={tabsListRef}>
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List style={{flexWrap:"nowrap"}}>
                {tabItems.map((item,i)=>(
                  <Tabs.Tab key={i} value={String(i)} className={activeTab===String(i)?classes.fusionActiveRecentTab:""}>
                    <Text className={classes.fusionText}>{item.title}</Text>
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>
          </div>
          <Button onClick={()=>handleTabNav("next")} variant="subtle" p={0} ml={4} color="#15ABFF" disabled={+activeTab===tabItems.length-1}><CaretCircleRight size={28}/></Button>
        </Flex>
      </Flex>
      <div style={{marginTop:16}}>{tabItems[+activeTab]?.component}</div>
    </>
  );
}
export default RequestForms;
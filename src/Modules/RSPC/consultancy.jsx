import { useEffect, useState, useRef } from "react";
import { Tabs, Button, Flex, Text, Paper, Grid, TextInput, Textarea,
         Select, Title, Loader, Center } from "@mantine/core";
import { CaretCircleLeft, CaretCircleRight, CheckCircle } from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import RSPCBreadcrumbs from "./components/RSPCBreadcrumbs";
import ConsultancyTable from "./components/tables/consultancyTable";
import DetailViewModal from "./components/modals/detailViewModal";
import classes from "./styles/researchProjectsStyle.module.css";
import formClasses from "./styles/formStyle.module.css";
import { fetchConsultanciesRoute } from "../../routes/RSPCRoutes/index";

const CLIENT_TYPES = [
  {value:"INDUSTRY",label:"Industry"},{value:"GOVERNMENT",label:"Government"},
  {value:"NGO",label:"NGO"},{value:"ACADEMIC",label:"Academic"},
  {value:"INDIVIDUAL",label:"Individual"},{value:"OTHER",label:"Other"},
];
const STATUS_OPTIONS = [
  {value:"PROPOSED",label:"Proposed"},{value:"NEGOTIATION",label:"Under Negotiation"},
  {value:"APPROVED",label:"Approved"},{value:"ONGOING",label:"Ongoing"},
  {value:"COMPLETED",label:"Completed"},
];

function Consultancy() {
  const [consultancies, setConsultancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("0");
  const [viewData, setViewData] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [form, setForm] = useState({
    title:"", client_name:"", client_type:"INDUSTRY", client_email:"",
    contract_amount:"", start_date:"", status:"PROPOSED", description:"",
  });
  const tabsListRef = useRef(null);

  const loadConsultancies = async () => {
    setLoading(true);
    try {
      const res = await axios.get(fetchConsultanciesRoute);
      setConsultancies(res.data.results || res.data);
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  };
  useEffect(() => { loadConsultancies(); }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.client_name || !form.start_date) {
      notifications.show({title:"Validation",message:"Title, client name, and start date are required",color:"red"});
      return;
    }
    try {
      await axios.post(fetchConsultanciesRoute, form);
      notifications.show({title:"Created",message:"Consultancy project created",color:"green"});
      loadConsultancies();
      setActiveTab("0");
    } catch(e) {
      notifications.show({title:"Error",message:"Failed to create consultancy",color:"red"});
    }
  };

  const tabItems = [
    {
      title: "All Consultancies",
      component: loading ? <Center py="xl"><Loader size="lg"/></Center> :
        <ConsultancyTable consultancies={consultancies} onRefresh={loadConsultancies}
          onView={(row)=>{setViewData(row);setViewOpen(true);}}/>,
    },
    {
      title: "New Consultancy",
      component: (
        <Paper className={formClasses.formContainer}>
          <Title order={4} className={formClasses.formTitle}>New Consultancy Project</Title>
          <Grid gutter="md">
            <Grid.Col span={12}>
              <TextInput label="Project Title" required value={form.title}
                onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="Client Name" required value={form.client_name}
                onChange={e=>setForm(f=>({...f,client_name:e.target.value}))}/>
            </Grid.Col>
            <Grid.Col span={6}>
              <Select label="Client Type" data={CLIENT_TYPES} value={form.client_type}
                onChange={v=>setForm(f=>({...f,client_type:v}))}/>
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="Client Email" type="email" value={form.client_email}
                onChange={e=>setForm(f=>({...f,client_email:e.target.value}))}/>
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="Contract Amount (₹)" type="number" value={form.contract_amount}
                onChange={e=>setForm(f=>({...f,contract_amount:e.target.value}))}/>
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="Start Date" type="date" required value={form.start_date}
                onChange={e=>setForm(f=>({...f,start_date:e.target.value}))}/>
            </Grid.Col>
            <Grid.Col span={6}>
              <Select label="Status" data={STATUS_OPTIONS} value={form.status}
                onChange={v=>setForm(f=>({...f,status:v}))}/>
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea label="Description" minRows={3} value={form.description}
                onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
            </Grid.Col>
          </Grid>
          <div className={formClasses.submitButtonContainer}>
            <Button color="#15ABFF" style={{borderRadius:8}} onClick={handleSubmit}
              leftSection={<CheckCircle size={18}/>}>Create Consultancy</Button>
          </div>
        </Paper>
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
      <RSPCBreadcrumbs projectTitle="Consultancy"/>
      <Flex justify="flex-start" align="center" mt="lg">
        <Button onClick={()=>handleTabNav("prev")} variant="subtle" p={0} mr={4}
          color="#15ABFF" disabled={+activeTab===0}><CaretCircleLeft size={28}/></Button>
        <div className={classes.fusionTabsContainer} ref={tabsListRef}>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List style={{flexWrap:"nowrap"}}>
              {tabItems.map((item,i)=>(
                <Tabs.Tab key={i} value={String(i)}
                  className={activeTab===String(i)?classes.fusionActiveRecentTab:""}>
                  <Text className={classes.fusionText}>{item.title}</Text>
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        </div>
        <Button onClick={()=>handleTabNav("next")} variant="subtle" p={0} ml={4}
          color="#15ABFF" disabled={+activeTab===tabItems.length-1}><CaretCircleRight size={28}/></Button>
      </Flex>
      <div style={{marginTop:16}}>{tabItems[+activeTab]?.component}</div>
      <DetailViewModal opened={viewOpen} onClose={()=>setViewOpen(false)}
        data={viewData} titleField="title"
        fields={[
          {label:"Client",key:"client_name"},{label:"Client Type",key:"client_type"},
          {label:"Status",key:"status"},
          {label:"Contract Amount",key:"contract_amount",format:v=>v?`₹${Number(v).toLocaleString("en-IN")}`:null},
          {label:"Start Date",key:"start_date",format:v=>v?new Date(v).toLocaleDateString():null},
          {label:"End Date",key:"end_date",format:v=>v?new Date(v).toLocaleDateString():null},
          {label:"Description",key:"description"},
        ]}
      />
    </>
  );
}
export default Consultancy;

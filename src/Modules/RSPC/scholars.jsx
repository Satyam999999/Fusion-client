import { useEffect, useState, useRef } from "react";
import { Tabs, Button, Flex, Text, Paper, Grid, TextInput,
         Select, Title, Loader, Center, Badge } from "@mantine/core";
import { CaretCircleLeft, CaretCircleRight, CheckCircle } from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import RSPCBreadcrumbs from "./components/RSPCBreadcrumbs";
import ScholarsTable from "./components/tables/scholarsTable";
import classes from "./styles/researchProjectsStyle.module.css";
import formClasses from "./styles/formStyle.module.css";
import { fetchScholarsRoute } from "../../routes/RSPCRoutes/index";
import { badgeColor } from "./helpers/badgeColours";

const FELLOWSHIP_TYPES = [
  {value:"GATE",label:"GATE"},{value:"NET",label:"NET"},{value:"CSIR",label:"CSIR"},
  {value:"DBT",label:"DBT"},{value:"INSTITUTE",label:"Institute"},
  {value:"SPONSORED",label:"Sponsored"},{value:"SELF_FUNDED",label:"Self Funded"},
  {value:"OTHER",label:"Other"},
];

function Scholars() {
  const [scholars, setScholars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("0");
  const [form, setForm] = useState({
    enrollment_date:"", expected_completion:"",
    fellowship_type:"GATE", fellowship_amount:"",
  });
  const tabsListRef = useRef(null);

  const loadScholars = async () => {
    setLoading(true);
    try {
      const res = await axios.get(fetchScholarsRoute);
      setScholars(res.data.results || res.data);
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  };
  useEffect(() => { loadScholars(); }, []);

  const progressCounts = scholars.reduce((acc, s) => {
    acc[s.progress_status] = (acc[s.progress_status]||0)+1; return acc;
  }, {});

  const handleSubmit = async () => {
    if (!form.enrollment_date) {
      notifications.show({title:"Validation",message:"Enrollment date required",color:"red"});
      return;
    }
    try {
      await axios.post(fetchScholarsRoute, form);
      notifications.show({title:"Registered",message:"Scholar registered successfully",color:"green"});
      loadScholars();
      setActiveTab("0");
    } catch(e) {
      notifications.show({title:"Error",message:"Failed to register scholar",color:"red"});
    }
  };

  const tabItems = [
    {
      title: "All Scholars",
      component: loading ? <Center py="xl"><Loader size="lg"/></Center> :
        <ScholarsTable scholars={scholars} onRefresh={loadScholars}/>,
    },
    {
      title: "Progress Summary",
      component: (
        <Paper className={formClasses.formContainer}>
          <Title order={4} className={formClasses.formTitle}>Scholar Progress Overview</Title>
          <Flex wrap="wrap" gap="sm" justify="center">
            {Object.entries(progressCounts).map(([status,count]) => (
              <Paper key={status} p="md" withBorder style={{minWidth:160,textAlign:"center"}}>
                <Badge color={badgeColor[status]||"gray"} size="xl" style={{color:"#3f3f3f"}}
                  mb={8}>{status}</Badge>
                <Text size="xl" fw={700}>{count}</Text>
                <Text size="xs" c="dimmed">scholars</Text>
              </Paper>
            ))}
            {scholars.length===0 && <Text c="dimmed">No scholars found</Text>}
          </Flex>
        </Paper>
      ),
    },
    {
      title: "Register Scholar",
      component: (
        <Paper className={formClasses.formContainer}>
          <Title order={4} className={formClasses.formTitle}>Register Research Scholar</Title>
          <Grid gutter="md">
            <Grid.Col span={6}>
              <TextInput label="Enrollment Date" type="date" required
                value={form.enrollment_date}
                onChange={e=>setForm(f=>({...f,enrollment_date:e.target.value}))}/>
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="Expected Completion" type="date"
                value={form.expected_completion}
                onChange={e=>setForm(f=>({...f,expected_completion:e.target.value}))}/>
            </Grid.Col>
            <Grid.Col span={6}>
              <Select label="Fellowship Type" data={FELLOWSHIP_TYPES}
                value={form.fellowship_type}
                onChange={v=>setForm(f=>({...f,fellowship_type:v}))}/>
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="Fellowship Amount (₹/month)" type="number"
                value={form.fellowship_amount}
                onChange={e=>setForm(f=>({...f,fellowship_amount:e.target.value}))}/>
            </Grid.Col>
          </Grid>
          <div className={formClasses.submitButtonContainer}>
            <Button color="#15ABFF" style={{borderRadius:8}} onClick={handleSubmit}
              leftSection={<CheckCircle size={18}/>}>Register Scholar</Button>
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
      <RSPCBreadcrumbs projectTitle="Research Scholars"/>
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
    </>
  );
}
export default Scholars;

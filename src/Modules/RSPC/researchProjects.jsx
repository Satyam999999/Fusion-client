import { useEffect, useState, useRef } from "react";
import { Tabs, Button, Flex, Text, Loader, Center, Select, Paper, Grid, Badge } from "@mantine/core";
import { CaretCircleLeft, CaretCircleRight, SortAscending } from "@phosphor-icons/react";
import axios from "axios";
import PropTypes from "prop-types";
import classes from "./styles/researchProjectsStyle.module.css";
import RSPCBreadcrumbs from "./components/RSPCBreadcrumbs";
import ProjectTable from "./components/tables/projectTable";
import AddProjectModal from "./components/modals/addProjectModal";
import ExpenditureTable from "./components/tables/expenditureTable";
import FormAppendixPanel from "../../components/FormAppendixPanel";
import { fetchProjectsRoute, fetchFundingAgenciesRoute, fetchExpendituresRoute,
         fetchPublicationsRoute, fetchPatentsRoute } from "../../routes/RSPCRoutes/index";
import { badgeColor } from "./helpers/badgeColours";

const CATEGORIES = ["Most Recent", "Ongoing", "Completed", "Terminated"];

function StatCard({ label, value, color }) {
  return (
    <Paper p="md" withBorder style={{ borderLeft: `4px solid ${color||"#15ABFF"}`, borderRadius: 8 }}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
      <Text size="xl" fw={700} mt={4}>{value}</Text>
    </Paper>
  );
}

function ResearchProjects({ activeRole }) {
  const [projectsData, setProjectsData] = useState([]);
  const [fundingAgencies, setFundingAgencies] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [publications, setPublications] = useState([]);
  const [patents, setPatents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("0");
  const [sortedBy, setSortedBy] = useState("Most Recent");
  const [addModalOpened, setAddModalOpened] = useState(false);
  const tabsListRef = useRef(null);

  const visibleProjects = activeRole === "Professor"
    ? projectsData.filter((project) => (project.pi_name || "").trim().toLowerCase() === "dr. arun kumar")
    : projectsData;

  const loadProjects   = async () => { setLoading(true); try { const r = await axios.get(fetchProjectsRoute); setProjectsData(r.data.results||r.data); } catch(e){console.error(e);} finally{setLoading(false);} };
  const loadAgencies   = async () => { try { const r = await axios.get(fetchFundingAgenciesRoute); setFundingAgencies(r.data.results||r.data); } catch(e){console.error(e);} };
  const loadExpend     = async () => { try { const r = await axios.get(fetchExpendituresRoute); setExpenditures(r.data.results||r.data); } catch(e){console.error(e);} };
  const loadPubs       = async () => { try { const r = await axios.get(fetchPublicationsRoute); setPublications(r.data.results||r.data); } catch(e){console.error(e);} };
  const loadPatents    = async () => { try { const r = await axios.get(fetchPatentsRoute); setPatents(r.data.results||r.data); } catch(e){console.error(e);} };

  useEffect(() => { loadProjects(); loadAgencies(); loadExpend(); loadPubs(); loadPatents(); }, []);
  useEffect(() => {
    const roleAwareTabsCount = activeRole === "Professor" ? 5 : 4;
    if (+activeTab > roleAwareTabsCount - 1) setActiveTab("0");
  }, [activeRole, activeTab]);

  const filterProjects = () => {
    if (sortedBy === "Ongoing")    return visibleProjects.filter(p => p.status === "ONGOING");
    if (sortedBy === "Completed")  return visibleProjects.filter(p => p.status === "COMPLETED");
    if (sortedBy === "Terminated") return visibleProjects.filter(p => p.status === "TERMINATED");
    return [...visibleProjects].sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
  };

  const totalFunding = visibleProjects.reduce((s,p) => s + parseFloat(p.sanctioned_amount||0), 0);
  const statusCounts = visibleProjects.reduce((acc,p) => { acc[p.status]=(acc[p.status]||0)+1; return acc; }, {});

  const handleTabChange = (dir) => {
    const n = dir==="next" ? Math.min(+activeTab+1,tabItems.length-1) : Math.max(+activeTab-1,0);
    setActiveTab(String(n));
    tabsListRef.current?.scrollBy({left:dir==="next"?50:-50,behavior:"smooth"});
  };

  const tabItems = [
    {
      title: "Dashboard",
      component: (
        <div style={{padding:"3% 5%"}}>
          <Grid gutter="md" mb="xl">
            <Grid.Col span={3}><StatCard label="Total Projects" value={visibleProjects.length} color="#15ABFF"/></Grid.Col>
            <Grid.Col span={3}><StatCard label="Ongoing" value={statusCounts["ONGOING"]||0} color="#50E3C2"/></Grid.Col>
            <Grid.Col span={3}><StatCard label="Publications" value={publications.length} color="#B8E986"/></Grid.Col>
            <Grid.Col span={3}><StatCard label="Patents" value={patents.length} color="#FFE082"/></Grid.Col>
            <Grid.Col span={6}><StatCard label="Total Sanctioned Funding" value={`₹${totalFunding.toLocaleString("en-IN")}`} color="#15ABFF"/></Grid.Col>
            <Grid.Col span={6}><StatCard label="Total Expenditures Recorded" value={expenditures.length} color="#EF9A9A"/></Grid.Col>
          </Grid>
          <Text fw={600} mb="sm">Projects by Status</Text>
          <Flex gap="sm" wrap="wrap">
            {Object.entries(statusCounts).map(([st,count]) => (
              <Paper key={st} p="sm" withBorder style={{minWidth:120,textAlign:"center"}}>
                <Badge color={badgeColor[st]||"gray"} size="lg" style={{color:"#3f3f3f"}} mb={6}>{st}</Badge>
                <Text size="xl" fw={700}>{count}</Text>
              </Paper>
            ))}
          </Flex>
        </div>
      ),
    },
    {
      title: "Projects",
      component: loading
        ? <Center py="xl"><Loader size="lg"/></Center>
        : <ProjectTable projectsData={filterProjects()} activeRole={activeRole}/>,
    },
    {
      title: "Expenditures",
      component: <ExpenditureTable expenditures={expenditures} onRefresh={loadExpend}/>,
    },
  ];

  if (activeRole === "Professor") {
    tabItems.push({
      title: "New Project Proposal",
      component: (
        <div style={{padding:"3% 5%"}}>
          <Text c="dimmed" mb="md">Submit a new sponsored project proposal.</Text>
          <Button color="#15ABFF" style={{borderRadius:8}} onClick={() => setAddModalOpened(true)}>
            + New Project Proposal
          </Button>
        </div>
      ),
    });
  }

  tabItems.push({
    title: "Form Appendix",
    component: (
      <div style={{ padding: "3% 5%" }}>
        <FormAppendixPanel module="research" />
      </div>
    ),
  });

  return (
    <>
      <RSPCBreadcrumbs />
      <Flex justify="space-between" align="center" mt="lg">
        <Flex justify="flex-start" align="center">
          <Button onClick={()=>handleTabChange("prev")} variant="subtle" p={0} mr={4} color="#15ABFF" disabled={+activeTab===0}>
            <CaretCircleLeft size={28}/>
          </Button>
          <div className={classes.fusionTabsContainer} ref={tabsListRef}>
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List style={{flexWrap:"nowrap"}}>
                {tabItems.map((item,i) => (
                  <Tabs.Tab key={i} value={String(i)} className={activeTab===String(i)?classes.fusionActiveRecentTab:""}>
                    <Text className={classes.fusionText}>{item.title}</Text>
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>
          </div>
          <Button onClick={()=>handleTabChange("next")} variant="subtle" p={0} ml={4} color="#15ABFF" disabled={+activeTab===tabItems.length-1}>
            <CaretCircleRight size={28}/>
          </Button>
        </Flex>
        {activeTab === "1" && (
          <Select classNames={{input:classes.selectinputs}} data={CATEGORIES} value={sortedBy}
            onChange={setSortedBy} rightSection={<SortAscending size={18}/>} style={{width:160}}/>
        )}
      </Flex>
      <div style={{marginTop:16}}>{tabItems[+activeTab]?.component}</div>
      <AddProjectModal opened={addModalOpened} onClose={()=>setAddModalOpened(false)}
        fundingAgencies={fundingAgencies} onSuccess={loadProjects}/>
    </>
  );
}

ResearchProjects.propTypes = {
  activeRole: PropTypes.oneOf(["Professor", "SectionHead_RSPC", "HOD"]).isRequired,
};

export default ResearchProjects;
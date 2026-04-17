import { useEffect, useState, useRef } from "react";
import { Tabs, Button, Flex, Text, Paper, Grid, TextInput, Textarea,
         Select, Title, Loader, Center } from "@mantine/core";
import { CaretCircleLeft, CaretCircleRight, CheckCircle, XCircle } from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import RSPCBreadcrumbs from "./components/RSPCBreadcrumbs";
import PublicationsTable from "./components/tables/publicationsTable";
import DetailViewModal from "./components/modals/detailViewModal";
import classes from "./styles/researchProjectsStyle.module.css";
import formClasses from "./styles/formStyle.module.css";
import { fetchPublicationsRoute } from "../../routes/RSPCRoutes/index";

const PUB_TYPES = [
  {value:"JOURNAL",label:"Journal Article"},{value:"CONFERENCE",label:"Conference Paper"},
  {value:"BOOK",label:"Book"},{value:"BOOK_CHAPTER",label:"Book Chapter"},
  {value:"PREPRINT",label:"Preprint"},{value:"OTHER",label:"Other"},
];
const INDEX_TYPES = [
  {value:"SCI",label:"SCI"},{value:"SCIE",label:"SCIE"},{value:"SCOPUS",label:"Scopus"},
  {value:"WOS",label:"Web of Science"},{value:"UGC_CARE",label:"UGC Care"},
  {value:"NONE",label:"Non-indexed"},
];

function Publications() {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("0");
  const [viewData, setViewData] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [form, setForm] = useState({
    title:"", publication_type:"JOURNAL", journal_conference_name:"",
    year: new Date().getFullYear(), index_type:"NONE", doi:"", abstract:"", external_authors:"",
  });
  const tabsListRef = useRef(null);

  const loadPublications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(fetchPublicationsRoute);
      setPublications(res.data.results || res.data);
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  };
  useEffect(() => { loadPublications(); }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.journal_conference_name) {
      notifications.show({title:"Validation",message:"Title and journal are required",color:"red"});
      return;
    }
    try {
      await axios.post(fetchPublicationsRoute, form);
      notifications.show({title:"Added",message:"Publication added successfully",color:"green"});
      loadPublications();
      setActiveTab("0");
    } catch(e) {
      notifications.show({title:"Error",message:"Failed to add publication",color:"red"});
    }
  };

  const tabItems = [
    {
      title: "All Publications",
      component: loading ? <Center py="xl"><Loader size="lg"/></Center> :
        <PublicationsTable publications={publications} onRefresh={loadPublications}
          onView={(row)=>{setViewData(row);setViewOpen(true);}}/>,
    },
    {
      title: "Add Publication",
      component: (
        <Paper className={formClasses.formContainer}>
          <Title order={4} className={formClasses.formTitle}>Add New Publication</Title>
          <Grid gutter="md">
            <Grid.Col span={12}>
              <TextInput label="Title" required value={form.title}
                onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
            </Grid.Col>
            <Grid.Col span={6}>
              <Select label="Publication Type" data={PUB_TYPES} value={form.publication_type}
                onChange={v=>setForm(f=>({...f,publication_type:v}))}/>
            </Grid.Col>
            <Grid.Col span={6}>
              <Select label="Index Type" data={INDEX_TYPES} value={form.index_type}
                onChange={v=>setForm(f=>({...f,index_type:v}))}/>
            </Grid.Col>
            <Grid.Col span={8}>
              <TextInput label="Journal / Conference Name" required
                value={form.journal_conference_name}
                onChange={e=>setForm(f=>({...f,journal_conference_name:e.target.value}))}/>
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput label="Year" type="number" value={form.year}
                onChange={e=>setForm(f=>({...f,year:+e.target.value}))}/>
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="DOI" value={form.doi}
                onChange={e=>setForm(f=>({...f,doi:e.target.value}))}/>
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="External Authors" value={form.external_authors}
                onChange={e=>setForm(f=>({...f,external_authors:e.target.value}))}/>
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea label="Abstract" minRows={3} value={form.abstract}
                onChange={e=>setForm(f=>({...f,abstract:e.target.value}))}/>
            </Grid.Col>
          </Grid>
          <div className={formClasses.submitButtonContainer}>
            <Button color="#15ABFF" style={{borderRadius:8}} onClick={handleSubmit}
              leftSection={<CheckCircle size={18}/>}>Add Publication</Button>
          </div>
        </Paper>
      ),
    },
  ];

  const handleTabNav = (dir) => {
    const n = dir==="next" ? Math.min(+activeTab+1,tabItems.length-1) : Math.max(+activeTab-1,0);
    setActiveTab(String(n));
    tabsListRef.current?.scrollBy({left:dir==="next"?50:-50,behavior:"smooth"});
  };

  return (
    <>
      <RSPCBreadcrumbs projectTitle="Publications"/>
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
          {label:"Type",key:"publication_type"},
          {label:"Journal/Conference",key:"journal_conference_name"},
          {label:"Year",key:"year"},
          {label:"Index",key:"index_type"},
          {label:"DOI",key:"doi"},
          {label:"Authors",key:"external_authors"},
          {label:"Abstract",key:"abstract"},
        ]}
      />
    </>
  );
}
export default Publications;

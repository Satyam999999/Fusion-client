import { useEffect, useState, useRef } from "react";
import {
  Tabs,
  Button,
  Flex,
  Text,
  Paper,
  Grid,
  TextInput,
  Textarea,
  Select,
  Title,
  Loader,
  Center,
} from "@mantine/core";
import {
  CheckCircle,
  CaretCircleLeft,
  CaretCircleRight,
} from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import RSPCBreadcrumbs from "./components/RSPCBreadcrumbs";
import PatentsTable from "./components/tables/patentsTable";
import DetailViewModal from "./components/modals/detailViewModal";
import classes from "./styles/researchProjectsStyle.module.css";
import formClasses from "./styles/formStyle.module.css";
import { fetchPatentsRoute } from "../../routes/RSPCRoutes";
import { useRSPCRole } from "./hooks/useRSPCRole";

const PATENT_TYPES = [
  { value: "NATIONAL", label: "National" },
  { value: "INTERNATIONAL", label: "International" },
  { value: "PCT", label: "PCT" },
  { value: "DESIGN", label: "Design" },
];

function Patents() {
  const { can } = useRSPCRole();
  const [patents, setPatents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("0");
  const [viewData, setViewData] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    patent_type: "NATIONAL",
    application_number: "",
    filing_date: "",
    country: "India",
    abstract: "",
    external_inventors: "",
  });
  const tabsListRef = useRef(null);

  const loadPatents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(fetchPatentsRoute);
      setPatents(res.data.results || res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadPatents();
  }, []);

  const handleSubmit = async () => {
    if (!form.title) {
      notifications.show({
        title: "Validation",
        message: "Title is required",
        color: "red",
      });
      return;
    }
    try {
      await axios.post(fetchPatentsRoute, form);
      notifications.show({
        title: "Filed",
        message: "Patent application filed",
        color: "green",
      });
      loadPatents();
      setActiveTab("0");
    } catch (e) {
      notifications.show({
        title: "Error",
        message: "Failed to file patent",
        color: "red",
      });
    }
  };

  const tabItems = [
    {
      title: "All Patents",
      component: loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : (
        <PatentsTable
          patents={patents}
          onRefresh={loadPatents}
          onView={(row) => {
            setViewData(row);
            setViewOpen(true);
          }}
        />
      ),
    },
  ];

  // Only Faculty and RSPC Admin can file patents
  if (can("file_patent")) {
    tabItems.push({
      title: "File Patent",
      component: (
        <Paper className={formClasses.formContainer}>
          <Title order={4} className={formClasses.formTitle}>
            File New Patent Application
          </Title>
          <Grid gutter="md">
            <Grid.Col span={{ base: 12 }}>
              <TextInput
                label="Patent Title"
                required
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Patent Type"
                data={PATENT_TYPES}
                value={form.patent_type}
                onChange={(v) => setForm((f) => ({ ...f, patent_type: v }))}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Application Number"
                value={form.application_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, application_number: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Filing Date"
                type="date"
                value={form.filing_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, filing_date: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Country"
                value={form.country}
                onChange={(e) =>
                  setForm((f) => ({ ...f, country: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12 }}>
              <TextInput
                label="Inventors"
                value={form.external_inventors}
                onChange={(e) =>
                  setForm((f) => ({ ...f, external_inventors: e.target.value }))
                }
                placeholder="Dr. A. Kumar, Prof. B. Sharma"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12 }}>
              <Textarea
                label="Abstract"
                minRows={3}
                value={form.abstract}
                onChange={(e) =>
                  setForm((f) => ({ ...f, abstract: e.target.value }))
                }
              />
            </Grid.Col>
          </Grid>
          <div className={formClasses.submitButtonContainer}>
            <Button
              color="#15ABFF"
              style={{ borderRadius: 8 }}
              onClick={handleSubmit}
              leftSection={<CheckCircle size={18} />}
            >
              File Patent
            </Button>
          </div>
        </Paper>
      ),
    });
  }

  const handleTabNav = (dir) => {
    const n =
      dir === "next"
        ? Math.min(+activeTab + 1, tabItems.length - 1)
        : Math.max(+activeTab - 1, 0);
    setActiveTab(String(n));
    tabsListRef.current?.scrollBy({
      left: dir === "next" ? 50 : -50,
      behavior: "smooth",
    });
  };

  return (
    <>
      <RSPCBreadcrumbs projectTitle="Patents" />
      <Flex justify="space-between" align="center" mt="lg">
        <Flex align="center">
          <Button
            onClick={() => handleTabNav("prev")}
            variant="subtle"
            p={0}
            mr={4}
            color="#15ABFF"
            disabled={+activeTab === 0}
          >
            <CaretCircleLeft size={28} />
          </Button>
          <div className={classes.fusionTabsContainer} ref={tabsListRef}>
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                {tabItems.map((item, i) => (
                  <Tabs.Tab
                    key={i}
                    value={String(i)}
                    className={
                      activeTab === String(i)
                        ? classes.fusionActiveRecentTab
                        : ""
                    }
                  >
                    <Text className={classes.fusionText}>{item.title}</Text>
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>
          </div>
          <Button
            onClick={() => handleTabNav("next")}
            variant="subtle"
            p={0}
            ml={4}
            color="#15ABFF"
            disabled={+activeTab === tabItems.length - 1}
          >
            <CaretCircleRight size={28} />
          </Button>
        </Flex>
      </Flex>
      <div style={{ marginTop: 16 }}>{tabItems[+activeTab]?.component}</div>
      <DetailViewModal
        opened={viewOpen}
        onClose={() => setViewOpen(false)}
        data={viewData}
        titleField="title"
        fields={[
          { label: "Type", key: "patent_type" },
          { label: "Application No.", key: "application_number" },
          { label: "Status", key: "status" },
          { label: "Country", key: "country" },
          {
            label: "Filing Date",
            key: "filing_date",
            format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
          },
          {
            label: "Grant Date",
            key: "grant_date",
            format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
          },
          { label: "Inventors", key: "external_inventors" },
          { label: "Abstract", key: "abstract" },
        ]}
      />
    </>
  );
}
export default Patents;

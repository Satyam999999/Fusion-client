import { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import {
  Tabs,
  Button,
  Flex,
  Text,
  Paper,
  Grid,
} from "@mantine/core";
import { CaretCircleLeft, CaretCircleRight } from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import classes from "./styles/researchProjectsStyle.module.css";
import RSPCBreadcrumbs from "./components/RSPCBreadcrumbs";
import ProjectTable from "./components/tables/projectTable";
import AddProjectModal from "./components/modals/addProjectModal";
import ExpenditureTable from "./components/tables/expenditureTable";
import FormAppendixPanel from "../../components/FormAppendixPanel";
import ProgressReportsTab from "./components/tabs/progressReportsTab";
import ProjectClosuresTab from "./components/tabs/projectClosuresTab";
import {
  fetchProjectsRoute,
  fetchFundingAgenciesRoute,
  fetchExpendituresRoute,
} from "../../routes/RSPCRoutes";
import { useRSPCRole } from "./hooks/useRSPCRole";

function toList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function StatCard({ label, value, color }) {
  return (
    <Paper
      p="md"
      withBorder
      className="rspc-stat-card"
      style={{ "--rspc-accent": color || "#15ABFF" }}
    >
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text size="xl" fw={700} mt={4}>
        {value}
      </Text>
    </Paper>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string,
};

function ResearchProjects() {
  const { role } = useRSPCRole();
  // Map hook role to the legacy string used by ProjectTable (keep backward compat)
  const activeRole =
    role === "FACULTY"
      ? "Professor"
      : role === "HOD"
        ? "HOD"
        : role === "RSPC_ADMIN"
          ? "SectionHead_RSPC"
          : role === "DEAN_RSPC"
            ? "Dean_RSPC"
            : "Director";
  const [projectsData, setProjectsData] = useState([]);
  const [fundingAgencies, setFundingAgencies] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [activeTab, setActiveTab] = useState("0");
  const [addModalOpened, setAddModalOpened] = useState(false);
  const tabsListRef = useRef(null);

  // Faculty dashboard is intentionally project-owned: backend already scopes the
  // list to the authenticated user's PI/Co-PI records.
  const visibleProjects = projectsData;
  const visibleProjectIds = new Set(
    visibleProjects.map((project) => String(project.id)),
  );
  const getExpenditureProjectId = (entry) =>
    String(entry?.project ?? entry?.project_id ?? entry?.project?.id ?? "");
  const visibleExpenditures =
    role === "FACULTY"
      ? expenditures.filter((entry) => visibleProjectIds.has(getExpenditureProjectId(entry)))
      : expenditures;

  // AbortController-aware loaders — prevents React state update on unmounted component
  const loadAll = (signal) => {
    const get = (url) => axios.get(url, { signal });

    Promise.allSettled([
      get(fetchProjectsRoute),
      get(fetchFundingAgenciesRoute),
      get(fetchExpendituresRoute),
    ])
      .then((results) => {
        const [projRes, agencyRes, expendRes] = results;

        if (projRes.status === "fulfilled") {
          setProjectsData(toList(projRes.value.data));
        } else {
          setProjectsData([]);
        }

        if (agencyRes.status === "fulfilled") {
          setFundingAgencies(toList(agencyRes.value.data));
        } else {
          setFundingAgencies([]);
        }

        if (expendRes.status === "fulfilled") {
          setExpenditures(toList(expendRes.value.data));
        } else {
          setExpenditures([]);
        }
      })
      .catch((e) => {
        if (axios.isCancel(e)) return;
      })
      .finally(() => {});
  };

  // Standalone project refresh (used by AddProjectModal onSuccess)
  const loadProjects = (signal) => {
    const ctrl = signal ? { signal } : {};
    axios
      .get(fetchProjectsRoute, ctrl)
      .then((r) => setProjectsData(toList(r.data)))
      .catch((e) => {
        if (axios.isCancel(e)) return;
        notifications.show({
          title: "Error",
          message: "Failed to refresh projects.",
          color: "red",
        });
      });
  };

  const loadExpend = (signal) => {
    const ctrl = signal ? { signal } : {};
    axios
      .get(fetchExpendituresRoute, ctrl)
      .then((r) => setExpenditures(toList(r.data)))
      .catch((e) => {
        if (axios.isCancel(e)) return;
        notifications.show({
          title: "Error",
          message: "Failed to refresh expenditures.",
          color: "red",
        });
      });
  };

  useEffect(() => {
    const controller = new AbortController();
    loadAll(controller.signal);
    return () => controller.abort();   // cancel all in-flight requests on unmount
  }, []);



  const totalFunding = visibleProjects.reduce(
    (s, p) => s + parseFloat(p.sanctioned_amount || 0),
    0,
  );

  const tabItems = [
    {
      title: "Dashboard",
      component: (
        <div className="rspc-section">
          <Grid gutter="md" mb="xl">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <StatCard
                label="Total Projects"
                value={visibleProjects.length}
                color="#15ABFF"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <StatCard
                label="Total Sanctioned Funding"
                value={`₹${totalFunding.toLocaleString("en-IN")}`}
                color="#15ABFF"
              />
            </Grid.Col>
          </Grid>
          <Text fw={600} mb="sm">
            My Projects
          </Text>
          <ProjectTable
            projectsData={visibleProjects}
            activeRole={activeRole}
            fundingAgencies={fundingAgencies}
            onProjectsRefresh={loadProjects}
          />
        </div>
      ),
    },
    {
      title: "Expenditures",
      component: (
        <ExpenditureTable
          expenditures={visibleExpenditures}
          onRefresh={loadExpend}
          projects={visibleProjects}
        />
      ),
    },
  ];

  const ROLE_CAN_CREATE = ["Professor", "SectionHead_RSPC"];

  if (ROLE_CAN_CREATE.includes(activeRole)) {
    tabItems.push({
      title: "New Project Proposal",
      component: (
        <div className="rspc-section">
          <Text c="dimmed" mb="md">
            Submit a new sponsored project proposal.
          </Text>
          <Button
            color="var(--rspc-primary)"
            className="rspc-primary-button"
            onClick={() => setAddModalOpened(true)}
          >
            + New Project Proposal
          </Button>
        </div>
      ),
    });
  }

  tabItems.push({
    title: "Form Appendix",
    component: (
      <div className="rspc-section">
        <FormAppendixPanel module="research" />
      </div>
    ),
  });

  tabItems.push({
    title: "Progress Reports",
    component: (
      <div className="rspc-section">
        <ProgressReportsTab
          visibleProjects={visibleProjects}
          onProjectsRefresh={loadProjects}
        />
      </div>
    ),
  });

  tabItems.push({
    title: "Project Closures",
    component: (
      <div className="rspc-section">
        <ProjectClosuresTab
          visibleProjects={visibleProjects}
          onProjectsRefresh={loadProjects}
        />
      </div>
    ),
  });

  const handleTabChange = (dir) => {
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
      <RSPCBreadcrumbs />
      <Flex justify="space-between" align="center" mt="lg" mb={4}>
        <Flex justify="flex-start" align="center">
          <Button
            onClick={() => handleTabChange("prev")}
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
              <Tabs.List style={{ flexWrap: "nowrap" }}>
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
            onClick={() => handleTabChange("next")}
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
      <AddProjectModal
        opened={addModalOpened}
        onClose={() => setAddModalOpened(false)}
        fundingAgencies={fundingAgencies}
        onSuccess={loadProjects}
      />
    </>
  );
}

export default ResearchProjects;

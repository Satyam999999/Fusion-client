import { useEffect, useRef, useState } from "react";
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
  Loader,
  Center,
} from "@mantine/core";
import {
  CaretCircleLeft,
  CaretCircleRight,
  CheckCircle,
} from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import classes from "../RSPC/styles/researchProjectsStyle.module.css";
import formClasses from "../RSPC/styles/formStyle.module.css";
import DetailViewModal from "../RSPC/components/modals/detailViewModal";
import RecruitmentPostsTable from "./components/tables/recruitmentPostsTable";
import FormAppendixPanel from "../../components/FormAppendixPanel";
import { fetchRecruitmentPostsRoute } from "../../routes/RSPCRoutes/index";

const EMPLOYMENT_TYPES = [
  { value: "TEACHING", label: "Teaching" },
  { value: "NON_TEACHING", label: "Non-Teaching" },
  { value: "CONTRACT", label: "Contract" },
  { value: "PROJECT", label: "Project Staff" },
];

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "ON_HOLD", label: "On Hold" },
];

function StaffRecruitment() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("0");
  const [viewData, setViewData] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [form, setForm] = useState({
    post_code: "",
    title: "",
    employment_type: "TEACHING",
    openings: 1,
    min_experience_years: 0,
    description: "",
    application_deadline: "",
    status: "OPEN",
  });
  const tabsListRef = useRef(null);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(fetchRecruitmentPostsRoute);
      setPosts(res.data.results || res.data);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load recruitment posts",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleSubmit = async () => {
    if (!form.post_code || !form.title || !form.application_deadline) {
      notifications.show({
        title: "Validation",
        message: "Post code, title, and deadline are required",
        color: "red",
      });
      return;
    }

    try {
      await axios.post(fetchRecruitmentPostsRoute, form);
      notifications.show({
        title: "Created",
        message: "Recruitment post created",
        color: "green",
      });
      setForm({
        post_code: "",
        title: "",
        employment_type: "TEACHING",
        openings: 1,
        min_experience_years: 0,
        description: "",
        application_deadline: "",
        status: "OPEN",
      });
      setActiveTab("0");
      loadPosts();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to create recruitment post",
        color: "red",
      });
    }
  };

  const tabItems = [
    {
      title: "Recruitment Posts",
      component: loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : (
        <RecruitmentPostsTable
          posts={posts}
          onRefresh={loadPosts}
          onView={(row) => {
            setViewData(row);
            setViewOpen(true);
          }}
        />
      ),
    },
    {
      title: "Create Post",
      component: (
        <Paper className={formClasses.formContainer}>
          <Text fw={700} size="lg" className={formClasses.formTitle}>
            Create Staff Recruitment Post
          </Text>
          <Grid gutter="md">
            <Grid.Col span={6}>
              <TextInput
                label="Post Code"
                required
                value={form.post_code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, post_code: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Employment Type"
                data={EMPLOYMENT_TYPES}
                value={form.employment_type}
                onChange={(v) =>
                  v && setForm((f) => ({ ...f, employment_type: v }))
                }
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <TextInput
                label="Title"
                required
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Openings"
                type="number"
                value={form.openings}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    openings: Number(e.target.value || 0),
                  }))
                }
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Min Experience (Years)"
                type="number"
                value={form.min_experience_years}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    min_experience_years: Number(e.target.value || 0),
                  }))
                }
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Application Deadline"
                type="date"
                required
                value={form.application_deadline}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    application_deadline: e.target.value,
                  }))
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Status"
                data={STATUS_OPTIONS}
                value={form.status}
                onChange={(v) => v && setForm((f) => ({ ...f, status: v }))}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label="Description"
                minRows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
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
              Create Recruitment Post
            </Button>
          </div>
        </Paper>
      ),
    },
    {
      title: "Form Appendix",
      component: (
        <div style={{ padding: "3% 5%" }}>
          <FormAppendixPanel module="recruitment" />
        </div>
      ),
    },
  ];

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
      <Text fw={700} size="xl" mt="sm" ml={{ md: "lg" }}>
        Staff Recruitment
      </Text>
      <Flex justify="flex-start" align="center" mt="lg">
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
            <Tabs.List style={{ flexWrap: "nowrap" }}>
              {tabItems.map((item, i) => (
                <Tabs.Tab
                  key={i}
                  value={String(i)}
                  className={
                    activeTab === String(i) ? classes.fusionActiveRecentTab : ""
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
      <div style={{ marginTop: 16 }}>{tabItems[+activeTab]?.component}</div>

      <DetailViewModal
        opened={viewOpen}
        onClose={() => setViewOpen(false)}
        data={viewData}
        titleField="title"
        title="Recruitment Post Details"
        fields={[
          { label: "Post Code", key: "post_code" },
          { label: "Employment Type", key: "employment_type" },
          { label: "Openings", key: "openings" },
          {
            label: "Min Experience",
            key: "min_experience_years",
            format: (v) => `${v || 0} years`,
          },
          {
            label: "Deadline",
            key: "application_deadline",
            format: (v) => (v ? new Date(v).toLocaleDateString() : "-"),
          },
          { label: "Status", key: "status" },
          { label: "Description", key: "description" },
        ]}
      />
    </>
  );
}

export default StaffRecruitment;

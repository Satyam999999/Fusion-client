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
import StaffApplicationsTable from "./components/tables/staffApplicationsTable";
import {
  fetchRecruitmentPostsRoute,
  fetchStaffApplicationsRoute,
} from "../../routes/RSPCRoutes/index";

const APP_STATUS = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
  { value: "SELECTED", label: "Selected" },
  { value: "REJECTED", label: "Rejected" },
];

function StaffApplications() {
  const [applications, setApplications] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("0");
  const [viewData, setViewData] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [form, setForm] = useState({
    post: null,
    application_number: "",
    applicant_name: "",
    email: "",
    phone: "",
    qualification: "",
    experience_years: 0,
    cover_letter: "",
    resume_url: "",
    status: "SUBMITTED",
  });
  const tabsListRef = useRef(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [appRes, postRes] = await Promise.all([
        axios.get(fetchStaffApplicationsRoute),
        axios.get(fetchRecruitmentPostsRoute),
      ]);
      setApplications(appRes.data.results || appRes.data);
      setPosts(postRes.data.results || postRes.data);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load staff applications",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSubmit = async () => {
    if (
      !form.post ||
      !form.application_number ||
      !form.applicant_name ||
      !form.email
    ) {
      notifications.show({
        title: "Validation",
        message:
          "Post, application number, applicant name, and email are required",
        color: "red",
      });
      return;
    }

    try {
      await axios.post(fetchStaffApplicationsRoute, {
        ...form,
        post: Number(form.post),
      });
      notifications.show({
        title: "Created",
        message: "Staff application created",
        color: "green",
      });
      setForm({
        post: null,
        application_number: "",
        applicant_name: "",
        email: "",
        phone: "",
        qualification: "",
        experience_years: 0,
        cover_letter: "",
        resume_url: "",
        status: "SUBMITTED",
      });
      setActiveTab("0");
      loadAll();
    } catch (err) {
      const msg = err.response?.data
        ? JSON.stringify(err.response.data)
        : "Failed to create application";
      notifications.show({ title: "Error", message: msg, color: "red" });
    }
  };

  const postOptions = (posts || []).map((post) => ({
    value: String(post.id),
    label: `${post.post_code} - ${post.title}`,
  }));

  const tabItems = [
    {
      title: "Applications",
      component: loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : (
        <StaffApplicationsTable
          applications={applications}
          onRefresh={loadAll}
          onView={(row) => {
            setViewData(row);
            setViewOpen(true);
          }}
        />
      ),
    },
    {
      title: "Create Application",
      component: (
        <Paper className={formClasses.formContainer}>
          <Text fw={700} size="lg" className={formClasses.formTitle}>
            Create Staff Application
          </Text>
          <Grid gutter="md">
            <Grid.Col span={12}>
              <Select
                label="Recruitment Post"
                required
                data={postOptions}
                value={form.post}
                onChange={(v) => setForm((f) => ({ ...f, post: v }))}
                searchable
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Application Number"
                required
                value={form.application_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, application_number: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Status"
                data={APP_STATUS}
                value={form.status}
                onChange={(v) => v && setForm((f) => ({ ...f, status: v }))}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Applicant Name"
                required
                value={form.applicant_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, applicant_name: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Email"
                required
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Qualification"
                value={form.qualification}
                onChange={(e) =>
                  setForm((f) => ({ ...f, qualification: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Experience (Years)"
                type="number"
                value={form.experience_years}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    experience_years: Number(e.target.value || 0),
                  }))
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Resume URL"
                value={form.resume_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, resume_url: e.target.value }))
                }
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label="Cover Letter"
                minRows={3}
                value={form.cover_letter}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cover_letter: e.target.value }))
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
              Create Application
            </Button>
          </div>
        </Paper>
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
        Staff Applications
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
        titleField="application_number"
        title="Application Details"
        fields={[
          { label: "Applicant", key: "applicant_name" },
          { label: "Post", key: "post_title" },
          { label: "Status", key: "status" },
          { label: "Email", key: "email" },
          { label: "Phone", key: "phone" },
          { label: "Qualification", key: "qualification" },
          {
            label: "Experience",
            key: "experience_years",
            format: (v) => `${v || 0} years`,
          },
          { label: "Cover Letter", key: "cover_letter" },
        ]}
      />
    </>
  );
}

export default StaffApplications;

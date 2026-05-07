import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import {
  Modal,
  Button,
  TextInput,
  Textarea,
  Select,
  Grid,
  Text,
} from "@mantine/core";
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import { fetchProjectsRoute } from "../../../../routes/RSPCRoutes/index";

function formatApiErrorMessage(errorData) {
  if (!errorData) return "Failed to create project";
  if (typeof errorData === "string") return errorData;
  if (Array.isArray(errorData)) return errorData.join(", ");

  if (typeof errorData === "object") {
    const flatten = (value) => {
      if (value == null) return "";
      if (typeof value === "string") return value;
      if (Array.isArray(value)) return value.map(flatten).filter(Boolean).join(", ");
      if (typeof value === "object") {
        return Object.entries(value)
          .map(([key, nested]) => {
            const nestedMessage = flatten(nested);
            return nestedMessage ? `${key}: ${nestedMessage}` : key;
          })
          .filter(Boolean)
          .join(" | ");
      }
      return String(value);
    };

    const parts = Object.entries(errorData).map(([field, value]) => {
      const message = flatten(value);
      return `${field}: ${message}`;
    });
    return parts.join(" | ");
  }

  return "Failed to create project";
}

function AddProjectModal({
  opened,
  onClose,
  fundingAgencies,
  onSuccess,
  mode = "create",
  projectData = null,
}) {
  const [form, setForm] = useState({
    title: "",
    project_number: "",
    description: "",
    sanctioned_amount: "",
    status: "PROPOSED",
    start_date: "",
    original_end_date: "",
  });
  const [agencyId, setAgencyId] = useState(null);
  const [loading, setLoading] = useState(false);
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (!opened) return;

    if (isEditMode && projectData) {
      setForm({
        title: projectData.title || "",
        project_number: projectData.project_number || "",
        description: projectData.description || "",
        sanctioned_amount: projectData.sanctioned_amount || "",
        status: projectData.status || "PROPOSED",
        start_date: projectData.start_date || "",
        original_end_date: projectData.original_end_date || "",
      });
      setAgencyId(
        projectData.funding_agency ? String(projectData.funding_agency) : null,
      );
      return;
    }

    setForm({
      title: "",
      project_number: "",
      description: "",
      sanctioned_amount: "",
      status: "PROPOSED",
      start_date: "",
      original_end_date: "",
    });
    setAgencyId(null);
  }, [opened, isEditMode, projectData]);

  const agencyOptions = (fundingAgencies || []).map((a) => ({
    value: String(a.id),
    label: a.name,
  }));
  const statusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "PROPOSED", label: "Proposed" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "APPROVED", label: "Approved" },
    { value: "SANCTIONED", label: "Sanctioned" },
    { value: "ONGOING", label: "Ongoing" },
    { value: "COMPLETED", label: "Completed" },
  ];

  const handleSubmit = async () => {
    if (
      !form.title?.trim() ||
      !form.project_number?.trim() ||
      !form.description?.trim()
    ) {
      notifications.show({
        title: "Validation Error",
        message: "Title, Project Number, and Description are required",
        color: "red",
      });
      return;
    }

    const payload = {
      title: form.title.trim(),
      project_number: form.project_number.trim(),
      description: form.description.trim(),
      status: form.status || "PROPOSED",
      funding_agency: agencyId ? Number(agencyId) : null,
    };

    if (form.sanctioned_amount !== "") {
      payload.sanctioned_amount = Number(form.sanctioned_amount);
    }
    if (form.start_date) {
      payload.start_date = form.start_date;
    }
    if (form.original_end_date) {
      payload.original_end_date = form.original_end_date;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        await axios.patch(`${fetchProjectsRoute}${projectData.id}/`, payload);
      } else {
        await axios.post(fetchProjectsRoute, payload);
      }
      notifications.show({
        title: "Success",
        message: isEditMode
          ? "Project updated successfully"
          : "Project created successfully",
        color: "green",
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = formatApiErrorMessage(
        err.response?.data,
      );
      notifications.show({ title: "Error", message: msg, color: "red" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      styles={{ content: { borderLeft: "0.6rem solid #15ABFF" } }}
      title={
        <Text fw={700} size="lg" c="#15ABFF">
          {isEditMode ? "Edit Project" : "New Project Proposal"}
        </Text>
      }
    >
      <Grid gutter="md">
        <Grid.Col span={12}>
          <TextInput
            label="Project Title"
            required
            placeholder="Enter project title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="Project Number"
            required
            placeholder="e.g. DST/2024/CS/001"
            value={form.project_number}
            onChange={(e) =>
              setForm((f) => ({ ...f, project_number: e.target.value }))
            }
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Select
            label="Status"
            data={statusOptions}
            value={form.status}
            onChange={(v) => setForm((f) => ({ ...f, status: v }))}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Select
            label="Funding Agency"
            data={agencyOptions}
            value={agencyId}
            onChange={setAgencyId}
            searchable
            placeholder="Select agency"
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="Sanctioned Amount (₹)"
            placeholder="e.g. 2500000"
            value={form.sanctioned_amount}
            onChange={(e) =>
              setForm((f) => ({ ...f, sanctioned_amount: e.target.value }))
            }
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="Start Date"
            type="date"
            value={form.start_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, start_date: e.target.value }))
            }
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="End Date"
            type="date"
            value={form.original_end_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, original_end_date: e.target.value }))
            }
          />
        </Grid.Col>
        <Grid.Col span={12}>
          <Textarea
            label="Description"
            placeholder="Project abstract / description"
            minRows={3}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </Grid.Col>
      </Grid>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
          marginTop: 20,
        }}
      >
        <Button
          variant="outline"
          color="#85B5D9"
          style={{ borderRadius: 8 }}
          onClick={onClose}
          leftSection={<XCircle size={18} />}
        >
          Cancel
        </Button>
        <Button
          color="#15ABFF"
          style={{ borderRadius: 8 }}
          loading={loading}
          onClick={handleSubmit}
          leftSection={<CheckCircle size={18} />}
        >
          {isEditMode ? "Save Changes" : "Submit Proposal"}
        </Button>
      </div>
    </Modal>
  );
}
AddProjectModal.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fundingAgencies: PropTypes.arrayOf(PropTypes.shape({})),
  onSuccess: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["create", "edit"]),
  projectData: PropTypes.shape({}),
};
export default AddProjectModal;

import { ActionIcon, Group, Paper, Stack, Text } from "@mantine/core";
import { ArrowRight } from "@phosphor-icons/react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

const appendixContent = {
  research: {
    title: "All RSPC Forms",
    items: [
      { label: "Ethical Clearance Form", href: "/governance" },
      { label: "FIG Closure", href: "/research/forms" },
      { label: "FIG Project Proposal Submission Form", href: "/research" },
      { label: "Requisition For Publishing Advertisement", href: "/staff/recruitment" },
      { label: "Extension Of Appointment Through Project Investigator", href: "/staff/appointments" },
      { label: "Upgradation Of Appointment Through Committee", href: "/staff/appointments" },
    ],
  },
  recruitment: {
    title: "All RSPC Forms",
    items: [
      { label: "Ethical Clearance Form", href: "/governance" },
      { label: "FIG Closure", href: "/research/forms" },
      { label: "FIG Project Proposal Submission Form", href: "/research" },
      { label: "Requisition For Publishing Advertisement", href: "/staff/recruitment" },
      { label: "Extension Of Appointment Through Project Investigator", href: "/staff/appointments" },
      { label: "Upgradation Of Appointment Through Committee", href: "/staff/appointments" },
    ],
  },
};

function FormAppendixPanel({ module }) {
  const content = appendixContent[module] || appendixContent.research;
  const navigate = useNavigate();

  return (
    <Paper
      p="xl"
      withBorder
      style={{
        borderLeft: "10px solid #15ABFF",
        borderRadius: 28,
        background: "#FFFFFF",
        minHeight: 420,
        boxShadow: "0 10px 35px rgba(21, 171, 255, 0.08)",
      }}
    >
      <Stack gap="xl" h="100%">
        <Text ta="center" fw={700} size="xl" c="#15ABFF">
          {content.title}
        </Text>

        <Stack gap="lg" mx={{ base: 0, md: 5 }}>
          {content.items.map((item) => (
            <Group key={item.label} justify="space-between" wrap="nowrap" gap="md">
              <Text size="lg" c="#3c3c3c" style={{ lineHeight: 1.2 }}>
                {item.label}
              </Text>
              <ActionIcon
                variant="subtle"
                color="blue"
                size="lg"
                radius="xl"
                onClick={() => navigate(item.href)}
                title={`Go to ${item.label}`}
                aria-label={`Go to ${item.label}`}
              >
                <ArrowRight size={22} weight="bold" />
              </ActionIcon>
            </Group>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

FormAppendixPanel.propTypes = {
  module: PropTypes.oneOf(["research", "recruitment"]).isRequired,
};

export default FormAppendixPanel;
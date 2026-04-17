import PropTypes from "prop-types";
import { Breadcrumbs, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { CaretRight } from "@phosphor-icons/react";

function RSPCBreadcrumbs({ projectTitle, extra }) {
  const navigate = useNavigate();
  const items = [
    <Text key="root" fw={600} c="#15ABFF" style={{ cursor:"pointer" }}
      onClick={() => navigate("/research")}>
      Research Projects
    </Text>,
  ];
  if (projectTitle) items.push(<Text key="proj" fw={600}>{projectTitle}</Text>);
  if (extra) items.push(<Text key="extra" fw={600}>{extra}</Text>);
  return (
    <Breadcrumbs
      separator={<CaretRight size={14} weight="bold" />}
      mt="xs" ml={{ md: "lg" }}
    >
      {items}
    </Breadcrumbs>
  );
}
RSPCBreadcrumbs.propTypes = {
  projectTitle: PropTypes.string,
  extra: PropTypes.string,
};
export default RSPCBreadcrumbs;

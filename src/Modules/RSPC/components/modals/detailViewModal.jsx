import PropTypes from "prop-types";
import { Modal, Text, Badge, Grid, Title, Group, Divider } from "@mantine/core";
import { badgeColor } from "../../helpers/badgeColours";

function DetailViewModal({ opened, onClose, data, titleField, fields, title }) {
  if (!data) return null;
  return (
    <Modal opened={opened} onClose={onClose} size="lg"
      styles={{content:{borderLeft:"0.7rem solid #15ABFF"}}}
      title={
        <Group>
          <Title order={4}>{data[titleField] || title || "Details"}</Title>
          {data.status && (
            <Badge color={badgeColor[data.status]||"gray"} size="md"
              style={{color:"#3f3f3f"}}>{data.status}</Badge>
          )}
        </Group>
      }
    >
      <Grid gutter="xs">
        {(fields||[]).map(({label,key,format},i) => (
          <Grid.Col span={6} key={i}>
            <Text size="sm">
              <span style={{color:"#A0A0A0"}}>{label}: </span>
              {format ? format(data[key]) : (data[key]||"—")}
            </Text>
          </Grid.Col>
        ))}
      </Grid>
    </Modal>
  );
}
DetailViewModal.propTypes = {
  opened:PropTypes.bool.isRequired, onClose:PropTypes.func.isRequired,
  data:PropTypes.object, titleField:PropTypes.string, fields:PropTypes.array, title:PropTypes.string,
};
export default DetailViewModal;

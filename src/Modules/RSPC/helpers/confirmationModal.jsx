import PropTypes from "prop-types";
import { Modal, Button, Text } from "@mantine/core";
import { ThumbsDown, ThumbsUp } from "@phosphor-icons/react";

function ConfirmationModal({ opened, onClose, onConfirm, title }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      withCloseButton={false}
      size="sm"
      styles={{ header: { justifyContent: "center" } }}
      title={
        <Text fw={700} size="lg" style={{ color: "#15ABFF" }}>
          {title || "Confirm Action?"}
        </Text>
      }
    >
      <Text style={{ textAlign: "center" }}>
        Are you sure you want to proceed? Please verify the details before confirming.
      </Text>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
        <Button color="#85B5D9" style={{ borderRadius: "8px", marginRight: "1rem" }}
          onClick={onClose} size="xs" variant="outline">
          <ThumbsDown size={20} style={{ marginRight: "3px" }} /> No
        </Button>
        <Button color="cyan" style={{ borderRadius: "8px" }} size="xs" onClick={onConfirm}>
          <ThumbsUp size={20} style={{ marginRight: "3px" }} /> Yes
        </Button>
      </div>
    </Modal>
  );
}

ConfirmationModal.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
};
export default ConfirmationModal;
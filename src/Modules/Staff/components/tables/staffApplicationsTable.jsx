import PropTypes from "prop-types";
import { useState } from "react";
import { Table, Button, Badge, ScrollArea, Text } from "@mantine/core";
import { Eye, Trash } from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import classes from "../../../RSPC/styles/tableStyle.module.css";
import ConfirmationModal from "../../../RSPC/helpers/confirmationModal";
import { fetchStaffApplicationsRoute } from "../../../../routes/RSPCRoutes/index";
import { useRSPCRole } from "../../../RSPC/hooks/useRSPCRole";

function StaffApplicationsTable({ applications, onView, onRefresh }) {
  const { role } = useRSPCRole();
  const isRspcAdmin = role === "RSPC_ADMIN";
  const [deleteId, setDeleteId] = useState(null);

  const statusColor = (status) => {
    if (status === "SELECTED") return "green";
    if (status === "SHORTLISTED") return "blue";
    if (status === "REJECTED") return "red";
    return "gray";
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${fetchStaffApplicationsRoute}${deleteId}/`);
      notifications.show({
        title: "Deleted",
        message: "Application deleted",
        color: "orange",
      });
      setDeleteId(null);
      if (onRefresh) onRefresh();
    } catch {
      notifications.show({
        title: "Error",
        message: "Delete failed",
        color: "red",
      });
    }
  };

  const handleStatusUpdate = async (id, nextStatus) => {
    try {
      await axios.patch(`${fetchStaffApplicationsRoute}${id}/`, {
        status: nextStatus,
      });
      notifications.show({
        title: "Updated",
        message: `Application marked ${nextStatus}`,
        color: "green",
      });
      if (onRefresh) onRefresh();
    } catch {
      notifications.show({
        title: "Error",
        message: "Unable to update application status",
        color: "red",
      });
    }
  };

  return (
    <>
      <ScrollArea h={360}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th className={classes["header-cell"]}>Status</Table.Th>
              <Table.Th className={classes["header-cell"]}>
                Application No.
              </Table.Th>
              <Table.Th className={classes["header-cell"]}>Applicant</Table.Th>
              <Table.Th className={classes["header-cell"]}>Post</Table.Th>
              <Table.Th className={classes["header-cell"]}>Email</Table.Th>
              <Table.Th className={classes["header-cell"]}>Applied On</Table.Th>
              <Table.Th className={classes["header-cell"]}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(applications || []).length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text ta="center" c="dimmed" py="md">
                    No staff applications found
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              (applications || []).map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td className={classes["row-content"]}>
                    <Badge color={statusColor(row.status)}>{row.status}</Badge>
                  </Table.Td>
                  <Table.Td className={classes["row-content"]}>
                    {row.application_number}
                  </Table.Td>
                  <Table.Td className={classes["row-content"]}>
                    {row.applicant_name}
                  </Table.Td>
                  <Table.Td
                    className={classes["row-content"]}
                    style={{ textAlign: "left", maxWidth: 220 }}
                  >
                    {row.post_title || "-"}
                  </Table.Td>
                  <Table.Td className={classes["row-content"]}>
                    {row.email}
                  </Table.Td>
                  <Table.Td className={classes["row-content"]}>
                    {row.applied_at
                      ? new Date(row.applied_at).toLocaleDateString()
                      : "-"}
                  </Table.Td>
                  <Table.Td className={classes["row-content"]}>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        onClick={() => onView && onView(row)}
                        variant="outline"
                        color="#15ABFF"
                        size="xs"
                        style={{ borderRadius: "8px" }}
                      >
                        <Eye size={16} style={{ margin: 3 }} /> View
                      </Button>
                      {isRspcAdmin && (
                        <>
                          <Button
                            onClick={() =>
                              handleStatusUpdate(row.id, "UNDER_REVIEW")
                            }
                            variant="outline"
                            color="blue"
                            size="xs"
                            style={{ borderRadius: "8px" }}
                          >
                            Review
                          </Button>
                          <Button
                            onClick={() => handleStatusUpdate(row.id, "SELECTED")}
                            variant="outline"
                            color="green"
                            size="xs"
                            style={{ borderRadius: "8px" }}
                          >
                            Select
                          </Button>
                          <Button
                            onClick={() => handleStatusUpdate(row.id, "REJECTED")}
                            variant="outline"
                            color="red"
                            size="xs"
                            style={{ borderRadius: "8px" }}
                          >
                            Reject
                          </Button>
                          <Button
                            onClick={() => setDeleteId(row.id)}
                            variant="outline"
                            color="gray"
                            size="xs"
                            style={{ borderRadius: "8px" }}
                          >
                            <Trash size={16} style={{ margin: 3 }} /> Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
      <ConfirmationModal
        opened={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Staff Application?"
      />
    </>
  );
}

StaffApplicationsTable.propTypes = {
  applications: PropTypes.arrayOf(PropTypes.shape({})),
  onView: PropTypes.func,
  onRefresh: PropTypes.func,
};

export default StaffApplicationsTable;

import PropTypes from "prop-types";
import { useState } from "react";
import { Table, Button, Badge, ScrollArea, Text } from "@mantine/core";
import { Eye, Trash } from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import classes from "../../../RSPC/styles/tableStyle.module.css";
import ConfirmationModal from "../../../RSPC/helpers/confirmationModal";
import { fetchRecruitmentPostsRoute } from "../../../../routes/RSPCRoutes/index";

function RecruitmentPostsTable({ posts, onView, onRefresh }) {
  const [deleteId, setDeleteId] = useState(null);

  const statusColor = (status) => {
    if (status === "OPEN") return "green";
    if (status === "ON_HOLD") return "yellow";
    return "gray";
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${fetchRecruitmentPostsRoute}${deleteId}/`);
      notifications.show({
        title: "Deleted",
        message: "Recruitment post deleted",
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

  return (
    <>
      <ScrollArea h={360}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th className={classes["header-cell"]}>Status</Table.Th>
              <Table.Th className={classes["header-cell"]}>Post Code</Table.Th>
              <Table.Th className={classes["header-cell"]}>Title</Table.Th>
              <Table.Th className={classes["header-cell"]}>Type</Table.Th>
              <Table.Th className={classes["header-cell"]}>Openings</Table.Th>
              <Table.Th className={classes["header-cell"]}>Deadline</Table.Th>
              <Table.Th className={classes["header-cell"]}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(posts || []).length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text ta="center" c="dimmed" py="md">
                    No recruitment posts found
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              (posts || []).map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td className={classes["row-content"]}>
                    <Badge color={statusColor(row.status)}>{row.status}</Badge>
                  </Table.Td>
                  <Table.Td className={classes["row-content"]}>
                    {row.post_code}
                  </Table.Td>
                  <Table.Td
                    className={classes["row-content"]}
                    style={{ textAlign: "left", maxWidth: 260 }}
                  >
                    {row.title}
                  </Table.Td>
                  <Table.Td className={classes["row-content"]}>
                    {row.employment_type}
                  </Table.Td>
                  <Table.Td className={classes["row-content"]}>
                    {row.openings}
                  </Table.Td>
                  <Table.Td className={classes["row-content"]}>
                    {row.application_deadline
                      ? new Date(row.application_deadline).toLocaleDateString()
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
                      <Button
                        onClick={() => setDeleteId(row.id)}
                        variant="outline"
                        color="red"
                        size="xs"
                        style={{ borderRadius: "8px" }}
                      >
                        <Trash size={16} style={{ margin: 3 }} /> Delete
                      </Button>
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
        title="Delete Recruitment Post?"
      />
    </>
  );
}

RecruitmentPostsTable.propTypes = {
  posts: PropTypes.arrayOf(PropTypes.shape({})),
  onView: PropTypes.func,
  onRefresh: PropTypes.func,
};

export default RecruitmentPostsTable;

import PropTypes from "prop-types";
import { useState } from "react";
import { Table, Button, ScrollArea, Text } from "@mantine/core";
import { Eye, Trash } from "@phosphor-icons/react";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import classes from "../../../RSPC/styles/tableStyle.module.css";
import ConfirmationModal from "../../../RSPC/helpers/confirmationModal";
import { fetchStaffAppointmentsRoute } from "../../../../routes/RSPCRoutes/index";

function StaffAppointmentsTable({ appointments, onView, onRefresh }) {
  const [deleteId, setDeleteId] = useState(null);

  const handleDelete = async () => {
    try {
      await axios.delete(`${fetchStaffAppointmentsRoute}${deleteId}/`);
      notifications.show({
        title: "Deleted",
        message: "Appointment deleted",
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
              <Table.Th className={classes["header-cell"]}>ID</Table.Th>
              <Table.Th className={classes["header-cell"]}>
                Appointment No.
              </Table.Th>
              <Table.Th className={classes["header-cell"]}>
                Employee Code
              </Table.Th>
              <Table.Th className={classes["header-cell"]}>Applicant</Table.Th>
              <Table.Th className={classes["header-cell"]}>
                Designation
              </Table.Th>
              <Table.Th className={classes["header-cell"]}>
                Joining Date
              </Table.Th>
              <Table.Th className={classes["header-cell"]}>
                Contract End Date
              </Table.Th>
              <Table.Th className={classes["header-cell"]}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(appointments || []).length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text ta="center" c="dimmed" py="md">
                    No staff appointments found
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              (appointments || []).map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td className={classes["row-content"]}>{row.id}</Table.Td>
                  <Table.Td className={classes["row-content"]}>
                    {row.appointment_number}
                  </Table.Td>
                  <Table.Td className={classes["row-content"]}>
                    {row.employee_code}
                  </Table.Td>
                  <Table.Td className={classes["row-content"]}>
                    {row.applicant_name || "-"}
                  </Table.Td>
                  <Table.Td className={classes["row-content"]}>
                    {row.designation}
                  </Table.Td>
                  <Table.Td className={classes["row-content"]}>
                    {row.joining_date
                      ? new Date(row.joining_date).toLocaleDateString()
                      : "-"}
                  </Table.Td>
                  <Table.Td className={classes["row-content"]}>
                    {row.contract_end_date
                      ? new Date(row.contract_end_date).toLocaleDateString()
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
        title="Delete Appointment?"
      />
    </>
  );
}

StaffAppointmentsTable.propTypes = {
  appointments: PropTypes.arrayOf(PropTypes.shape({})),
  onView: PropTypes.func,
  onRefresh: PropTypes.func,
};

export default StaffAppointmentsTable;

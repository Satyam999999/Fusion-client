import PropTypes from "prop-types";
import {
  Modal, Text, Badge, Grid, Divider, Group, Stack, Table
} from "@mantine/core";
import { badgeColor } from "../../helpers/badgeColours";
import ExpenditureTable from "../tables/expenditureTable";

function ProjectViewModal({ opened, onClose, projectData }) {
  if (!projectData) return null;

  const expenditures = projectData.expenditures || [];

  const InfoRow = ({ label, value }) => (
    <Grid.Col span={6}>
      <Text size="sm">
        <span style={{ color:"#A0A0A0" }}>{label}: </span>
        {value || "—"}
      </Text>
    </Grid.Col>
  );

  return (
    <Modal opened={opened} onClose={onClose} size="xl"
      styles={{ content: { borderLeft:"0.7rem solid #15ABFF" } }}
      title={
        <Group>
          <Text fw={700} size="xl">{projectData.title}</Text>
          <Badge color={badgeColor[projectData.status]||"gray"} size="lg"
            style={{color:"#3f3f3f"}}>{projectData.status}</Badge>
        </Group>
      }
    >
      <Grid gutter="xs" mb="md">
        <InfoRow label="Project Number" value={projectData.project_number}/>
        <InfoRow label="Principal Investigator" value={projectData.pi_name||projectData.principal_investigator}/>
        <InfoRow label="Funding Agency" value={projectData.funding_agency_name||projectData.funding_agency}/>
        <InfoRow label="Sanctioned Amount" value={projectData.sanctioned_amount ? `₹${Number(projectData.sanctioned_amount).toLocaleString("en-IN")}` : null}/>
        <InfoRow label="Start Date" value={projectData.start_date ? new Date(projectData.start_date).toLocaleDateString() : null}/>
        <InfoRow label="End Date" value={projectData.original_end_date ? new Date(projectData.original_end_date).toLocaleDateString() : null}/>
        <InfoRow label="Duration" value={projectData.duration_months ? `${projectData.duration_months} months` : null}/>
        <InfoRow label="Research Area" value={projectData.research_area_name||projectData.research_area}/>
        <Grid.Col span={12}>
          <Text size="sm">
            <span style={{color:"#A0A0A0"}}>Description: </span>
            {projectData.description}
          </Text>
        </Grid.Col>
      </Grid>

      {expenditures.length > 0 && (
        <>
          <Divider my="sm" label="Expenditures" labelPosition="center"/>
          <ExpenditureTable expenditures={expenditures} onRefresh={()=>{}}/>
        </>
      )}
    </Modal>
  );
}

ProjectViewModal.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  projectData: PropTypes.object,
};
export default ProjectViewModal;
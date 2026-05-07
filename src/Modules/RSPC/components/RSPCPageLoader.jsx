import { Center, Loader, Stack, Text } from "@mantine/core";

export default function RSPCPageLoader() {
  return (
    <Center py="xl" className="rspc-section">
      <Stack align="center" gap="xs">
        <Loader color="var(--rspc-primary)" size="lg" />
        <Text size="sm" c="dimmed">
          Loading RSPC workspace...
        </Text>
      </Stack>
    </Center>
  );
}

import { useState } from "react";
import {
  Button,
  Center,
  Container,
  Divider,
  Paper,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { host } from "../routes/globalRoutes";

function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");

  const handleReset = (event) => {
    event.preventDefault();
    const baseUrl = `${host}/password-reset/`;
    const trimmed = identifier.trim();
    const resetUrl = trimmed
      ? `${baseUrl}?email=${encodeURIComponent(trimmed)}`
      : baseUrl;
    window.location.href = resetUrl;
  };

  return (
    <Center w="100%">
      <Container w={420} my={100}>
        <Title ta="center">Reset Password</Title>

        <Paper
          withBorder
          shadow="lg"
          p={30}
          mt={40}
          radius="md"
          style={{ border: "2px solid #15ABFF" }}
        >
          <Text size="sm">
            Forgotten your password? Enter your e-mail address below, and we
            will send you an e-mail allowing you to reset it.
          </Text>
          <Divider my="md" />
          <form onSubmit={handleReset}>
            <TextInput
              label="Username/Email"
              type="email"
              placeholder="username or email"
              value={identifier}
              onChange={(event) => setIdentifier(event.currentTarget.value)}
              required
            />
            <Button fullWidth mt="xl" bg="#15ABFF" type="submit">
              Reset Password
            </Button>
          </form>
          <Divider my="md" />
          <Text size="sm">
            Please contact CC admin if you have any trouble resetting your
            password.
          </Text>
        </Paper>
      </Container>
    </Center>
  );
}

export default ForgotPassword;

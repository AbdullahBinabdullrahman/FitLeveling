import { useState } from "react";
import { useAuth } from "../lib/auth";
import { socialReady } from "../lib/supabase";
import {
  Screen,
  Card,
  Heading,
  Body,
  Field,
  Button,
  Row,
  Status,
  useTask,
} from "../components/ui";
export default function Login() {
  const auth = useAuth(),
    task = useTask();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [code, setCode] = useState(""),
    [signup, setSignup] = useState(false);
  return (
    <Screen
      title="Level up, every day."
      subtitle="Train, grow, and find your people."
    >
      <Card>
        <Heading>
          {auth.socialPending
            ? "Keep your progress together"
            : signup
              ? "Start your journey"
              : "Welcome back"}
        </Heading>
        <Body muted>
          {auth.socialPending
            ? "Link an existing account, or create a new one. Your old progress is never merged just because an email matches."
            : "Your website account works here too."}
        </Body>
        <Status error={task.error} loading={task.busy} />
        {auth.socialPending ? (
          <>
            <Field
              label="Existing account email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Field
              label="Existing password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Button
              title="Link existing account"
              disabled={task.busy || !email || !password}
              onPress={() =>
                task.run(() => auth.finishSocial("link", email, password))
              }
            />
            <Field
              label="Invitation code for a new account"
              value={code}
              onChangeText={setCode}
              autoCapitalize="none"
            />
            <Button
              title="Create a new FitLeveling account"
              secondary
              disabled={task.busy}
              onPress={() =>
                task.run(() =>
                  auth.finishSocial("create", undefined, undefined, code),
                )
              }
            />
          </>
        ) : (
          <>
            {signup && (
              <Field label="Your name" value={name} onChangeText={setName} />
            )}
            <Field
              label="Email"
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Field
              label="Password"
              autoComplete={signup ? "new-password" : "current-password"}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {signup && (
              <Field label="Invite code" value={code} onChangeText={setCode} />
            )}
            <Button
              title={signup ? "Create account" : "Sign in"}
              disabled={
                task.busy ||
                !email ||
                password.length < 10 ||
                (signup && (!name || !code))
              }
              onPress={() =>
                task.run(() =>
                  auth.login(
                    email,
                    password,
                    signup ? { name, code } : undefined,
                  ),
                )
              }
            />
            <Button
              title={signup ? "I already have an account" : "Create an account"}
              secondary
              disabled={task.busy}
              onPress={() => setSignup(!signup)}
            />
            <Body muted>Or continue with your connected account</Body>
            <Row>
              {(["google", "apple"] as const).map((provider) => (
                <Button
                  key={provider}
                  title={provider === "google" ? "Google" : "Apple"}
                  secondary
                  disabled={!socialReady || task.busy}
                  onPress={() => task.run(() => auth.social(provider))}
                />
              ))}
            </Row>
            {!socialReady && (
              <Body muted>
                Social sign-in will be available once the provider configuration
                is connected.
              </Body>
            )}
          </>
        )}
      </Card>
    </Screen>
  );
}

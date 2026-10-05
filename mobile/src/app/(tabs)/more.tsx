import { router, type Href } from "expo-router";
import { Screen, Card, Heading, Body, Button } from "../../components/ui";
export default function More() {
  return (
    <Screen title="Your adventure" subtitle="Make it your own.">
      {[
        ["Your hero", "Skins, accessories and effects", "/hero"],
        ["Equipment shop", "Spend your earned coins", "/shop"],
        ["Habits & hobbies", "Small steps and shared interests", "/habits"],
        [
          "Progress & nutrition",
          "Check in and track your journey",
          "/progress",
        ],
        [
          "Account & preferences",
          "Profile, notifications and coach settings",
          "/settings",
        ],
      ].map(([title, subtitle, path]) => (
        <Card key={path}>
          <Heading>{title}</Heading>
          <Body muted>{subtitle}</Body>
          <Button
            title="Open"
            secondary
            onPress={() => router.push(path as Href)}
          />
        </Card>
      ))}
    </Screen>
  );
}

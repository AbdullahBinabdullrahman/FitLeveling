import {
  pgTable,
  serial,
  index,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  date,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").defaultRandom().primaryKey();
const created = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  hasPassword: boolean("has_password").notNull().default(true),
  createdAt: created(),
});
export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  heightCm: numeric("height_cm"),
  currentWeightKg: numeric("current_weight_kg"),
  startingWeightKg: numeric("starting_weight_kg"),
  birthYear: integer("birth_year"),
  sexForEstimate: text("sex_for_estimate"),
  activityFactor: numeric("activity_factor").default("1.375"),
  goal: text("goal").default("lose"),
  calorieTarget: integer("calorie_target").default(2200),
  proteinMin: integer("protein_min").default(160),
  proteinMax: integer("protein_max").default(170),
  targetMode: text("target_mode").default("manual"),
  level: integer("level").default(1).notNull(),
  lifetimeXp: integer("lifetime_xp").default(0).notNull(),
  coins: integer("coins").default(0).notNull(),
  timezone: text("timezone").default("Asia/Riyadh").notNull(),
});
export const exercises = pgTable("exercises", {
  id: id(),
  name: text("name").notNull().unique(),
  muscleGroup: text("muscle_group"),
  incrementKg: numeric("increment_kg").default("2.5"),
});
export const templates = pgTable("workout_templates", {
  id: id(),
  userId: uuid("user_id").references(() => users.id),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  active: boolean("active").default(true).notNull(),
});
export const templateExercises = pgTable("template_exercises", {
  id: id(),
  templateId: uuid("template_id")
    .references(() => templates.id, { onDelete: "cascade" })
    .notNull(),
  exerciseId: uuid("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  position: integer("position").notNull(),
  sets: integer("sets").default(3).notNull(),
  repMin: integer("rep_min"),
  repMax: integer("rep_max"),
  tracking: text("tracking").default("reps").notNull(),
  targets: jsonb("targets")
    .$type<import("@/lib/training-metrics").Targets>()
    .default({})
    .notNull(),
});
export const sessions = pgTable("workout_sessions", {
  id: id(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  templateId: uuid("template_id")
    .references(() => templates.id)
    .notNull(),
  status: text("status").default("active").notNull(),
  startedAt: created(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
export const sets = pgTable(
  "workout_sets",
  {
    id: id(),
    sessionId: uuid("session_id")
      .references(() => sessions.id, { onDelete: "cascade" })
      .notNull(),
    exerciseId: uuid("exercise_id")
      .references(() => exercises.id)
      .notNull(),
    setNumber: integer("set_number").notNull(),
    weightKg: numeric("weight_kg"),
    reps: integer("reps"),
    metrics: jsonb("metrics")
      .$type<import("@/lib/training-metrics").Targets>()
      .default({})
      .notNull(),
    completedAt: created(),
  },
  (t) => [
    uniqueIndex("session_exercise_set").on(
      t.sessionId,
      t.exerciseId,
      t.setNumber,
    ),
  ],
);
export const xpTransactions = pgTable("xp_transactions", {
  id: id(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  eventKey: text("event_key").notNull().unique(),
  createdAt: created(),
});
export const coinTransactions = pgTable("coin_transactions", {
  id: id(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  eventKey: text("event_key").notNull().unique(),
  createdAt: created(),
});
export const rewards = pgTable("rewards", {
  id: id(),
  userId: uuid("user_id").references(() => users.id),
  name: text("name").notNull(),
  cost: integer("cost").notNull(),
  active: boolean("active").default(true).notNull(),
});
export const redemptions = pgTable("reward_redemptions", {
  id: id(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  rewardId: uuid("reward_id")
    .references(() => rewards.id)
    .notNull(),
  costSnapshot: integer("cost_snapshot").notNull(),
  createdAt: created(),
});
export const weights = pgTable("body_weights", {
  id: id(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  weightKg: numeric("weight_kg").notNull(),
  measuredAt: timestamp("measured_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const nutrition = pgTable(
  "nutrition_logs",
  {
    id: id(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    day: date("day").notNull(),
    calories: integer("calories").notNull(),
    proteinG: integer("protein_g").notNull(),
    createdAt: created(),
  },
  (t) => [uniqueIndex("nutrition_user_day").on(t.userId, t.day)],
);
export const inbodyScans = pgTable("inbody_scans", {
  id: id(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  measuredAt: date("measured_at").notNull(),
  weightKg: numeric("weight_kg").notNull(),
  bodyFatPercent: numeric("body_fat_percent"),
  skeletalMuscleKg: numeric("skeletal_muscle_kg"),
  fatMassKg: numeric("fat_mass_kg"),
  measuredBmr: integer("measured_bmr"),
  attachmentKey: text("attachment_key"),
  createdAt: created(),
});
export const targetVersions = pgTable("target_versions", {
  id: id(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  calories: integer("calories").notNull(),
  proteinMin: integer("protein_min").notNull(),
  proteinMax: integer("protein_max").notNull(),
  method: text("method").notNull(),
  inputs: jsonb("inputs").notNull(),
  effectiveAt: created(),
});
export const characters = pgTable("characters", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").default("Nova").notNull(),
  archetype: text("archetype").default("vanguard").notNull(),
  color: text("color").default("mint").notNull(),
  accessory: text("accessory").default("none").notNull(),
  animations: boolean("animations").default(true).notNull(),
  skin: text("skin").default("default").notNull(),
  aura: text("aura").default("none").notNull(),
  weapon: text("weapon").default("unarmed").notNull(),
  trinket: text("trinket").default("no-trinket").notNull(),
  vfx: text("vfx").default("no-vfx").notNull(),
});
export const coachSettings = pgTable("coach_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").default("builtin").notNull(),
  model: text("model").default("").notNull(),
  encryptedApiKey: text("encrypted_api_key"),
  lastRequestAt: timestamp("last_request_at", { withTimezone: true }),
});

export const coachCheckins = pgTable(
  "coach_checkins",
  {
    id: id(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    day: date("day").notNull(),
    goal: text("goal").notNull(),
    energy: integer("energy").notNull(),
    sleepHours: numeric("sleep_hours").notNull(),
    notes: text("notes").notNull(),
    preferences: text("preferences").notNull(),
    createdAt: created(),
  },
  (t) => [uniqueIndex("coach_checkin_user_day").on(t.userId, t.day)],
);
export const trainingVersions = pgTable("training_versions", {
  id: id(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  plan: jsonb("plan").notNull(),
  context: jsonb("context").notNull(),
  createdAt: created(),
});

export const cosmeticInventory = pgTable(
  "cosmetic_inventory",
  {
    id: id(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    itemId: text("item_id").notNull(),
    pricePaid: integer("price_paid").notNull(),
    createdAt: created(),
  },
  (t) => [uniqueIndex("cosmetic_inventory_user_item").on(t.userId, t.itemId)],
);
export const communityProfiles = pgTable("community_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  alias: text("alias").notNull(),
  joinedAt: created(),
});
export const communityCheers = pgTable(
  "community_cheers",
  {
    id: id(),
    fromUserId: uuid("from_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    toUserId: uuid("to_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    week: date("week").notNull(),
    createdAt: created(),
  },
  (t) => [
    uniqueIndex("community_cheer_pair_week").on(
      t.fromUserId,
      t.toUserId,
      t.week,
    ),
  ],
);

export const friendships = pgTable(
  "friendships",
  {
    id: id(),
    lowUserId: uuid("low_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    highUserId: uuid("high_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    requestedBy: uuid("requested_by")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    status: text("status").notNull().default("pending"),
    blockedBy: uuid("blocked_by").references(() => users.id, {
      onDelete: "cascade",
    }),
    lowReadAt: timestamp("low_read_at", { withTimezone: true }),
    highReadAt: timestamp("high_read_at", { withTimezone: true }),
    createdAt: created(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("friendship_pair").on(t.lowUserId, t.highUserId)],
).enableRLS();
export const directMessages = pgTable(
  "direct_messages",
  {
    id: serial("id").primaryKey(),
    friendshipId: uuid("friendship_id")
      .references(() => friendships.id, { onDelete: "cascade" })
      .notNull(),
    senderId: uuid("sender_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id").notNull(),
    body: text("body").notNull(),
    createdAt: created(),
  },
  (t) => [
    uniqueIndex("message_send_once").on(t.senderId, t.clientId),
    index("message_conversation_order").on(t.friendshipId, t.id),
  ],
).enableRLS();

export const guilds = pgTable("guilds", {
  id: id(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  hobbies: jsonb("hobbies").$type<string[]>().notNull().default([]),
  createdAt: created(),
}).enableRLS();
export const guildMembers = pgTable(
  "guild_members",
  {
    id: id(),
    guildId: uuid("guild_id")
      .notNull()
      .references(() => guilds.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    createdAt: created(),
  },
  (t) => [uniqueIndex("guild_member_pair").on(t.guildId, t.userId)],
).enableRLS();
export const hobbies = pgTable("hobbies", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
}).enableRLS();
export const habits = pgTable("habits", {
  id: id(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: created(),
}).enableRLS();
export const habitChecks = pgTable(
  "habit_checks",
  {
    id: id(),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
  },
  (t) => [uniqueIndex("habit_day").on(t.habitId, t.day)],
).enableRLS();

export const coachMessages = pgTable(
  "coach_messages",
  {
    id: id(),
    position: serial("position").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    proposal: jsonb("proposal"),
    components: jsonb("components").default([]).notNull(),
    base: jsonb("base"),
    status: text("status").notNull().default("pending"),
    createdAt: created(),
  },
  (t) => [
    uniqueIndex("coach_message_retry").on(t.userId, t.clientId, t.role),
    index("coach_message_history").on(t.userId, t.position),
  ],
).enableRLS();

export const authIdentities = pgTable("auth_identities", {
  authUserId: uuid("auth_user_id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: created(),
}).enableRLS();
export const notificationDevices = pgTable("notification_devices", {
  installationId: uuid("installation_id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  social: boolean("social").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}).enableRLS();

// One bank circulates the fixed in-game supply; purchases return coins to it.
export const coinTreasury = pgTable("coin_treasury", {
  id: integer("id").primaryKey(),
  supply: integer("supply").notNull(),
  balance: integer("balance").notNull(),
}).enableRLS();

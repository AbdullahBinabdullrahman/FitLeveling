import { db, sql } from './index';
import { exercises, templates, templateExercises, rewards, users, profiles } from './schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { z } from 'zod';

async function seedInitialUser() {
  const email = process.env.SEED_USER_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_USER_PASSWORD;
  const name = process.env.SEED_USER_NAME?.trim() || 'LevelUp Admin';
  if (!email && !password) return;
  if (!email || !password) throw new Error('Set both SEED_USER_EMAIL and SEED_USER_PASSWORD');
  z.object({ email: z.email(), password: z.string().min(10), name: z.string().min(2) }).parse({ email, password, name });
  const passwordHash = await hash(password, 12);
  await db.transaction(async tx => {
    await tx.insert(users).values({ email, name, passwordHash }).onConflictDoNothing({ target: users.email });
    const [user] = await tx.select().from(users).where(eq(users.email, email));
    await tx.insert(profiles).values({ userId: user.id }).onConflictDoNothing({ target: profiles.userId });
  });
  console.log(`Initial user ready: ${email}`);
}

const plan = [
  ['PUSH', [['Chest Press',8,12],['Incline Chest Press',8,12],['Shoulder Press',8,12],['Triceps Pushdown',10,12]]],
  ['PULL', [['Lat Pulldown',8,12],['Seated Row',8,12],['Machine Row',8,12],['Biceps Curl',10,12]]],
  ['LEGS', [['Leg Press',8,12],['Leg Extension',10,12],['Leg Curl',10,12],['Calf Raise',12,15]]]
] as const;
async function main() { await seedInitialUser(); for (let i=0;i<plan.length;i++) { const [name, items] = plan[i]; let [template] = await db.select().from(templates).where(eq(templates.name,name)); if (!template) [template] = await db.insert(templates).values({ name, position:i }).returning(); for (let j=0;j<items.length;j++) { const [label,min,max] = items[j]; let [exercise] = await db.select().from(exercises).where(eq(exercises.name,label)); if (!exercise) [exercise] = await db.insert(exercises).values({ name:label }).returning(); const existing = await db.select().from(templateExercises).where(eq(templateExercises.templateId,template.id)); if (!existing.some(x=>x.exerciseId===exercise.id)) await db.insert(templateExercises).values({ templateId:template.id, exerciseId:exercise.id, position:j, sets:3, repMin:min, repMax:max }); } } for (const [name,cost] of [['Favorite coffee',60],['Planned snack',100],['Flexible meal',200],['Gaming night',250],['Small purchase',500]] as const) { const existing=await db.select().from(rewards).where(eq(rewards.name,name)); if (!existing.length) await db.insert(rewards).values({ name,cost }); } await sql.end(); }
main().catch(async e=>{ console.error(e); await sql.end(); process.exit(1); });

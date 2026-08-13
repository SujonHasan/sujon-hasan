/**
 * Resets an admin user's password.
 *
 * There is no password-change screen in the admin panel, so this is the way
 * to rotate the credential. Reads the new password from stdin rather than an
 * argument, so it never lands in shell history or the process list.
 *
 *   node scripts/reset-admin-password.mjs [email]
 *
 * Defaults to the single admin account if no email is given.
 */
import { createInterface } from "node:readline";
import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Same cost factor the User model uses, so rotated hashes match fresh ones.
const BCRYPT_ROUNDS = 12;
const MIN_LENGTH = 12;

function loadEnv() {
  if (process.env.MONGODB_URI) return;
  for (const file of [".env.local", ".env"]) {
    try {
      for (const line of readFileSync(file, "utf8").split("\n")) {
        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
      }
    } catch {
      // File is optional.
    }
  }
}

function ask(question, { silent = false } = {}) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });

  return new Promise((resolve) => {
    if (silent) {
      // Suppress echo so the password is not shown while typing.
      const onData = (char) => {
        if (["\n", "\r", ""].includes(char.toString())) process.stdin.removeListener("data", onData);
        else process.stdout.write("[2K[200D" + question);
      };
      process.stdin.on("data", onData);
    }
    rl.question(question, (answer) => {
      rl.close();
      if (silent) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  loadEnv();
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set — add it to .env.local or the environment.");
  }

  const password = await ask("New password: ", { silent: true });
  if (password.length < MIN_LENGTH) {
    throw new Error(`Password must be at least ${MIN_LENGTH} characters.`);
  }
  const confirm = await ask("Confirm password: ", { silent: true });
  if (password !== confirm) {
    throw new Error("Passwords do not match.");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const users = mongoose.connection.db.collection("users");

  const email = process.argv[2]?.toLowerCase();
  const query = email ? { email } : { role: "admin" };
  const matches = await users.countDocuments(query);

  if (matches === 0) {
    throw new Error(email ? `No user with email ${email}.` : "No admin user found.");
  }
  if (matches > 1) {
    throw new Error(`${matches} users matched — pass the email explicitly.`);
  }

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await users.updateOne(query, { $set: { password: hash, updatedAt: new Date() } });

  const user = await users.findOne(query);
  console.log(`\n✅ Password updated for ${user.email} (${user.role}).`);
  console.log("   Log in at /admin/login with the new password.");
}

main()
  .catch((error) => {
    console.error(`\n❌ ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());

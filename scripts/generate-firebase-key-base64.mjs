#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function extractPrivateKey(input) {
  const trimmed = input.trim();

  // Case 1: Full env assignment, for example:
  // FIREBASE_PRIVATE_KEY_BASE64="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
  const assignmentMatch = trimmed.match(/^\s*[A-Z0-9_]+\s*=\s*(.+)\s*$/m);
  const rawValue = assignmentMatch ? assignmentMatch[1].trim() : trimmed;

  // Remove surrounding single/double quotes if present.
  const unquoted = rawValue.replace(/^['"]|['"]$/g, "");

  // Convert literal \n sequences to actual newlines.
  const withNewlines = unquoted.replace(/\\n/g, "\n").trim();

  if (!withNewlines.includes("-----BEGIN PRIVATE KEY-----") || !withNewlines.includes("-----END PRIVATE KEY-----")) {
    throw new Error("Could not find a valid PEM private key block in input.");
  }

  // Ensure exactly one trailing newline to keep format stable.
  return `${withNewlines}\n`;
}

function toBase64(plainText) {
  return Buffer.from(plainText, "utf8").toString("base64");
}

function main() {
  const inputArg = process.argv[2] ?? "source.txt";
  const inputPath = path.resolve(process.cwd(), inputArg);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(inputPath, "utf8");
  const privateKey = extractPrivateKey(content);
  const base64 = toBase64(privateKey);

  console.log("FIREBASE_PRIVATE_KEY_BASE64=" + base64);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("Failed to generate FIREBASE_PRIVATE_KEY_BASE64: " + message);
  process.exit(1);
}

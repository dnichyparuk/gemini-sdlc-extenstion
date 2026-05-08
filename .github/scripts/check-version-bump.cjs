#!/usr/bin/env node
/**
 * check-version-bump.cjs
 * CI script: verifies that the extension version is bumped when files change.
 *
 * Usage:
 *   node check-version-bump.cjs [--base <ref>]
 *
 * Environment variables (set by GitHub Actions):
 *   BASE_REF  — base commit SHA (from PR base)
 *
 * Exit codes: 0 = pass, 1 = version bump required, 2 = script error
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  let base = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base' && args[i + 1]) {
      base = args[++i];
    }
  }

  return { base };
}

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function getChangedFiles(baseRef, repoRoot) {
  const output = execSync(`git diff --name-only ${baseRef}...HEAD`, {
    encoding: 'utf-8',
    cwd: repoRoot,
  });
  return output.trim().split('\n').filter(Boolean);
}

function getVersionFromRef(ref, filePath, repoRoot) {
  try {
    const content = execSync(`git show ${ref}:${filePath}`, {
      encoding: 'utf-8',
      cwd: repoRoot,
    });
    return JSON.parse(content).version || null;
  } catch {
    // File doesn't exist in base branch (new extension) or other git error
    return null;
  }
}

// ---------------------------------------------------------------------------
// Version comparison
// ---------------------------------------------------------------------------

function isVersionBumped(baseVersion, headVersion) {
  if (!baseVersion) return true;  // New — any version is valid
  if (!headVersion) return false; // Version removed — invalid
  if (baseVersion === headVersion) return false; // Same — not bumped

  const base = baseVersion.split('.').map(Number);
  const head = headVersion.split('.').map(Number);

  for (let i = 0; i < Math.max(base.length, head.length); i++) {
    const b = base[i] || 0;
    const h = head[i] || 0;
    if (h > b) return true;
    if (h < b) return false;
  }
  return false; // Equal after normalization
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const repoRoot = process.cwd();
  const { base: argBase } = parseArgs(process.argv);
  const baseRef = process.env.BASE_REF || argBase;

  if (!baseRef) {
    process.stderr.write('Error: BASE_REF environment variable or --base argument required\n');
    process.stderr.write('Usage: node check-version-bump.cjs --base <ref>\n');
    process.exit(2);
  }

  const extensionManifestPath = 'gemini-extension.json';
  const absManifestPath = path.join(repoRoot, extensionManifestPath);

  if (!fs.existsSync(absManifestPath)) {
    process.stderr.write('Error: gemini-extension.json not found in repository root\n');
    process.exit(2);
  }

  let headVersion;
  try {
    headVersion = JSON.parse(fs.readFileSync(absManifestPath, 'utf-8')).version || null;
  } catch (err) {
    process.stderr.write(`Error reading gemini-extension.json: ${err.message}\n`);
    process.exit(2);
  }

  let changedFiles;
  try {
    changedFiles = getChangedFiles(baseRef, repoRoot);
  } catch (err) {
    process.stderr.write(`Error running git diff: ${err.message}\n`);
    process.exit(2);
  }

  // Exclude files that don't trigger a version bump requirement
  const ignorePatterns = [
    /^\.github\//,
    /^docs\//,
    /^tests\//,
    /^site\//,
    /^README\.md$/,
    /^CHANGELOG\.md$/,
    /^LICENSE$/,
    /^GEMINI\.md$/,
    /^GUIDE\.md$/,
    /^Taskfile\.yml$/,
    /^\.gitignore$/,
    /^\.sdlc\//,
  ];

  const relevantChanges = changedFiles.filter(f => !ignorePatterns.some(p => p.test(f)));

  if (relevantChanges.length === 0) {
    console.log('No core extension files changed — version check not required.');
    process.exit(0);
  }

  const baseVersion = getVersionFromRef(baseRef, extensionManifestPath, repoRoot);
  const bumped = isVersionBumped(baseVersion, headVersion);

  if (bumped) {
    const from = baseVersion ? baseVersion : '(new)';
    console.log(`PASS: sdlc-gemini — ${from} -> ${headVersion}`);
    process.exit(0);
  } else {
    console.log(`FAIL: sdlc-gemini — version not bumped (${baseVersion} -> ${headVersion})`);
    console.log(
      `::error file=${extensionManifestPath}::` +
      `Extension has modified core files but version was not bumped ` +
      `(still ${headVersion}). Update the version in ${extensionManifestPath}.`
    );
    process.exit(1);
  }
}

main();

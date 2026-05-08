#!/usr/bin/env node
/**
 * check-changelog.cjs
 * CI script: validates that CHANGELOG.md contains an entry for the current version.
 *
 * Reads: .sdlc/config.json
 *
 * Exit codes: 0 = pass / skipped, 1 = validation failure, 2 = script error
 */

'use strict';

const fs   = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function exec(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', ...opts }).trim();
  } catch (_) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function readVersionConfig(repoRoot) {
  const sdlcPath = path.join(repoRoot, '.sdlc', 'config.json');
  if (fs.existsSync(sdlcPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(sdlcPath, 'utf8'));
      return config.version || null;
    } catch (_) {
      return null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Version resolution
// ---------------------------------------------------------------------------

function resolveVersionFromFile(config, repoRoot) {
  const versionFilePath = path.join(repoRoot, config.versionFile);
  if (!fs.existsSync(versionFilePath)) {
    process.stderr.write(`Warning: version file not found: ${config.versionFile}\n`);
    return null;
  }

  const content = fs.readFileSync(versionFilePath, 'utf8');
  const fileType = (config.fileType || '').toLowerCase();

  if (fileType === 'package.json' || fileType === 'plugin.json' || fileType === 'gemini-extension.json') {
    try {
      return JSON.parse(content).version || null;
    } catch (_) {
      process.stderr.write(`Warning: could not parse ${config.versionFile} as JSON\n`);
      return null;
    }
  } else if (fileType === 'cargo.toml' || fileType === 'pyproject.toml') {
    const match = content.match(/^version\s*=\s*"([^"]+)"/m);
    return match ? match[1] : null;
  } else if (fileType === 'pubspec.yaml') {
    const match = content.match(/^version:\s*(.+)$/m);
    return match ? match[1].trim() : null;
  } else {
    return content.trim() || null;
  }
}

function resolveVersionFromTags(repoRoot) {
  const out = exec('git tag --list --sort=-v:refname', { cwd: repoRoot });
  if (!out) return null;

  const tags = out.split('\n');
  const semverTag = tags.find(t => /^v?\d+\.\d+\.\d+/.test(t));
  if (!semverTag) return null;

  return semverTag.replace(/^v/, '');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const repoRoot = process.cwd();

  const config = readVersionConfig(repoRoot);
  if (!config) {
    console.log('No version config found in .sdlc/config.json. Skipping changelog check.');
    process.exit(0);
  }

  if (config.changelog !== true) {
    console.log('Changelog check disabled in config.');
    process.exit(0);
  }

  let version = null;
  if (config.mode === 'file') {
    version = resolveVersionFromFile(config, repoRoot);
  } else if (config.mode === 'tag') {
    version = resolveVersionFromTags(repoRoot);
  } else {
    version = resolveVersionFromFile(config, repoRoot);
  }

  if (!version) {
    process.stderr.write(`Warning: could not determine current version. Skipping changelog check.\n`);
    process.exit(0);
  }

  const changelogFile = config.changelogFile || 'CHANGELOG.md';
  const changelogPath = path.join(repoRoot, changelogFile);

  if (!fs.existsSync(changelogPath)) {
    console.log(`FAIL: changelog: true in config but ${changelogFile} does not exist.`);
    process.exit(1);
  }

  const changelogContent = fs.readFileSync(changelogPath, 'utf8');
  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const entryRegex = new RegExp(`^##\\s*\\[${escapedVersion}\\]`, 'm');

  if (entryRegex.test(changelogContent)) {
    console.log(`PASS: changelog entry found for v${version}`);
    process.exit(0);
  } else {
    console.log(`FAIL: no changelog entry for v${version} in ${changelogFile}`);
    console.log(`::error file=${changelogFile}::No changelog entry found for v${version}. Run /version-sdlc --changelog to add the missing entry.`);
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  process.stderr.write(`Unexpected error in check-changelog.cjs: ${err.message}\n${err.stack}\n`);
  process.exit(2);
}

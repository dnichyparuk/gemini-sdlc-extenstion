#!/usr/bin/env node
/**
 * retag-release.cjs
 * CI script: ensures the current version's git tag points to HEAD on the main branch.
 */

'use strict';

const fs   = require('node:fs');
const path = require('node:path');
const os   = require('node:os');
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

function execOrThrow(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...opts }).trim();
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
    } catch (err) {
      process.stderr.write(`Error parsing .sdlc/config.json: ${err.message}\n`);
      process.exit(1);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Version resolution
// ---------------------------------------------------------------------------

function resolveTagFromFile(config, repoRoot) {
  const versionFilePath = path.join(repoRoot, config.versionFile);
  if (!fs.existsSync(versionFilePath)) {
    process.stderr.write(`Version file not found: ${config.versionFile}\n`);
    process.exit(1);
  }

  const content = fs.readFileSync(versionFilePath, 'utf8');
  let version = null;

  if (config.fileType === 'package.json' || config.fileType === 'plugin.json' || config.fileType === 'gemini-extension.json') {
    try {
      version = JSON.parse(content).version || null;
    } catch (err) {
      process.stderr.write(`Error parsing ${config.versionFile}: ${err.message}\n`);
      process.exit(1);
    }
  } else if (config.fileType === 'cargo.toml' || config.fileType === 'pyproject.toml') {
    const match = content.match(/^\s*version\s*=\s*"([^"]+)"/m);
    version = match ? match[1] : null;
  } else if (config.fileType === 'pubspec.yaml') {
    const match = content.match(/^\s*version\s*:\s*(\S+)/m);
    version = match ? match[1] : null;
  } else {
    version = content.trim().split('\n')[0].trim() || null;
  }

  if (!version) {
    process.stderr.write(`Could not read version from ${config.versionFile}\n`);
    process.exit(1);
  }

  const prefix = config.tagPrefix || '';
  return `${prefix}${version}`;
}

function resolveTagFromTags(config, repoRoot) {
  const prefix = config.tagPrefix || '';
  const out = exec('git tag --list --sort=-v:refname', { cwd: repoRoot });
  if (!out) return null;

  const tags = out.split('\n').filter(t => {
    const rest = prefix ? t.startsWith(prefix) ? t.slice(prefix.length) : null : t;
    return rest && /^\d+\.\d+\.\d+/.test(rest);
  });

  return tags.length > 0 ? tags[0] : null;
}

// ---------------------------------------------------------------------------
// Tag operations
// ---------------------------------------------------------------------------

function getTagCommit(tag, repoRoot) {
  return exec(`git rev-parse "${tag}^{commit}"`, { cwd: repoRoot, shell: true });
}

function isAncestor(commit, repoRoot) {
  try {
    execSync(`git merge-base --is-ancestor "${commit}" HEAD`, { cwd: repoRoot, stdio: 'pipe' });
    return true;
  } catch (_) {
    return false;
  }
}

function getTagMessage(tag, repoRoot) {
  const msg = exec(`git tag -l --format='%(contents)' "${tag}"`, { cwd: repoRoot, shell: true });
  return msg ? msg.trim() : null;
}

function retagOnHead(tag, repoRoot) {
  const tagCommit = getTagCommit(tag, repoRoot);
  const originalMessage = tagCommit ? getTagMessage(tag, repoRoot) : null;

  if (tagCommit) {
    if (isAncestor(tagCommit, repoRoot)) {
      console.log(`Tag ${tag} is already reachable from HEAD. Nothing to do.`);
      return;
    }
    console.log(`Tag ${tag} points to ${tagCommit} (not reachable from HEAD). Moving to HEAD...`);
    exec(`git push origin ":refs/tags/${tag}"`, { cwd: repoRoot });
    execOrThrow(`git tag -d "${tag}"`, { cwd: repoRoot });
  } else {
    console.log(`Tag ${tag} does not exist. Creating at HEAD...`);
  }

  const tagMessage = originalMessage || `Release ${tag}`;
  const tmpFile = path.join(os.tmpdir(), `retag-msg-${Date.now()}.txt`);
  try {
    fs.writeFileSync(tmpFile, tagMessage, 'utf8');
    execOrThrow(`git tag -a "${tag}" -F "${tmpFile}" HEAD`, { cwd: repoRoot });
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }

  execOrThrow(`git push origin "refs/tags/${tag}"`, { cwd: repoRoot });
  console.log(`Tag ${tag} now points to HEAD.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const repoRoot = process.cwd();

  const config = readVersionConfig(repoRoot);
  if (!config) {
    console.log('No version config found in .sdlc/config.json. Skipping retag.');
    process.exit(0);
  }

  let tag;
  if (config.mode === 'tag') {
    tag = resolveTagFromTags(config, repoRoot);
    if (!tag) {
      console.log('No existing tags found (tag mode). Skipping retag.');
      process.exit(0);
    }
  } else {
    tag = resolveTagFromFile(config, repoRoot);
  }

  console.log(`Expected tag: ${tag}`);
  retagOnHead(tag, repoRoot);
}

main();

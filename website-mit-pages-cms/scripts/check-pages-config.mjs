#!/usr/bin/env node
// Checks a project's .pages.yml against its content files before anything is pushed.
//
// Pages CMS rewrites a file from the schema when saving, so every key in the data
// must be declared in the config, or it is deleted on the first save.
//
// Usage: node check-pages-config.mjs <project folder>
// Needs the "yaml" package in the project (npm i -D yaml).

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const root = resolve(process.argv[2] || '.');
const cfgPath = join(root, '.pages.yml');
if (!existsSync(cfgPath)) {
  console.error(`No .pages.yml in ${root}`);
  process.exit(2);
}

let YAML;
try {
  YAML = createRequire(join(root, 'package.json'))('yaml');
} catch {
  console.error('Package "yaml" not found in the project. Run: npm i -D yaml');
  process.exit(2);
}

const raw = readFileSync(cfgPath, 'utf8');
const cfg = YAML.parse(raw);
const comps = cfg.components || {};
let problems = 0;
let notes = 0;
const bad = (m) => { problems++; console.log('PROBLEM ', m); };
const note = (m) => { notes++; console.log('note    ', m); };

// YAML 1.1 readers turn these into booleans. Pages CMS field names must stay strings.
for (const word of ['no', 'yes', 'on', 'off']) {
  const re = new RegExp(`name:\\s*${word}\\s*[,}\\n]`, 'i');
  if (re.test(raw)) bad(`field name "${word}" is not quoted. Write name: "${word}"`);
}

// Media: map the public output path back to the folder in the repo.
const mediaList = !cfg.media ? [] : typeof cfg.media === 'string'
  ? [{ input: cfg.media, output: `/${cfg.media}` }]
  : Array.isArray(cfg.media) ? cfg.media : [cfg.media];
function imageExists(value) {
  for (const m of mediaList) {
    const out = String(m.output).replace(/\/$/, '');
    if (value.startsWith(out + '/')) return existsSync(join(root, m.input, value.slice(out.length + 1)));
  }
  return null; // outside any media folder, cannot check
}

function resolveField(f) {
  if (!f.component) return f;
  const c = comps[f.component];
  if (!c) { bad(`unknown component "${f.component}" on field "${f.name}"`); return { ...f, type: 'string' }; }
  return { ...c, ...f, type: c.type, fields: c.fields, options: { ...(c.options || {}), ...(f.options || {}) } };
}

function check(value, field, path) {
  const f = resolveField(field);
  if (f.list) {
    if (value === undefined || value === null) return;
    if (!Array.isArray(value)) return bad(`${path} should be a list`);
    if (f.list.min && value.length < f.list.min) bad(`${path} has ${value.length} items, min is ${f.list.min}`);
    if (f.list.max && value.length > f.list.max) bad(`${path} has ${value.length} items, max is ${f.list.max}`);
    const item = { ...f, list: false, component: undefined };
    return value.forEach((v, i) => check(v, item, `${path}[${i}]`));
  }
  if (value === undefined || value === null || value === '') {
    if (f.required) note(`${path} is required but empty`);
    return;
  }
  switch (f.type) {
    case 'object': {
      if (typeof value !== 'object' || Array.isArray(value)) return bad(`${path} should be an object`);
      const names = (f.fields || []).map((x) => String(x.name));
      for (const k of Object.keys(value)) {
        if (!names.includes(k)) bad(`${path}.${k} is not in .pages.yml and would be DELETED on save`);
      }
      for (const sub of f.fields || []) {
        if (!(String(sub.name) in value)) note(`${path}.${sub.name} missing in data (fine if optional)`);
        check(value[sub.name], sub, `${path}.${sub.name}`);
      }
      break;
    }
    case 'select': {
      const allowed = (f.options?.values || []).map((v) => (typeof v === 'object' ? v.name : v));
      for (const v of [].concat(value)) if (!allowed.includes(v)) bad(`${path} value "${v}" is not one of ${allowed.join(', ')}`);
      break;
    }
    case 'number':
      if (typeof value !== 'number') bad(`${path} should be a number, is ${JSON.stringify(value)}`);
      break;
    case 'boolean':
      if (typeof value !== 'boolean') bad(`${path} should be true/false, is ${JSON.stringify(value)}`);
      break;
    case 'image':
    case 'file':
      for (const v of [].concat(value)) {
        if (typeof v !== 'string') { bad(`${path} should be a path`); continue; }
        const ok = imageExists(v);
        if (ok === false) bad(`${path} points to ${v}, but that file does not exist`);
        if (ok === null) note(`${path} = ${v} is outside the media folders`);
      }
      break;
    default:
      if (typeof value !== 'string') bad(`${path} should be text (${f.type}), is ${typeof value}`);
  }
}

function entries(list) {
  return (list || []).flatMap((e) => (e.type === 'group' ? entries(e.items) : [e]));
}

let checked = 0;
for (const e of entries(cfg.content)) {
  if (e.type === 'collection') { note(`collection "${e.name}" (${e.path}) is not checked by this script`); continue; }
  if (e.type !== 'file') continue;
  const file = join(root, e.path);
  if (!existsSync(file)) { bad(`${e.name}: file ${e.path} does not exist`); continue; }
  if (e.format && e.format !== 'json') { note(`${e.name}: format ${e.format} is not checked`); continue; }
  let data;
  try { data = JSON.parse(readFileSync(file, 'utf8')); } catch (err) { bad(`${e.path} is not valid JSON: ${err.message}`); continue; }
  checked++;
  if (Array.isArray(data)) {
    bad(`${e.path} starts with a list. Pages CMS shows it as an empty form. Wrap it: { "items": [ ... ] }`);
    continue;
  }
  if (!e.fields || e.fields.length === 0) { note(`${e.name} has no fields, Pages CMS will show a raw editor`); continue; }
  check(data, { type: 'object', fields: e.fields }, e.name);
}

console.log(`\n${checked} files checked, ${problems} problems, ${notes} notes`);
process.exit(problems ? 1 : 0);

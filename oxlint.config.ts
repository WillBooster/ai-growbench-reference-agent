// wbfy:start oxlint-base
/// <reference types="node" />
import type { OxlintConfig } from 'oxlint';

// oxlint-disable unicorn/prefer-module -- Oxlint only auto-discovers .ts config files, and CommonJS avoids ESM package loading issues.
const oxlintBaseConfig = require('@willbooster/oxlint-config');

// Keep a package-local copy so repositories can add settings outside
// managed blocks without mutating the shared imported config object.
const oxlintResolvedConfig: OxlintConfig = structuredClone(oxlintBaseConfig.default ?? oxlintBaseConfig);
// The type-aware options make lint perform type checking. Always force them on here,
// inside the managed block, so no customization can silently disable type checking.
oxlintResolvedConfig.options = { ...oxlintResolvedConfig.options, typeAware: true, typeCheck: true };
// wbfy:end oxlint-base

// wbfy:start oxlint-export
module.exports = oxlintResolvedConfig;
// wbfy:end oxlint-export

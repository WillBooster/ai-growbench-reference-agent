// wbfy:start oxlint-base
/// <reference types="node" />
// oxlint-disable unicorn/prefer-module -- Oxlint only auto-discovers .ts config files, and CommonJS avoids ESM package loading issues.
const oxlintBaseConfig = require('@willbooster/oxlint-config');

const oxlintResolvedConfig = oxlintBaseConfig.default ?? oxlintBaseConfig;
// wbfy:end oxlint-base

// wbfy:start oxlint-export
module.exports = oxlintResolvedConfig;
// wbfy:end oxlint-export

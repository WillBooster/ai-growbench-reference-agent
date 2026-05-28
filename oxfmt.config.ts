// wbfy:start oxfmt-base
/// <reference types="node" />
// oxlint-disable unicorn/prefer-module -- Oxfmt config files are only auto-discovered as .ts, and CommonJS avoids ESM package loading issues.
const oxfmtConfig = require('@willbooster/oxfmt-config');

const oxfmtResolvedConfig = oxfmtConfig.default ?? oxfmtConfig;
// wbfy:end oxfmt-base

// wbfy:start oxfmt-export
module.exports = oxfmtResolvedConfig;
// wbfy:end oxfmt-export

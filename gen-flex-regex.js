#!/usr/bin/env node

const fs = require('fs');
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function usage() {
  console.log('用法: node gen-flex-regex.js <源码路径> "<Hook字符串>" [保留尾段数]');
}

const args = process.argv.slice(2);
if (args.length < 2) {
  usage();
  process.exit(1);
}

const file = args[0];
const hookStr = args[1];
const keepTail = parseInt(args[2] || '2', 10);

const isCall = hookStr.trim().endsWith('()');
const cleanHook = hookStr.replace(/\(\)$/, '');
const hookSegments = cleanHook.split('.').filter(Boolean);

function extractChain(node) {
  const segments = [];
  let cur = node;
  while (cur) {
    if (cur.type === 'Identifier') {
      segments.unshift(cur.name);
      break;
    } else if (cur.type === 'ThisExpression') {
      segments.unshift('this');
      break;
    } else if (cur.type === 'MemberExpression') {
      if (cur.computed) return null;
      segments.unshift(cur.property.name);
      cur = cur.object;
    } else {
      return null;
    }
  }
  return segments;
}

function buildFlexibleRegex(tailSegs, isCallExpr) {
  let regex = '[A-Za-z$_0-9]{1,3}(?:\\.[A-Za-z$_0-9]{1,6})*?';
  tailSegs.forEach(seg => {
    regex += '\\.' + seg;
  });
  if (isCallExpr) regex += '\\(\\)';
  return regex;
}

function buildSmartRegex(chainSegs, keepTailSegs, isCallExpr) {
  const tailSegs = chainSegs.slice(-keepTailSegs);
  const rootCount = Math.max(chainSegs.length - tailSegs.length, 0);
  let regex = '[A-Za-z$_0-9]{1,3}';
  if (rootCount > 1) {
    regex += '(?:\\.[A-Za-z$_0-9]{1,6}){' + (rootCount - 1) + '}';
  }
  tailSegs.forEach(seg => {
    regex += '\\.' + seg;
  });
  if (isCallExpr) regex += '\\(\\)';
  return regex;
}

const code = fs.readFileSync(file, 'utf8');
const ast = babelParser.parse(code, { sourceType: 'unambiguous' });

let bestMatch = null;
traverse(ast, {
  CallExpression(path) {
    if (!isCall) return;
    const segs = extractChain(path.node.callee);
    if (!segs) return;
    if (segs.slice(-hookSegments.length).join('.') === hookSegments.join('.')) {
      if (!bestMatch || segs.length < bestMatch.length) bestMatch = segs;
    }
  },
  MemberExpression(path) {
    if (isCall) return;
    const segs = extractChain(path.node);
    if (!segs) return;
    if (segs.slice(-hookSegments.length).join('.') === hookSegments.join('.')) {
      if (!bestMatch || segs.length < bestMatch.length) bestMatch = segs;
    }
  }
});

const flexRegex = buildFlexibleRegex(hookSegments.slice(-keepTail), isCall);
console.log('弹性匹配版:', flexRegex);

if (bestMatch) {
  const smartRegex = buildSmartRegex(bestMatch, keepTail, isCall);
  console.log('智能匹配版:', smartRegex);
  console.log('示例链:  ', bestMatch.join('.'));
}

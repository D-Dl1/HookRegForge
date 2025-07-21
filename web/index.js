import * as babelParser from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default || traverseModule;

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

async function run(code, hookStr, keepTail) {
  const isCall = hookStr.trim().endsWith('()');
  const cleanHook = hookStr.replace(/\(\)$/, '');
  const hookSegments = cleanHook.split('.').filter(Boolean);

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
  let output = '弹性匹配版: ' + flexRegex + '\n';
  if (bestMatch) {
    const smartRegex = buildSmartRegex(bestMatch, keepTail, isCall);
    output += '智能匹配版: ' + smartRegex + '\n示例链:  ' + bestMatch.join('.') + '\n';
  }
  return output;
}

export async function runFromUI() {
  const file = document.getElementById('fileInput').files[0];
  if (!file) { alert('请选择源码文件'); return; }
  const hookStr = document.getElementById('hookInput').value.trim();
  if (!hookStr) { alert('请输入 Hook 字符串'); return; }
  const keepTail = parseInt(document.getElementById('keepInput').value || '2', 10);
  const code = await file.text();
  const result = await run(code, hookStr, keepTail);
  document.getElementById('output').textContent = result;
}

export function copyOutput() {
  const text = document.getElementById('output').textContent.trim();
  if (!text) { alert('暂无结果可复制'); return; }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制到剪贴板');
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.top = '-1000px';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    alert('已复制到剪贴板');
  } catch (e) {
    alert('复制失败');
  }
  document.body.removeChild(ta);
}

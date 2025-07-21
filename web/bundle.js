function copyOutput() {
  const text = document.getElementById("output").textContent.trim();
  if (!text) {
    alert("\u6682\u65E0\u7ED3\u679C\u53EF\u590D\u5236");
    return;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      alert("\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F");
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.top = "-1000px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
    alert("\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F");
  } catch (e) {
    alert("\u590D\u5236\u5931\u8D25");
  }
  document.body.removeChild(ta);
}
  copyOutput,
  const outputEl = document.getElementById("output");
  outputEl.style.color = "inherit";
  outputEl.textContent = "";
  try {
    const code = await file.text();
    const result = await run(code, hookStr, keepTail);
    outputEl.textContent = result;
  } catch (e) {
    console.error(e);
    outputEl.style.color = "red";
    outputEl.textContent = "\u9519\u8BEF: " + (e && e.message ? e.message : e);
  }

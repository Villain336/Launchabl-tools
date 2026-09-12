import { describe, expect, it } from "vitest";
import { annotateEdits, checkCss, checkHtml, checkJson, checkScript, runChecks } from "./checks";
import { makeFile, previewEdits } from "./workspace";

describe("static checks", () => {
  it("finds JSON syntax errors with a line", () => {
    expect(checkJson("a.json", '{"a": 1}')).toEqual([]);
    const [problem] = checkJson("a.json", '{\n  "a": 1,\n  "b": }\n');
    expect(problem.severity).toBe("error");
    expect(problem.line).toBe(3);
  });
  it("parses modules and scripts, reporting the line of a syntax error", () => {
    expect(checkScript("a.js", "import x from 'y';\nexport const a = await x();\n")).toEqual([]);
    expect(checkScript("b.cjs", "const a = require('x');\nmodule.exports = a;\n")).toEqual([]);
    const [problem] = checkScript("c.js", "const a = 1;\nfunction (\n");
    expect(problem.line).toBe(2);
    expect(problem.message).toMatch(/Unexpected token/);
  });
  it("balances CSS braces ignoring comments and strings", () => {
    expect(checkCss("a.css", 'a { content: "}" } /* } */ b { color: red }')).toEqual([]);
    expect(checkCss("a.css", "a { color: red;\nb { x: y }")[0].message).toMatch(/unclosed/);
  });
  it("checks HTML structure, alt text, duplicate ids, missing local files and inline scripts", () => {
    const files = { "index.html": makeFile("index.html", ""), "css/app.css": makeFile("css/app.css", "") };
    const html = `<!doctype html><html><head><link rel="stylesheet" href="css/app.css"><link rel="stylesheet" href="missing.css"></head>
<body><img src="https://x/y.png"><div id="a"></div><div id="a"></div>
<script>const = 1;</script><script type="module">import x from './x.js'</script></body></html>`;
    const problems = checkHtml("index.html", html, files);
    const messages = problems.map((p) => p.message);
    expect(messages).toEqual(expect.arrayContaining([expect.stringMatching(/No <title>/), expect.stringMatching(/lang/), expect.stringMatching(/viewport/), expect.stringMatching(/without alt/), expect.stringMatching(/Duplicate id "a"/), expect.stringMatching(/Missing file: missing.css/), expect.stringMatching(/Inline script/)]));
    expect(problems.find((p) => p.source === "links")?.line).toBe(1);
    expect(problems.find((p) => p.source === "js")?.line).toBe(3);
    expect(problems.filter((p) => p.source === "js")).toHaveLength(1);
  });
  it("annotates proposed edits against the projected workspace", () => {
    const files = { "index.html": makeFile("index.html", "<html lang='en'><head><title>t</title><meta name='viewport' content='x'><meta name='description' content='d'></head><body></body></html>") };
    const edits = previewEdits(files, [
      { path: "index.html", kind: "patch", find: "<body>", replace: "<body><script src='app.js'></script>" },
      { path: "data.json", kind: "create", content: "{ nope }" },
    ]);
    const annotated = annotateEdits(files, edits);
    expect(annotated[0].problems?.[0].message).toMatch(/Missing file: app.js/);
    expect(annotated[1].problems?.[0].severity).toBe("error");
    const withScript = annotateEdits(files, previewEdits(files, [{ path: "index.html", kind: "patch", find: "<body>", replace: "<body><script src='app.js'></script>" }, { path: "app.js", kind: "create", content: "console.log(1)" }]));
    expect(withScript[0].problems).toBeUndefined();
    expect(runChecks({ ...files, "app.js": makeFile("app.js", "const = 2") }).map((p) => p.path)).toEqual(["app.js"]);
  });
});

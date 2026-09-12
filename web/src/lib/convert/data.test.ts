import { describe, expect, it } from "vitest";
import { convertData, detectFormat, parseDelimited, recordsFromYaml, recordsToYaml, tableFromMarkdown, tableToDelimited } from "./data";

describe("data conversion", () => {
  it("parses quoted CSV with embedded commas, quotes and newlines", () => {
    const rows = parseDelimited('name,note\r\n"Smith, Jane","She said ""hi""\nthen left"\nBob,plain\n');
    expect(rows).toEqual([
      ["name", "note"],
      ["Smith, Jane", 'She said "hi"\nthen left'],
      ["Bob", "plain"],
    ]);
  });

  it("round-trips CSV → JSON → CSV with typed values and quoting", () => {
    const csv = "name,age,active,city\nJane,34,true,\"Austin, TX\"\nBob,,false,Leeds";
    const json = convertData(csv, "csv", "json").output;
    expect(JSON.parse(json)).toEqual([
      { name: "Jane", age: 34, active: true, city: "Austin, TX" },
      { name: "Bob", age: "", active: false, city: "Leeds" },
    ]);
    expect(convertData(json, "json", "csv").output).toBe(csv);
  });

  it("converts to markdown, html, tsv, ndjson and yaml", () => {
    const csv = "sku,price\nA|1,9.5\nB,12";
    expect(convertData(csv, "csv", "markdown").output).toBe("| sku | price |\n| --- | --- |\n| A\\|1 | 9.5 |\n| B | 12 |");
    expect(convertData(csv, "csv", "html").output).toContain("<td>A|1</td>");
    expect(convertData(csv, "csv", "tsv").output).toBe("sku\tprice\nA|1\t9.5\nB\t12");
    expect(convertData(csv, "csv", "ndjson").output).toBe('{"sku":"A|1","price":9.5}\n{"sku":"B","price":12}');
    const yaml = convertData(csv, "csv", "yaml").output;
    expect(yaml).toBe('- sku: "A|1"\n  price: 9.5\n- sku: B\n  price: 12');
    expect(recordsFromYaml(yaml)).toEqual([{ sku: "A|1", price: 9.5 }, { sku: "B", price: 12 }]);
    expect(recordsFromYaml(recordsToYaml([{ a: "hello world", b: null }]))).toEqual([{ a: "hello world", b: null }]);
  });

  it("reads markdown tables back and detects formats", () => {
    const table = tableFromMarkdown("| a | b |\n|---|---|\n| 1 | x |\n");
    expect(tableToDelimited(table)).toBe("a,b\n1,x");
    expect(detectFormat("[{\"a\":1}]")).toBe("json");
    expect(detectFormat('{"a":1}\n{"a":2}')).toBe("ndjson");
    expect(detectFormat("a\tb\n1\t2")).toBe("tsv");
    expect(detectFormat("a,b\n1,2")).toBe("csv");
    expect(detectFormat("| a |\n|---|", "")).toBe("markdown");
    expect(detectFormat("whatever", "data.yml")).toBe("yaml");
  });
});

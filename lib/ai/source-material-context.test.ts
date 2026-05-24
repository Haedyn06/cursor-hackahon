import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSourceMaterialContext,
  type SourceMaterialContextItem,
} from "@/lib/ai/source-material-context";

test("source material context labels and caps supplemental evidence", () => {
  const materials: SourceMaterialContextItem[] = [
    {
      label: "Autofill notes",
      fileName: "notes.txt",
      sourceKind: "autofill",
      inputKind: "paste",
      text: "A".repeat(9000),
    },
    {
      label: "Old resume",
      fileName: "resume.pdf",
      sourceKind: "import",
      inputKind: "upload",
      text: "Built TypeScript dashboards for hiring teams.",
    },
  ];

  const context = buildSourceMaterialContext(materials, {
    maxMaterials: 2,
    maxCharsPerMaterial: 80,
    maxTotalChars: 200,
  });

  assert.match(context, /SOURCE MATERIALS/);
  assert.match(context, /supporting evidence/i);
  assert.match(context, /Autofill notes/);
  assert.match(context, /notes\.txt/);
  assert.match(context, /Built TypeScript dashboards/);
  assert.doesNotMatch(context, /A{81}/);
});

test("source material context is empty when no readable text exists", () => {
  assert.equal(
    buildSourceMaterialContext([
      {
        label: "Screenshot",
        fileName: "profile.png",
        sourceKind: "autofill",
        inputKind: "upload",
        text: "",
      },
    ]),
    "",
  );
});

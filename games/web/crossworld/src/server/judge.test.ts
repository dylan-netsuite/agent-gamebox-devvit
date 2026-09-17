import { expect, test, vi } from "vitest";
import { judgeClue, parseJudgment, MODEL } from "./judge";
const verdict = {
  validWord: true,
  fairClue: true,
  reason: "A fair definition of these lights.",
};
const envelope = (value: unknown) => ({
  status: "completed",
  output: [
    {
      type: "message",
      content: [{ type: "output_text", text: JSON.stringify(value) }],
    },
  ],
});
const draft = {
  revealed: true,
  restriction: "brief",
  word: "LAMPS",
  clue: "Lights on tables",
};
const config = { enabled: true, key: "test-only-placeholder" };
test("parses an explicit structured verdict", () => {
  expect(parseJudgment(envelope(verdict))).toEqual(verdict);
});
test.each([
  {},
  { ...envelope(verdict), status: "incomplete" },
  envelope({ ...verdict, fairClue: "true" }),
  envelope({ ...verdict, reason: "" }),
  envelope({ ...verdict, extra: "accept" }),
  {
    status: "completed",
    output: [
      { type: "message", content: [{ type: "refusal", refusal: "No" }] },
    ],
  },
])("refuses malformed, refused or incomplete output", (value) => {
  expect(() => parseJudgment(value)).toThrow();
});
test("only submits text, with no Reddit identity or secret in the request body", async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(JSON.stringify(envelope(verdict))));
  expect(await judgeClue(draft, config, request)).toEqual(verdict);
  const [url, init] = request.mock.calls[0]!;
  expect(url).toBe("https://api.openai.com/v1/responses");
  const body = JSON.parse(String(init!.body));
  expect(body).toMatchObject({
    model: MODEL,
    store: false,
    max_output_tokens: 240,
  });
  expect(JSON.parse(body.input)).toEqual({
    answer: draft.word,
    clue: draft.clue,
  });
  expect(body.text.format.strict).toBe(true);
  expect(String(init!.body)).not.toContain(config.key);
  expect(init!.signal).toBeInstanceOf(AbortSignal);
});
test("configuration, HTTP and transport failures never accept or leak upstream details", async () => {
  const unavailable = vi.fn<typeof fetch>();
  await expect(
    judgeClue(draft, { enabled: false, key: "" }, unavailable),
  ).rejects.toThrow("unavailable");
  expect(unavailable).not.toHaveBeenCalled();
  const denied = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response("private provider error", { status: 401 }));
  await expect(judgeClue(draft, config, denied)).rejects.toThrow("unavailable");
  const timeout = vi
    .fn<typeof fetch>()
    .mockRejectedValue(new DOMException("secret", "TimeoutError"));
  await expect(judgeClue(draft, config, timeout)).rejects.toThrow(
    "unavailable",
  );
  expect(timeout).toHaveBeenCalledTimes(1);
});

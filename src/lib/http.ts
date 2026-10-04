import { NextResponse } from "next/server";
import { ZodError } from "zod";
export function fail(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: error.issues
          .map((i) => `${i.path.join(".") || "Input"}: ${i.message}`)
          .join("; "),
      },
      { status: 400 },
    );
  const e = error as { code?: string; cause?: { code?: string } };
  const code = e?.cause?.code ?? e?.code;
  if (code === "42P01" || code === "42703")
    return NextResponse.json(
      {
        error:
          "The database needs the latest migration before this feature can save data.",
      },
      { status: 503 },
    );
  if (code === "23505")
    return NextResponse.json(
      { error: "This record already exists. Refresh and try again." },
      { status: 409 },
    );
  if (code)
    return NextResponse.json(
      { error: "Could not save or load your data. Please try again." },
      { status: 503 },
    );
  const message = error instanceof Error ? error.message : "Internal error";
  if (message.startsWith("Failed query:"))
    return NextResponse.json(
      { error: "Could not connect to your data. Please try again." },
      { status: 503 },
    );
  return NextResponse.json(
    { error: message === "UNAUTHORIZED" ? "Sign in required" : message },
    {
      status:
        message === "UNAUTHORIZED" ? 401 : message === "NOT_FOUND" ? 404 : 400,
    },
  );
}

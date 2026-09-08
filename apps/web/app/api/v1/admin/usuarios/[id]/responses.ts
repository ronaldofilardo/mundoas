import { NextResponse } from "next/server";

export function successResponse(
  data: any,
  status = 200,
) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  message: string,
  status = 400,
) {
  return NextResponse.json({ error: message }, { status });
}

export function notFoundResponse(
  message: string,
) {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function badRequestResponse(
  message: string,
) {
  return NextResponse.json({ error: message }, { status: 400 });
}
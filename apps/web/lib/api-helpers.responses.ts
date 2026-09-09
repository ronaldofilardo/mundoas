import { NextResponse } from "next/server";

export function ok(data: unknown) {
  return NextResponse.json(data);
}

export function created(data: unknown) {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function notFound(message: string = "Não encontrado") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function forbidden() {
  return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
}

export function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}
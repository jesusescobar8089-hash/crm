import type { NextRequest } from 'next/server'
import { rejectUnauthenticated } from '@/lib/auth-guard'
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const unauthorized = await rejectUnauthenticated(request)
  if (unauthorized) return unauthorized

  return NextResponse.json({ message: "Hello, world!" });
}
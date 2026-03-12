import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { message: 'Public repository placeholder. Category proxy logic was removed.' },
    { status: 501 },
  );
}

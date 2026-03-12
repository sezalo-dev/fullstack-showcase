import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { message: 'Public repository placeholder. Messaging proxy logic was removed.' },
    { status: 501 },
  );
}

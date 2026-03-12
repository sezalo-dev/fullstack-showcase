import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      message: 'Public repository placeholder. Auth callback logic is not included in this version.',
    },
    { status: 501 },
  );
}

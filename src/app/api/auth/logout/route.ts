import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Optionally notify express backend
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/logout`, {
      method: 'POST',
    }).catch((err) => console.error('Express logout error:', err));

    const cookieStore = await cookies();
    cookieStore.delete('token');
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

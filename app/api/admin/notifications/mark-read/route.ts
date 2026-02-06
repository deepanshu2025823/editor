import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  try {
    const db = await pool.getConnection();

    await db.query("UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE");

    db.release();

    return NextResponse.json({ success: true, message: "All notifications marked as read" });

  } catch (error: any) {
    console.error("Mark Read Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
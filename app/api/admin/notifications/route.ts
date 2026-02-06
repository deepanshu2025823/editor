import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const db = await pool.getConnection();
    
    const [rows]: any = await db.query(`
      SELECT id, type, message, is_read, created_at 
      FROM notifications 
      ORDER BY created_at DESC 
      LIMIT 20
    `);
    
    db.release();

    const notifications = rows.map((n: any) => ({
        id: n.id,
        type: n.type || 'info',
        message: n.message,
        read: !!n.is_read, 
        created_at: n.created_at
    }));

    return NextResponse.json(notifications);

  } catch (error: any) {
    console.error("Notification Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
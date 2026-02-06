import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = await pool.getConnection();
    const [rows] = await db.query(
      `SELECT date, check_in, check_out, status, productivity_score 
       FROM attendance_logs 
       WHERE employee_id = ? 
       ORDER BY date DESC LIMIT 7`,
      [params.id]
    );
    db.release();
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
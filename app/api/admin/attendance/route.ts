import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const db = await pool.getConnection();
    
    const query = `
      SELECT 
        e.employee_id, 
        e.full_name, 
        e.designation, 
        a.check_in, 
        a.check_out, 
        a.status, 
        a.productivity_score,
        TIMEDIFF(IFNULL(a.check_out, NOW()), a.check_in) as duration
      FROM employees e
      LEFT JOIN attendance_logs a ON e.employee_id = a.employee_id AND a.date = CURRENT_DATE
      WHERE e.status = 'active'
    `;
    
    const [rows] = await db.query(query);
    db.release();

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
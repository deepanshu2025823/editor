import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { project_id, title, priority, assigned_to, due_date } = await req.json();
    const db = await pool.getConnection();
    await db.query(
        "INSERT INTO tasks (project_id, title, priority, assigned_to, due_date) VALUES (?, ?, ?, ?, ?)", 
        [project_id, title, priority, assigned_to, due_date]
    );
    db.release();
    return NextResponse.json({ message: "Task created" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
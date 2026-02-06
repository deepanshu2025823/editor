import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const db = await pool.getConnection();
    
    const [projects]: any = await db.query("SELECT * FROM projects ORDER BY created_at DESC");
    
    for (let project of projects) {
        const [tasks]: any = await db.query("SELECT * FROM tasks WHERE project_id = ?", [project.id]);
        project.tasks = tasks;
    }

    db.release();
    return NextResponse.json(projects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, description, deadline } = await req.json();
    const db = await pool.getConnection();
    await db.query("INSERT INTO projects (name, description, deadline) VALUES (?, ?, ?)", [name, description, deadline]);
    db.release();
    return NextResponse.json({ message: "Project created" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
    try {
        const { taskId, status } = await req.json();
        const db = await pool.getConnection();
        await db.query("UPDATE tasks SET status = ? WHERE id = ?", [status, taskId]);
        db.release();
        return NextResponse.json({ message: "Task updated" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
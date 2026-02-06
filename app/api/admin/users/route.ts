import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const db = await pool.getConnection();
    const [rows] = await db.query('SELECT * FROM employees ORDER BY created_at DESC');
    db.release();
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, full_name, email, designation, department, status, profile_photo } = body;
    
    const db = await pool.getConnection();
    
    await db.query(
        `UPDATE employees SET 
            full_name = COALESCE(?, full_name),
            email = COALESCE(?, email),
            designation = COALESCE(?, designation),
            department = COALESCE(?, department),
            status = COALESCE(?, status),
            profile_photo = COALESCE(?, profile_photo)
         WHERE id = ?`, 
        [full_name, email, designation, department, status, profile_photo, id]
    );
    db.release();

    return NextResponse.json({ message: "User updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const db = await pool.getConnection();

        await db.query('DELETE FROM employees WHERE id = ?', [id]);
        db.release();

        return NextResponse.json({ message: "Employee terminated." });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { full_name, email, designation, department, password, profile_photo } = await req.json();
        const employee_id = 'EMP-' + Math.floor(10000000 + Math.random() * 90000000);
        
        const db = await pool.getConnection();
        await db.query(
            `INSERT INTO employees (employee_id, full_name, email, designation, department, password, status, profile_photo) 
             VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
            [employee_id, full_name, email, designation, department, password, profile_photo]
        );
        db.release();

        return NextResponse.json({ message: "Employee added successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
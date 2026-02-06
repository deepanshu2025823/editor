import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendEmail } from '@/lib/email';

function generateEmployeeId() {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `EMP-${timestamp}${random}`;
}

export async function POST(req: Request) {
  try {
    const { action, full_name, email, password, designation, profile_photo } = await req.json();
    const db = await pool.getConnection();

    if (action === 'signup') {
      const [existing]: any = await db.query('SELECT id FROM employees WHERE email = ?', [email]);
      if (existing.length > 0) {
        db.release();
        return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
      }

      const newEmployeeId = generateEmployeeId();

      await db.query(
        'INSERT INTO employees (employee_id, full_name, email, password, designation, profile_photo, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [newEmployeeId, full_name, email, password, designation, profile_photo || null, 'pending']
      );
      
      db.release();

      await sendEmail(
        process.env.SMTP_USER!,
        `🚨 New Employee Registration: ${full_name}`,
        `
        <h3>New Access Request</h3>
        <p><strong>Name:</strong> ${full_name}</p>
        <p><strong>Generated ID:</strong> ${newEmployeeId}</p>
        <p><strong>Role:</strong> ${designation}</p>
        <p><strong>Status:</strong> <span style="color:orange">Pending Approval</span></p>
        `
      );

      await sendEmail(
        email,
        `Registration Received - Enterprise OS`,
        `<h3>Hello ${full_name},</h3><p>Your Employee ID is <strong>${newEmployeeId}</strong>. Your account is PENDING APPROVAL.</p>`
      );

      return NextResponse.json({ message: 'Signup successful! Wait for approval email.' });
    }

    if (action === 'login') {
        const [users]: any = await db.query('SELECT * FROM employees WHERE email = ? AND password = ?', [email, password]);
        db.release();
  
        if (users.length === 0) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        const user = users[0];
        if (user.status === 'pending') return NextResponse.json({ error: 'Account pending approval.' }, { status: 403 });
        if (user.status === 'rejected') return NextResponse.json({ error: 'Access Denied.' }, { status: 403 });
  
        return NextResponse.json({ message: 'Login successful', user });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
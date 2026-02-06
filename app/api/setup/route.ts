import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const db = await pool.getConnection();
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(50) UNIQUE NOT NULL, 
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        designation VARCHAR(50),
        department VARCHAR(50),
        profile_photo LONGTEXT, 
        password VARCHAR(255) NOT NULL,
        status ENUM('pending', 'active', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'owner',
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        two_factor_secret VARCHAR(100) DEFAULT NULL,
        preferences JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
        await db.query("ALTER TABLE admins ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE");
    } catch (e) { /* Ignore if exists */ }

    try {
        await db.query("ALTER TABLE admins ADD COLUMN two_factor_secret VARCHAR(100) DEFAULT NULL");
    } catch (e) { /* Ignore if exists */ }

    try {
        await db.query("ALTER TABLE admins ADD COLUMN preferences JSON DEFAULT NULL");
    } catch (e) { /* Ignore if exists */ }

    await db.query(`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        check_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        check_out TIMESTAMP NULL,
        status ENUM('Working', 'Idle', 'Offline') DEFAULT 'Working',
        productivity_score INT DEFAULT 100,
        date DATE DEFAULT (CURRENT_DATE),
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        status ENUM('active', 'completed', 'archived') DEFAULT 'active',
        deadline DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT,
        title VARCHAR(200) NOT NULL,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        status ENUM('todo', 'in_progress', 'review', 'done') DEFAULT 'todo',
        assigned_to VARCHAR(50), 
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) DEFAULT 'info',
        message VARCHAR(255) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [existing]: any = await db.query("SELECT * FROM admins WHERE email = 'mr.deepanshujoshi@gmail.com'");
    if (existing.length === 0) {
      await db.query(`
        INSERT INTO admins (username, email, password, role) 
        VALUES ('Super Admin', 'mr.deepanshujoshi@gmail.com', '1234567890', 'owner')
      `);
    }

    const [notifCount]: any = await db.query("SELECT COUNT(*) as count FROM notifications");
    if (notifCount[0].count === 0) {
        await db.query(`
            INSERT INTO notifications (type, message) 
            VALUES ('info', 'System Setup Complete! Welcome to the Admin Panel.')
        `);
    }

    db.release();

    return NextResponse.json({ 
      message: "Setup Complete! All tables (including Notifications) are synced." 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
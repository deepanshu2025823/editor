import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import QRCode from 'qrcode';

let authenticator: any;

const loadAuthenticator = () => {
    if (authenticator) return authenticator;
    try {
        const otplib = require('otplib');
        if (otplib.authenticator) return (authenticator = otplib.authenticator);
        if (otplib.default?.authenticator) return (authenticator = otplib.default.authenticator);
        if (otplib.default) return (authenticator = otplib.default);
        return (authenticator = otplib);
    } catch (err) {
        console.error("OTPLIB Load Error:", err);
        return null;
    }
};

export async function GET() {
  try {
    const db = await pool.getConnection();
    const [rows]: any = await db.query("SELECT id, username, email, role, two_factor_enabled, preferences FROM admins LIMIT 1");
    db.release();
    
    if(rows.length === 0) return NextResponse.json({ error: "No admin found" }, { status: 404 });
    
    const admin = rows[0];
    
    if (admin.preferences) {
        if (typeof admin.preferences === 'string') {
            try {
                admin.preferences = JSON.parse(admin.preferences);
            } catch (e) {
                admin.preferences = { emailAlerts: true, systemSounds: false };
            }
        }
    } else {
        admin.preferences = { emailAlerts: true, systemSounds: false };
    }
    
    admin.two_factor_enabled = !!admin.two_factor_enabled;

    return NextResponse.json(admin);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
    try {
        const { username } = await req.json();
        
        const auth = loadAuthenticator();
        if (!auth) {
            throw new Error("Authenticator library failed to load.");
        }

        const secret = auth.generateSecret();

        const accountName = encodeURIComponent(username || 'Admin');
        const issuer = encodeURIComponent('Enterprise_OS');
        const otpauth = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

        const imageUrl = await QRCode.toDataURL(otpauth);

        return NextResponse.json({ secret, imageUrl });
    } catch (error: any) {
        console.error("2FA Gen Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, type } = body; 
    
    if (!id) return NextResponse.json({ error: "Admin ID required" }, { status: 400 });

    const db = await pool.getConnection();

    if (type === 'profile') {
        await db.query("UPDATE admins SET username = ?, email = ? WHERE id = ?", [body.username, body.email, id]);
    } 
    else if (type === 'password') {
        await db.query("UPDATE admins SET password = ? WHERE id = ?", [body.newPassword, id]);
    } 
    else if (type === 'verify-2fa') {
        const auth = loadAuthenticator();
        if (!auth) throw new Error("Authenticator library failed to load.");
        
        const isValid = auth.check ? auth.check(body.token, body.secret) : auth.verify({ token: body.token, secret: body.secret });
        
        if (isValid) {
            await db.query("UPDATE admins SET two_factor_enabled = 1, two_factor_secret = ? WHERE id = ?", [body.secret, id]);
        } else {
            db.release();
            return NextResponse.json({ error: "Invalid OTP Code" }, { status: 400 });
        }
    }
    else if (type === 'disable-2fa') {
        await db.query("UPDATE admins SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?", [id]);
    }
    else if (type === 'system') {
        const prefs = JSON.stringify(body.preferences);
        await db.query("UPDATE admins SET preferences = ? WHERE id = ?", [prefs, id]);
    }
    else if (type === 'danger-attendance') {
        await db.query("TRUNCATE TABLE attendance_logs");
    }
    else if (type === 'danger-chat') {
    }

    db.release();
    return NextResponse.json({ message: "Success" });
  } catch (error: any) {
    console.error("Settings Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
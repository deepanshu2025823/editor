import { NextResponse } from 'next/server';
import pool from '@/lib/db';

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
        console.error("OTPLIB Login Load Error:", err);
        return null;
    }
};

export async function POST(req: Request) {
  try {
    const { email, password, otpCode } = await req.json();
    const db = await pool.getConnection();

    const [admins]: any = await db.query('SELECT * FROM admins WHERE email = ? AND password = ?', [email, password]);
    db.release();

    if (admins.length === 0) {
      return NextResponse.json({ error: 'Invalid Admin Credentials' }, { status: 401 });
    }

    const admin = admins[0];

    if (!!admin.two_factor_enabled) {
        const auth = loadAuthenticator();
        if (!auth) {
             console.error("2FA Lib failed to load during login");
             return NextResponse.json({ error: "Server 2FA Error. Contact Support." }, { status: 500 });
        }

        if (!otpCode) {
            return NextResponse.json({ require2FA: true }, { status: 200 });
        }

        try {
            let isValid = false;
            if (auth.check) isValid = auth.check(otpCode, admin.two_factor_secret);
            else if (auth.verify) isValid = auth.verify({ token: otpCode, secret: admin.two_factor_secret });

            if (!isValid) {
                return NextResponse.json({ error: 'Invalid 2FA Code' }, { status: 401 });
            }
        } catch (err) {
            return NextResponse.json({ error: '2FA Validation Error' }, { status: 401 });
        }
    }

    const { password: _, two_factor_secret: __, ...safeAdmin } = admin; 
    
    return NextResponse.json({ message: 'Welcome Admin', admin: safeAdmin });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
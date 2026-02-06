import { NextResponse } from 'next/server';

const disposableDomains = [
  'mailinator.com', 'trashmail.com', 'temp-mail.org', 'guerrillamail.com', 
  'sharklasers.com', 'yopmail.com', 'getnada.com', 'dispostable.com'
];

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
        return NextResponse.json({ isValid: false, message: "Invalid email format" });
    }

    const domain = email.split('@')[1].toLowerCase();

    if (disposableDomains.includes(domain)) {
      return NextResponse.json({ 
        isValid: false, 
        message: "Alert: Please use a genuine, permanent email address. Disposable emails are not allowed." 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
         return NextResponse.json({ isValid: false, message: "Invalid email format." });
    }

    return NextResponse.json({ isValid: true, message: "Email looks genuine." });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
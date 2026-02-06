'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackgroundTracker from '@/components/employee/BackgroundTracker'; 

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    const empData = localStorage.getItem('employee_user');
    if (!empData) {
        router.push('/employee/login');
    } else {
        setEmployee(JSON.parse(empData));
    }
  }, []);

  if (!employee) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <BackgroundTracker employeeId={employee.employee_id} />
      
      <main>{children}</main>
    </div>
  );
}
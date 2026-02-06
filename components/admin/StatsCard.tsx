export default function StatsCard({ title, value, icon, color, trend }: any) {
    const colors: any = {
        blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        green: 'bg-green-500/10 text-green-500 border-green-500/20',
        orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    };

    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-slate-700 transition duration-300">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
                </div>
                <div className={`p-2 rounded-lg border ${colors[color]}`}>
                    {icon}
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
                <span className="text-green-400 text-xs font-bold bg-green-400/10 px-1.5 py-0.5 rounded">{trend}</span>
                <span className="text-slate-500 text-xs">vs last month</span>
            </div>
        </div>
    );
}
export default function StatisticsCard({ title, value, icon, color }) {
	return (
		<div className="stat-card" style={{ borderLeftColor: color }}>
			<div className="stat-icon" style={{ backgroundColor: `${color}20` }}>
				<i className={`fas fa-${icon}`} style={{ color }}></i>
			</div>
			<div className="stat-content">
				<h4>{title}</h4>
				<p>{value}</p>
			</div>
		</div>
	);
}

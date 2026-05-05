const StatsCard = ({ icon, value, label, colorClass }) => {
  return (
    <div className={`glass-card stat-card ${colorClass}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

export default StatsCard;

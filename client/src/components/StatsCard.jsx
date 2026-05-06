import { useNavigate } from 'react-router-dom';

const StatsCard = ({ icon, value, label, colorClass, filterPath }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (filterPath) {
      navigate(filterPath);
    }
  };

  return (
    <div
      className={`glass-card stat-card ${colorClass}`}
      onClick={handleClick}
      style={{ cursor: filterPath ? 'pointer' : 'default' }}
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

export default StatsCard;

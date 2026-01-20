import React from 'react';
import { Card } from 'react-bootstrap';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, changeType }) => {
  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return <FaArrowUp className="text-success ms-1" />;
      case 'negative':
        return <FaArrowDown className="text-danger ms-1" />;
      default:
        return <FaMinus className="text-muted ms-1" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-danger';
      default:
        return 'text-muted';
    }
  };

  return (
    <Card className="h-100">
      <Card.Body className="d-flex align-items-center">
        <div className="flex-grow-1">
          <div className="d-flex align-items-center mb-2">
            <div className="me-3 fs-2 text-primary">{icon}</div>
            <div>
              <h4 className="mb-0">{value}</h4>
              <small className="text-muted">{title}</small>
            </div>
          </div>
          {change && (
            <div className={`small ${getChangeColor()} d-flex align-items-center`}>
              {change}
              {getChangeIcon()}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default StatCard;
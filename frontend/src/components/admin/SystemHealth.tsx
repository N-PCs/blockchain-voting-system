import React from 'react';
import { Card, ProgressBar, Badge } from 'react-bootstrap';
import { FaServer, FaDatabase, FaNetworkWired, FaMicrochip } from 'react-icons/fa';

interface SystemHealthProps {}

const SystemHealth: React.FC<SystemHealthProps> = () => {
  const services = [
    {
      name: 'Database',
      icon: <FaDatabase className="text-primary" />,
      status: 'online',
      uptime: '99.9%',
    },
    {
      name: 'Blockchain API',
      icon: <FaMicrochip className="text-success" />,
      status: 'online',
      uptime: '99.8%',
    },
    {
      name: 'WebSocket Server',
      icon: <FaNetworkWired className="text-info" />,
      status: 'online',
      uptime: '99.7%',
    },
    {
      name: 'Frontend',
      icon: <FaServer className="text-warning" />,
      status: 'online',
      uptime: '99.5%',
    },
  ];

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">
          <FaServer className="me-2" />
          System Health
        </h5>
      </Card.Header>
      <Card.Body>
        <div className="row">
          {services.map((service, index) => (
            <div key={index} className="col-md-6 mb-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center">
                  {service.icon}
                  <span className="ms-2 fw-medium">{service.name}</span>
                </div>
                <Badge bg={service.status === 'online' ? 'success' : 'danger'}>
                  {service.status}
                </Badge>
              </div>
              <div className="small text-muted mb-1">Uptime: {service.uptime}</div>
              <ProgressBar
                now={parseFloat(service.uptime)}
                className="mb-0"
                style={{ height: '6px' }}
              />
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};

export default SystemHealth;
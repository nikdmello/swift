#!/bin/bash
yum update -y
yum install -y nodejs npm git

# Clone and setup agent
cd /home/ec2-user
git clone https://github.com/nikdmello/swift-protocol.git
cd swift-protocol/agents
npm install

# Set environment variables
echo "NODE_ENV=production" >> /etc/environment
echo "PORT=3003" >> /etc/environment

# Create systemd service
cat > /etc/systemd/system/compute-agent.service << EOF
[Unit]
Description=Swift Compute Agent
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/swift-protocol/agents
Environment=NODE_ENV=production
Environment=PORT=3003
ExecStart=/usr/bin/node compute-agent.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl enable compute-agent
systemctl start compute-agent
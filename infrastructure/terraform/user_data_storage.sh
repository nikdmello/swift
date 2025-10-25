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
echo "PORT=3002" >> /etc/environment

# Create systemd service
cat > /etc/systemd/system/storage-agent.service << EOF
[Unit]
Description=Swift Storage Agent
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/swift-protocol/agents
Environment=NODE_ENV=production
Environment=PORT=3002
ExecStart=/usr/bin/node storage-agent.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl enable storage-agent
systemctl start storage-agent
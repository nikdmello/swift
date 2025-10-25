#!/bin/bash
yum update -y
yum install -y nodejs npm git

# Clone and setup agent
cd /home/ec2-user
git clone https://github.com/nikdmello/swift-protocol.git
cd swift-protocol/agents
npm install

# Set environment variables
echo "HUGGING_FACE_TOKEN=${hugging_face_token}" >> /etc/environment
echo "NODE_ENV=production" >> /etc/environment
echo "PORT=3001" >> /etc/environment

# Create systemd service
cat > /etc/systemd/system/gpu-agent.service << EOF
[Unit]
Description=Swift GPU Agent
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/swift-protocol/agents
Environment=HUGGING_FACE_TOKEN=${hugging_face_token}
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=/usr/bin/node gpu-agent.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl enable gpu-agent
systemctl start gpu-agent
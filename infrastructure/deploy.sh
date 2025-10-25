#!/bin/bash

# Swift Protocol Production Deployment Script

set -e

echo "Deploying Swift Protocol to AWS..."

# Check prerequisites
if ! command -v terraform &> /dev/null; then
    echo "Terraform not found. Installing..."
    brew install terraform
fi

if ! command -v aws &> /dev/null; then
    echo "AWS CLI not found. Please install and configure AWS CLI"
    exit 1
fi

# Set deployment variables
export TF_VAR_aws_region="us-east-1"
export TF_VAR_key_pair_name="${AWS_KEY_PAIR_NAME:-swift-protocol-key}"
export TF_VAR_hugging_face_token="${HUGGING_FACE_TOKEN}"

# Validate environment
if [ -z "$HUGGING_FACE_TOKEN" ]; then
    echo "Error: HUGGING_FACE_TOKEN environment variable required"
    exit 1
fi

# Create key pair if it doesn't exist
if ! aws ec2 describe-key-pairs --key-names $TF_VAR_key_pair_name &> /dev/null; then
    echo "Creating AWS key pair..."
    aws ec2 create-key-pair --key-name $TF_VAR_key_pair_name --query 'KeyMaterial' --output text > ~/.ssh/${TF_VAR_key_pair_name}.pem
    chmod 400 ~/.ssh/${TF_VAR_key_pair_name}.pem
fi

# Deploy infrastructure
cd infrastructure/terraform

echo "Initializing Terraform..."
terraform init

echo "Planning deployment..."
terraform plan

echo "Applying infrastructure..."
terraform apply -auto-approve

# Get outputs
GPU_AGENT_IP=$(terraform output -raw gpu_agent_ip)
STORAGE_AGENT_IP=$(terraform output -raw storage_agent_ip)
COMPUTE_AGENT_IP=$(terraform output -raw compute_agent_ip)
LOAD_BALANCER_DNS=$(terraform output -raw load_balancer_dns)

echo "Deployment completed!"
echo "GPU Agent: http://${GPU_AGENT_IP}:3001"
echo "Storage Agent: http://${STORAGE_AGENT_IP}:3002"
echo "Compute Agent: http://${COMPUTE_AGENT_IP}:3003"
echo "Load Balancer: http://${LOAD_BALANCER_DNS}"

# Update production configuration
cd ../../agents
cat > production.env << EOF
GPU_AGENT_URL=http://${GPU_AGENT_IP}:3001
STORAGE_AGENT_URL=http://${STORAGE_AGENT_IP}:3002
COMPUTE_AGENT_URL=http://${COMPUTE_AGENT_IP}:3003
LOAD_BALANCER_URL=http://${LOAD_BALANCER_DNS}
NODE_ENV=production
EOF

echo "Production environment configured. Run 'source production.env && node production-network.js' to start coordination."
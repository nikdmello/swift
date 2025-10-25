terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC for agent network
resource "aws_vpc" "swift_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "swift-protocol-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "swift_igw" {
  vpc_id = aws_vpc.swift_vpc.id
  
  tags = {
    Name = "swift-protocol-igw"
  }
}

# Public Subnets
resource "aws_subnet" "swift_public_a" {
  vpc_id                  = aws_vpc.swift_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  
  tags = {
    Name = "swift-protocol-public-a"
  }
}

resource "aws_subnet" "swift_public_b" {
  vpc_id                  = aws_vpc.swift_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true
  
  tags = {
    Name = "swift-protocol-public-b"
  }
}

# Route Table
resource "aws_route_table" "swift_public_rt" {
  vpc_id = aws_vpc.swift_vpc.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.swift_igw.id
  }
  
  tags = {
    Name = "swift-protocol-public-rt"
  }
}

resource "aws_route_table_association" "swift_public_rta_a" {
  subnet_id      = aws_subnet.swift_public_a.id
  route_table_id = aws_route_table.swift_public_rt.id
}

resource "aws_route_table_association" "swift_public_rta_b" {
  subnet_id      = aws_subnet.swift_public_b.id
  route_table_id = aws_route_table.swift_public_rt.id
}

# Security Group
resource "aws_security_group" "swift_agents" {
  name_prefix = "swift-agents-"
  vpc_id      = aws_vpc.swift_vpc.id
  
  ingress {
    from_port   = 3001
    to_port     = 3003
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# EC2 Instances for agents
resource "aws_instance" "gpu_agent" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.medium"
  subnet_id     = aws_subnet.swift_public_a.id
  vpc_security_group_ids = [aws_security_group.swift_agents.id]
  key_name      = var.key_pair_name
  
  user_data = base64encode(templatefile("${path.module}/user_data_gpu.sh", {
    hugging_face_token = var.hugging_face_token
  }))
  
  tags = {
    Name = "swift-gpu-agent"
    Type = "gpu-agent"
  }
}

resource "aws_instance" "storage_agent" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.medium"
  subnet_id     = aws_subnet.swift_public_a.id
  vpc_security_group_ids = [aws_security_group.swift_agents.id]
  key_name      = var.key_pair_name
  
  user_data = base64encode(file("${path.module}/user_data_storage.sh"))
  
  tags = {
    Name = "swift-storage-agent"
    Type = "storage-agent"
  }
}

resource "aws_instance" "compute_agent" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.medium"
  subnet_id     = aws_subnet.swift_public_a.id
  vpc_security_group_ids = [aws_security_group.swift_agents.id]
  key_name      = var.key_pair_name
  
  user_data = base64encode(file("${path.module}/user_data_compute.sh"))
  
  tags = {
    Name = "swift-compute-agent"
    Type = "compute-agent"
  }
}

# Load Balancer
resource "aws_lb" "swift_lb" {
  name               = "swift-protocol-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.swift_agents.id]
  subnets            = [aws_subnet.swift_public_a.id, aws_subnet.swift_public_b.id]
}

# Outputs
output "gpu_agent_ip" {
  value = aws_instance.gpu_agent.public_ip
}

output "storage_agent_ip" {
  value = aws_instance.storage_agent.public_ip
}

output "compute_agent_ip" {
  value = aws_instance.compute_agent.public_ip
}

output "load_balancer_dns" {
  value = aws_lb.swift_lb.dns_name
}
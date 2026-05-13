#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# One-time EC2 Instance Setup
# =============================================================================
# Usage: ./scripts/setup-ec2.sh <ec2-ip> [ssh-key-path] [ssh-user]
#
# Run this script ONCE per EC2 instance to install Docker, Node.js, and
# configure basic firewall rules.
#
# Example:
#   ./scripts/setup-ec2.sh 54.123.45.1 ~/.ssh/my-key.pem ec2-user

if [ $# -lt 1 ]; then
  echo "Usage: $0 <ec2-ip> [ssh-key-path] [ssh-user]"
  echo ""
  echo "Arguments:"
  echo "  ec2-ip        Public IP of the EC2 instance"
  echo "  ssh-key-path  Path to your SSH private key (default: ~/.ssh/id_rsa)"
  echo "  ssh-user      SSH username (default: ec2-user)"
  exit 1
fi

EC2_IP=$1
SSH_KEY="${2:-~/.ssh/id_rsa}"
SSH_USER="${3:-ec2-user}"

echo "=== Setting up ${EC2_IP} ==="

ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no "${SSH_USER}@${EC2_IP}" << 'REMOTE'
  set -e

  echo "--- Installing Docker ---"
  if ! command -v docker &>/dev/null; then
    sudo yum update -y
    sudo yum install -y docker
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker ec2-user
    echo "Docker installed"
  else
    echo "Docker already installed"
  fi

  echo "--- Installing Node.js 22 ---"
  if ! command -v node &>/dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
    sudo yum install -y nodejs
    echo "Node.js installed: $(node --version)"
  else
    echo "Node.js already installed: $(node --version)"
  fi

  echo "--- Configuring firewall ---"
  # Allow SSH, HTTP, and the service port range
  sudo iptables -F INPUT 2>/dev/null || true
  sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
  sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
  sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
  sudo iptables -A INPUT -p tcp --dport 8000 -j ACCEPT
  sudo iptables -A INPUT -p tcp --dport 8002 -j ACCEPT
  sudo iptables -A INPUT -p tcp --dport 8003 -j ACCEPT
  sudo iptables -A INPUT -j DROP

  echo "--- Setup complete ---"
  echo "Instance: $(curl -s http://169.254.169.254/latest/meta-data/public-hostname)"
REMOTE

echo "=== ${EC2_IP} setup complete ==="

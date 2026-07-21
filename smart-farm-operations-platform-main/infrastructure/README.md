# Infrastructure

This directory is reserved for Infrastructure as Code (IaC) — Terraform or AWS CDK definitions for staging and production environments.

## Planned Resources (Production)

- **Compute:** EC2 Auto Scaling Group behind Application Load Balancer
- **Database:** RDS PostgreSQL (Multi-AZ) with PostGIS
- **Cache:** ElastiCache Redis
- **Storage:** S3 bucket (media) + S3 bucket (frontend static build)
- **CDN:** CloudFront distribution
- **DNS:** Route 53
- **Secrets:** AWS Secrets Manager

## Current Status

Local development uses `docker-compose.yml` at the project root. IaC will be added when preparing for staging/production deployment (Phase 6).

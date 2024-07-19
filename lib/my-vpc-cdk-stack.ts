import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class MyVpcCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

  // Create a VPC with 2 public subnets, 2 private subnets, and a NAT Gateway in AZ1
    const vpc = new ec2.Vpc(this, 'my-cdk-vpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2, // Ensure it only uses 2 AZs
      subnetConfiguration: [
        {
          name: 'public-subnet-1',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'public-subnet-2',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private-subnet-1',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'private-subnet-2',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      natGateways: 1, // Number of NAT Gateways
    });

    // Ensure the NAT Gateway is created in the first public subnet
    const natGateway = new ec2.CfnNatGateway(this, 'NatGateway', {
      subnetId: vpc.publicSubnets[0].subnetId,
      allocationId: new ec2.CfnEIP(this, 'EIP', {
        domain: 'vpc',
      }).attrAllocationId,
    });

    // Update the Name tag for the VPC
    cdk.Aspects.of(vpc).add(new cdk.Tag('Name', 'my-cdk-vpc'));

    // Update the Name tag for public subnets
    for (const subnet of vpc.publicSubnets) {
      cdk.Aspects.of(subnet).add(
        new cdk.Tag(
          'Name',
          `${vpc.node.id}-${subnet.node.id.replace(/Subnet[0-9]$/, '')}-${subnet.availabilityZone}`,
        ),
      );
    }

    // Update the Name tag for private subnets
    for (const subnet of vpc.privateSubnets) {
      cdk.Aspects.of(subnet).add(
        new cdk.Tag(
          'Name',
          `${vpc.node.id}-${subnet.node.id.replace(/Subnet[0-9]$/, '')}-${subnet.availabilityZone}`,
        ),
      );
    }

    new cdk.CfnOutput(this, 'vpcId', {
      value: vpc.vpcId,
      description: 'The ID of the VPC',
    });
  }
}

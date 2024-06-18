import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface consumerStackProps extends cdk.StackProps {
    vpc: ec2.IVpc;
}

export class consumerStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props: consumerStackProps) {
        super(scope, id, props);

        // Referencing resources in a different stack
        const vpc = props.vpc;
        const SecurityGroup = new ec2.SecurityGroup(this, 'ingressSsh', {
            vpc, // IVpc, cannot set as 'vpc-078543a4d1e26c17d' directly
            allowAllOutbound: true,
        });
        SecurityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(22),
            'allow SSH access from anywhere',
        );

        // Referencing resources in your AWS account
        // const vpc_lookup = ec2.Vpc.fromLookup(this, 'DefaultVpc', {
        //     isDefault: true
        // });
        // const vpc_lookup1 = ec2.Vpc.fromLookup(this, 'otherVPC', {
        //     vpcId: 'vpc-05df396a6d6a756cc'
        // });
        // const SecurityGroup2 = new ec2.SecurityGroup(this, 'lookupSG', {
        //     vpc: vpc_lookup,
        //     allowAllOutbound: true,
        // });
    }
}



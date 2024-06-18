import * as cdk from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import {Construct} from 'constructs';

export interface albProps extends cdk.StackProps {
    readonly acmArnExportPath: string;
}

export class albStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: albProps) {
    super(scope, id, props);
    // const vpc = new ec2.Vpc(this, "VPC", { natGateways:1 });
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', {
        isDefault: true
    });
    const acmArn = ssm.StringParameter.valueForStringParameter(this, props.acmArnExportPath);
    const certificate = acm.Certificate.fromCertificateArn(this, 'acm', acmArn);
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
        vpc,
        vpcSubnets: {
            onePerAz: true,
          },
        internetFacing: true,
        });
        alb.addRedirect();
    const listener = alb.addListener ('Listener',{
        port: 443,
        certificates: [certificate],
        });
        listener.addTargets('Instance', {port: 80});
    }
}
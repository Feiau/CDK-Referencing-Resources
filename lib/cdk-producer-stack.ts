import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ssm from "aws-cdk-lib/aws-ssm";

export interface vpcProps extends cdk.StackProps {
  readonly vpcName: string;
  readonly vpcIdExportPath: string;
}

export class producerStack extends cdk.Stack {   // VPC stack
  public readonly vpc: ec2.IVpc;
  constructor(scope: cdk.App, id: string, props: vpcProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, props.vpcName, {
      maxAzs: 2,
      natGateways: 0,
      enableDnsSupport: false
    });

    // const parameter = new ssm.StringParameter(this, 'vpcIdParameter', {
    //   parameterName: props.vpcIdExportPath,
    //   stringValue: this.vpc.vpcId,
    // });

    // Resolving dependency deadlocks;
    // const vpc_lookup1 = ec2.Vpc.fromLookup(this, 'otherVPC', {
    //   vpcId: 'vpc-05df396a6d6a756cc'
    // });
    // const SecurityGroup2 = new ec2.SecurityGroup(this, 'lookupSG', {
    //   vpc: vpc_lookup1,
    //   allowAllOutbound: true,
    // });

    // Resolution1: manually add Export; Resolution2: addDependency;
    // const exportValueOptions: cdk.ExportValueOptions = {
    //   description: 'description',
    //   name: 'ExportsOutputRefcdkssvpc0714D082FAE8E8AF',
    // };
    // this.exportValue(this.vpc.vpcId, exportValueOptions )
  }
}


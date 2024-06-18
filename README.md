# Topics
1. Referencing resources
   - Referencing resources in a different stack
     - Demo
     - Dependency deadlocks
   - Referencing resources in your AWS account
     - Workaround: SSM parameter 
     - ACM demo

2. Nested Stack (Cross references between parent stack and nested stack)
3. Customizing constructs
   - Using escape hatches
   - Un-escape hatches
   - Raw overrides
   - Custom resources

## Referencing resources 
### WHY  
When configuring resources, you will often have to reference properties of another resource. For example: 

1. Configure ECS resources requiring to refer a ECS cluster. 
2. Configure EC2 instances need to refer VPC and SG resources. 
3. Configure SG need to refer a VPC resource. 

```typescript
const SecurityGroup = new ec2.SecurityGroup(this, 'ingressSsh', {
   vpc, // IVpc, cannot set as 'vpc-078543a4d1e26c17d' directly;
   allowAllOutbound: true,
});
```
### How
You can reference resources in any of the following ways:
1. By passing a resource defined in your CDK app, either in the same stack or in a different one
2. By passing a proxy object referencing a resource defined in your AWS account, created from a unique identifier of the resource (such as an ARN)


## Referencing resources in a different stack 
Reference: https://github.com/aws-6w8hnx/cdk-workshop-cross-stack-reference

1. Create a project and invoke cdk init in an empty directory:
```bash
mkdir my-project
cd my-project
cdk init --language typescript
```

2. Copy files in `lib` and `bin` folders into the corresponding directories in your CDK project. 

- cdk-producer-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ssm from "aws-cdk-lib/aws-ssm";

export interface vpcProps extends cdk.StackProps {
  readonly vpcName: string;
  readonly vpcIdExportPath: string;
}

export class producerStack extends cdk.Stack {   
  public readonly vpc: ec2.IVpc;
  constructor(scope: cdk.App, id: string, props: vpcProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, props.vpcName, {           // VPC stack
      maxAzs: 2,
      natGateways: 0,
      enableDnsSupport: false
    });
  }
}
```

- cdk-consumer-stack.ts
```typescript
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
    }
}
```
3. Deploy the `producerStack` and `consumerStack` stacks: 
```bash
cdk ls
cdk deploy --all
```

4. In this way, if the AWS CDK determines that the resource is in the same environment, but in a different stack, it automatically synthesizes AWS CloudFormation exports in the producing stack and an Fn::ImportValue in the consuming stack to transfer that information from one stack to the other. Check Output in CFN console. 

### Dependency deadlocks
5. Due to the automatical export and import operations, although there is no explicit dependency between the `producerStack` and `consumerStack` stacks, CDK deploy the `producerStack` first. However, removing the use of the shared resource from the consuming stack can cause an unexpected deployment failure. In some scenario, there is another dependency between the two stacks that force them to be deployed in the same order. That means the CloudFormation export is removed from the producing stack because it's no longer needed, but the exported resource is still being used in the consuming stack because its update is not yet deployed. Therefore, deploying the producer stack fails.

6. Remove the use of the shared resource from the consuming stack. 
```typescript
...
export class consumerStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: consumerStackProps) {
        super(scope, id, props);

        // Referencing resources in a different stack
        // const vpc = props.vpc;
        // const SecurityGroup = new ec2.SecurityGroup(this, 'ingressSsh', {
        //     vpc, // IVpc, cannot set as 'vpc-078543a4d1e26c17d' directly
        //     allowAllOutbound: true,
        // });
        // SecurityGroup.addIngressRule(
        //     ec2.Peer.anyIpv4(),
        //     ec2.Port.tcp(22),
        //     'allow SSH access from anywhere',
        // );
    }
}
```

7. In the meantime, to trigger an update in `producerStack` by adding below code: 
```typescript
...
export class producerStack extends cdk.Stack {   
  public readonly vpc: ec2.IVpc;
  constructor(scope: cdk.App, id: string, props: vpcProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, props.vpcName, {          
      maxAzs: 2,
      natGateways: 0,
      enableDnsSupport: false
    });
  }

    // Adding new resource to trigger an update. 
    const vpc_lookup1 = ec2.Vpc.fromLookup(this, 'otherVPC', {
      vpcId: 'vpc-05df396a6d6a756cc'
    });
    const SecurityGroup2 = new ec2.SecurityGroup(this, 'lookupSG', {
      vpc: vpc_lookup1,
      allowAllOutbound: true,
    });

}
```

8. The deploy would be failed with error: 
```bash
Export cdk-producer-stack:ExportsOut***2FAE8E8AF cannot be deleted as it is in use by cdk-consumer-stack
```

9. To break this deadlock, perform one of the following workarounds: 
- Set explicit dependency between the stacks. (But sometimes we actually need the `producerStack` to be updated first.)
```typescript
producer_stack.addDependency(consumer_stack)
```

- Manually add the same export to the producing stack using exactly the same logical ID.
```typescript
const exportValueOptions: cdk.ExportValueOptions = {
  description: 'description',
  name: 'ExportsOutputRefcdkssvpc0714D082FAE8E8AF',
};
this.exportValue(this.vpc.vpcId, exportValueOptions)
```


### Referencing resources in your AWS account
Sometimes we want to use a resource already available in our AWS account but not in our CDK project. You can turn the resource's ARN (or another identifying attribute, or group of attributes) into a proxy object and use it as a Construct in CDK project. 
```typescript
// Construct a proxy for a bucket by its name (must be same account)
s3.Bucket.fromBucketName(this, 'MyBucket', 'my-bucket-name');

// Construct a proxy for a bucket by its full ARN (can be another account)
s3.Bucket.fromBucketArn(this, 'MyBucket', 'arn:aws:s3:::my-bucket-name');

// Construct a proxy for an existing VPC from its attribute(s)
ec2.Vpc.fromVpcAttributes(this, 'MyVpc', {
  vpcId: 'vpc-1234567890abcde',
});
```

1. Refering existed VPC in the defintion of SG. 
```typescript
const vpc_lookup = ec2.Vpc.fromLookup(this, 'DefaultVpc', {
    isDefault: true
});

const vpc_lookup1 = ec2.Vpc.fromLookup(this, 'otherVPC', {
    vpcId: 'vpc-05df396a6d6a756cc'
});

const SecurityGroup2 = new ec2.SecurityGroup(this, 'lookupSG', {
    vpc: vpc_lookup,
    allowAllOutbound: true,
});
```

2. ec2.Vpc construct is complex; Vpc.fromLookup() works only in stacks that are defined with an explicit account and region. Results of Vpc.fromLookup() are cached in the project's cdk.context.json file.
```bash
Error: Cannot retrieve value from context provider vpc-provider since account/region are not specified at the stack level.
```

3. The `fromLookup*()` methods cannot actually import the resources into CDK app. You can refer them but cannot modify them. Also, you cannot do 'Escape Hatches' for those resources. 
```typescript
export class lambdaStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler'
    })
    console.log("=========Created in CDK project============")
    for (const child in hello.node.findAll()) {
      const obj = hello.node.findAll()[child].node.id
      console.log(obj)
    }

    const importedLambda = lambda.Function.fromFunctionName(this, 'function', 'shixiang0714-3-us-east-1-lambda')

    console.log("=========fromLookUp============")
    for (const child in importedLambda.node.findAll()) {
      const obj = importedLambda.node.findAll()[child].node.id
      console.log(obj)
    }
  }
}
```

### Workaround: SSM parameter 
1. Create a SSM parameter to store the value of `vpcId` in `producerStack`. 
```typescript
export class producerStack extends cdk.Stack {   // VPC stack
  public readonly vpc: ec2.IVpc;
  constructor(scope: cdk.App, id: string, props: vpcProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, props.vpcName, {
      maxAzs: 2,
      natGateways: 0,
      enableDnsSupport: false
    });

    const parameter = new ssm.StringParameter(this, 'vpcIdParameter', {
      parameterName: props.vpcIdExportPath,
      stringValue: this.vpc.vpcId,
    });
  }
}
```

2. Use `valueFromLookup` to get the `vpcId` from the parameter
3. Use `fromLookup` to create a proxy object of the VPC and pass to SG. 
```typescript
export class ssmSgStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: securityGourpProps) {
    super(scope, id, props);

    const vpcId = ssm.StringParameter.valueFromLookup(this, props.vpcIdExportPath);

    const ssVpc = ec2.Vpc.fromLookup(this, 'cdk-ss-vpc',{
        vpcId: vpcId,
        });

    const SecurityGroup = new ec2.SecurityGroup(this, 'ssmIgressHttp', {
        vpc: ssVpc,
        allowAllOutbound: true,
        });
    SecurityGroup.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(80),
        'allow HTTP traffic from anywhere',
        );
    }
}
```
4. The value of SSM parameter would be cached in `cdk.context.json` file. Run `cdk context --reset KEY_OR_NUMBER` to remove a context key. If it is a cached value, it will be refreshed on the next `cdk synth`. 
```bash
cdk context --reset "ssm:account=502261777658:parameterName=/cdk/vpc/cross-stacks-reference/vpcId:region=us-east-1"
```

5. See `bin-ACM` and `lib-ACM` folders for another sample `Create stacks and cross stack reference to avoid CloudFormation errors`. 
Reference: https://repost.aws/knowledge-center/cdk-cross-stack-reference

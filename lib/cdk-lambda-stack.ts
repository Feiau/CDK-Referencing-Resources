import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';

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

   
// Turn the resource's ARN into a proxy object
// The external resource does not become a part of your AWS CDK app. 
// Cannot EscapeHatches of proxy object

// Construct a proxy for a bucket by its name (must be same account)
// s3.Bucket.fromBucketName(this, 'MyBucket', 'my-bucket-name');

// Construct a proxy for a bucket by its full ARN (can be another account)
// s3.Bucket.fromBucketArn(this, 'MyBucket', 'arn:aws:s3:::my-bucket-name');

// Construct a proxy for an existing VPC from its attribute(s)
// ec2.Vpc.fromVpcAttributes(this, 'MyVpc', {
//   vpcId: 'vpc-1234567890abcde',
// });
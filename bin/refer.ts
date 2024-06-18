#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { producerStack } from '../lib/cdk-producer-stack';
import { consumerStack } from '../lib/cdk-consumer-stack';
import { ssmSgStack } from '../lib/cdk-consumer-ssm-stack';
import { lambdaStack } from '../lib/cdk-lambda-stack'

const vpcIdSsmtPath = "/cdk/vpc/cross-stacks-reference/vpcId";

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
const app = new cdk.App();

const producer_stack = new producerStack(app, 'cdk-producer-stack', {
  env: env,
  vpcName: 'cdk-ss-vpc',
  vpcIdExportPath: vpcIdSsmtPath,
});

const consumer_stack = new consumerStack(app, 'cdk-consumer-stack', {
  env: env,
  vpc: producer_stack.vpc,
});

// const ssm_consumer_stack = new ssmSgStack(app, 'cdk-consumer-ssm-stack', {
//   env: env,
//   vpcIdExportPath: vpcIdSsmtPath,
// });
// ssm_consumer_stack.addDependency(producer_stack)



// const lambda_stack = new lambdaStack(app, 'cdk-lambda-stack', {
//   env: env,
// });

// producer_stack.addDependency(consumer_stack)
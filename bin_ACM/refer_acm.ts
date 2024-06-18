#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {acmStack} from '../lib/acm-stack';
import {albStack} from '../lib/alb-stack';


const env = {account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION}
const certificateArnSsmPath = "/cdk/acm/cross-stacks-reference/certArn";
const app = new cdk.App();
const acm_stack = new acmStack(app, "cdk-ssm-acm-stack", {
    env: env,
    acmName: "ssm-acm",
    acmArnExportPath: certificateArnSsmPath,
});
const alb_stack = new albStack(app, "cdk-ssm-alb-stack", {
    env: env,
    acmArnExportPath: certificateArnSsmPath,
});
alb_stack.addDependency(acm_stack)
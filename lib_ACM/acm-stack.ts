import * as cdk from 'aws-cdk-lib';
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as ssm from "aws-cdk-lib/aws-ssm";
import {Construct} from 'constructs';

export interface acmProps extends cdk.StackProps {
  readonly acmName: string;
  readonly acmArnExportPath: string;
 }

export class acmStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: acmProps) {
    super(scope, id, props); 
    const cert = new acm.Certificate(this, 'Certificate', {
        domainName: 'feitenga.awsps.myinstance.com',
        validation: acm.CertificateValidation.fromDns(),
    });

    const renew = new acm.Certificate(this, 'renewCertificate', {
      domainName: 'feitenga.awsps.myinstance.com',
      validation: acm.CertificateValidation.fromDns(),
   });

    const parameter = new ssm.StringParameter(this, 'acmArnParameter', {
        parameterName: props.acmArnExportPath,
        // stringValue: cert.certificateArn,
        stringValue: renew.certificateArn,
    });
    }
}
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdaApiGwStack } from '../lib/lambda-apigw-stack';

const app = new cdk.App();

new LambdaApiGwStack(app, 'LambdaApiGwStack', {
  /*
    This stack expects (optionally) the following context values passed at deploy time:
      - domainName: e.g. api.example.com
      - hostedZoneId: the Route53 hosted zone id for example.com
      - zoneName: the hosted zone DNS name (example.com)

    Provide them like:
      cdk deploy -c domainName=api.example.com -c hostedZoneId=Z123... -c zoneName=example.com
  */
});

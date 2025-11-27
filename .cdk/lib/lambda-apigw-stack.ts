import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';

export class LambdaApiGwStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = this.node.tryGetContext('domainName');
    const hostedZoneId = this.node.tryGetContext('hostedZoneId');
    const zoneName = this.node.tryGetContext('zoneName');

    // Build and bundle the .NET project located at ../src/LambdaAPIGatewayV2Practice
    const lambdaCode = lambda.Code.fromAsset(path.join(__dirname, '../../src/LambdaAPIGatewayV2Practice'), {
      bundling: {
        image: cdk.DockerImage.fromRegistry('mcr.microsoft.com/dotnet/sdk:9.0'),
        command: [
          'bash', '-lc',
          'dotnet publish -c Release -o /asset-output'
        ],
        workingDirectory: '/asset-input'
      }
    });

    // NOTE: CDK's Runtime may not yet expose a DOTNET_9 constant. Use DOTNET_6 here as a conservative default.
    // Update the runtime to DOTNET_9 when available in your CDK version if you want the function to use .NET 9.
    const fn = new lambda.Function(this, 'ApiFunction', {
      runtime: lambda.Runtime.DOTNET_6,
      handler: 'LambdaEntryPoint::LambdaAPIGatewayV2Practice.LambdaEntryPoint::FunctionHandlerAsync',
      code: lambdaCode,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30)
    });

    // Create HTTP API with CORS configured
    const api = new apigwv2.HttpApi(this, 'HttpApi', {
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.PATCH,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.OPTIONS,
          apigwv2.CorsHttpMethod.HEAD
        ],
        allowHeaders: ['*']
      }
    });

    // Lambda integration and catch-all route
    const integration = new integrations.LambdaProxyIntegration({ handler: fn });

    api.addRoutes({
      path: '/{proxy+}',
      methods: [apigwv2.HttpMethod.ANY],
      integration
    });

    // If domainName and hosted zone are provided, create certificate, domain, and Route53 record
    if (domainName && hostedZoneId && zoneName) {
      const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
        hostedZoneId: hostedZoneId,
        zoneName: zoneName
      });

      const cert = new certificatemanager.DnsValidatedCertificate(this, 'ApiCertificate', {
        domainName: domainName,
        hostedZone,
        region: this.region
      });

      const domain = new apigwv2.DomainName(this, 'ApiDomain', {
        domainName: domainName,
        certificate: cert
      });

      new apigwv2.ApiMapping(this, 'ApiMapping', {
        api,
        domainName: domain,
        stage: api.defaultStage
      });

      // Create Route53 alias A record to the regional API Gateway domain
      new route53.ARecord(this, 'ApiAliasRecord', {
        zone: hostedZone,
        recordName: domainName,
        target: route53.RecordTarget.fromAlias(new targets.ApiGatewayv2DomainProperties(domain.regionalDomainName!, domain.regionalHostedZoneId!))
      });
    }

    new cdk.CfnOutput(this, 'HttpApiUrl', { value: api.apiEndpoint });
    if (domainName) {
      new cdk.CfnOutput(this, 'CustomDomain', { value: domainName });
    }
  }
}

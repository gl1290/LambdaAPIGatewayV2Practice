# CDK project to expose the Lambda in src/LambdaAPIGatewayV2Practice via an HTTP API (API Gateway v2).

## How to use

1. Install deps
   ```
   cd .cdk
   npm install
   ```

2. Bootstrap (first-time only)
   ```
   npx cdk bootstrap
   ```

3. Synthesize or deploy

- To synthesize without custom domain:
  ```
  npx cdk synth
  ```

- To deploy without custom domain:
  ```
  npx cdk deploy
  ```

- To deploy with a custom domain (recommended for HTTPS on your own domain), supply context values:
  ```
  npx cdk deploy -c domainName=api.example.com -c hostedZoneId=Z123... -c zoneName=example.com
  ```

## Notes
- The CDK uses a Docker bundling step that runs `dotnet publish` with the .NET 9 SDK Docker image to build the Lambda asset from the .NET project at `src/LambdaAPIGatewayV2Practice`.
- CDK's Runtime constant may not yet have DOTNET_9; the stack uses DOTNET_6 as a conservative runtime value — update to DOTNET_9 in `lib/lambda-apigw-stack.ts` when your CDK version supports it.

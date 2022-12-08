import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class DeployStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {


    super(scope, id, props);


    // Build the code and create the lambda
    const lambdaFunction = this.buildAndInstallGOLambda('backend-api', path.join(__dirname, '../../src'), 'main');
    // Create Rest API Gateway in front of the lambda
    //const apiGtw = this.createApiGatewayForLambda("backend-api-endpoint", lambdaFunction, 'Exposed endpoint for your GO lambda API')

    const api = new apigateway.LambdaRestApi(this, 'go-lambda', {
      handler: lambdaFunction,
      description: "Exposed endpoint for your GO lambda API",
      deployOptions: {
        stageName: 'cd .',
      }

    });
  
    // Output the DNS of your API gateway deployment
    new cdk.CfnOutput(this, 'lambda-url', { value: api.url! });

  }

/**
   * buildAndInstallGOLambda build the code and create the lambda
   * @param id - CDK id for this lambda
   * @param lambdaPath - Location of the code
   * @param handler - name of the handler to call for this lambda
   */
 buildAndInstallGOLambda(id: string, lambdaPath: string, handler: string): lambda.Function {
  const environment = {
    CGO_ENABLED: '0',
    GOOS: 'linux',
    GOARCH: 'amd64',
  };
  console.log(lambdaPath);

  return new lambda.Function(this, id, {
    code: lambda.Code.fromAsset(lambdaPath, {
      bundling: {
        image: lambda.Runtime.GO_1_X.bundlingImage,
        user: "root",
        environment,
        command: [
          'bash', '-c', [
            'make vendor',
            'make lambda-build',
          ].join(' && ')
        ]
      },
    }),
    handler,
    runtime: lambda.Runtime.GO_1_X,
    timeout: cdk.Duration.seconds(300),
  });
}


}

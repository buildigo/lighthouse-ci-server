import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import {Platform} from "aws-cdk-lib/aws-ecr-assets"
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecsp from 'aws-cdk-lib/aws-ecs-patterns'
import * as efs from 'aws-cdk-lib/aws-efs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'

export class LighthouseCiServerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.setupLighthouseCiServer()
  }


  setupLighthouseCiServer() {
    const vpc = new ec2.Vpc(this, 'LigthouseServerVPC', {maxAzs: 2})
    const ecsCluster = new ecs.Cluster(this, 'LighthouseServerCluster', {vpc: vpc})
    const fileSystem = new efs.FileSystem(this, 'LighthouseServerFileSystem', {
      vpc: vpc,
      encrypted: true,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING
    })
    fileSystem.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['elasticfilesystem:ClientMount'],
        principals: [new iam.AnyPrincipal()],
        conditions: {
          Bool: {
            'elasticfilesystem:AccessedViaMountTarget': 'true'
          }
        }
      })
    )

    const taskDef = new ecs.FargateTaskDefinition(this, 'LighthouseServerTaskDefinition', {
      memoryLimitMiB: 1024,
      cpu: 512,
      volumes: [
        {
          name: 'data',
          efsVolumeConfiguration: {
            fileSystemId: fileSystem.fileSystemId,
          }
        }
      ]
    })

    const containerDef = new ecs.ContainerDefinition(this, 'LighthouseServerContainer', {
      image: ecs.ContainerImage.fromAsset(process.cwd(), {platform: Platform.LINUX_AMD64}),
      taskDefinition: taskDef,
    })

    containerDef.addMountPoints(
      {
        sourceVolume: 'data',
        containerPath: '/data',
        readOnly: false
      }
    )

    containerDef.addPortMappings({
      containerPort: 9001
    })

    const albFargateService = new ecsp.ApplicationLoadBalancedFargateService(this, 'LighthouseCIServer', {
      cluster: ecsCluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      publicLoadBalancer: true,
    })

    albFargateService.targetGroup.configureHealthCheck({
      path: '/app/',
    });

    albFargateService.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '30')

    // Allow access to EFS from Fargate ECS
    fileSystem.grantRootAccess(albFargateService.taskDefinition.taskRole.grantPrincipal)
    fileSystem.connections.allowDefaultPortFrom(albFargateService.service.connections)

    new cloudfront.Distribution(this, 'LighthouseCloudfront', {
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(albFargateService.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER
      },
    })
  }
}


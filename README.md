# Lighthouse CI Server deployment to AWS using the CDK

This is a simple project that deploys a Lighthouse CI server to AWS using the CDK.

## Architecture

- AWS Fargate for running the server, with an attached file system (EFS) for storing the Lighthouse CI server data (sqlite db).
- The fargate cluster is accessible behind cloudfront for HTTPS.

## Security

This project does not add any security around the Lighthouse CI server! 
The Lighthouse CI server is not protected by any authentication and the application load balancer is publicly accessible to anyone with the link (over HTTP).
Be sure to read the [Security section of the server documentation](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/server.md#Security) to protect your server properly.

## References

- [Lighthouse CI server](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/server.md)
- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html)

## Useful commands

* `npm run deploy`  deploy the stack to your default AWS account/region (.env might be required depending on your aws config)
* `npm run diff`    compare deployed stack with current state

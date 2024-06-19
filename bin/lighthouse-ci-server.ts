#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { LighthouseCiServerStack } from '../lib/lighthouse-ci-server-stack'

const app = new cdk.App()
new LighthouseCiServerStack(app, 'LighthouseCiServerStack', {})
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data, MODEL_ID, analyzeImageFunction } from './data/resource.js';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export const backend = defineBackend({
  auth,
  data,
  analyzeImageFunction,
});

backend.analyzeImageFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: [
      `arn:aws:bedrock:*::foundation-model/${MODEL_ID}`,
    ],
  })
);


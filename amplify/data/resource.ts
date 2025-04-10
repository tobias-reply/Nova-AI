import {
  type ClientSchema,
  a,
  defineData,
  defineFunction,
} from "@aws-amplify/backend";

export const MODEL_ID = "amazon.nova-lite-v1:0";

export const analyzeImageFunction = defineFunction({
  entry: "./analyzeImage.ts",
  environment: {
    MODEL_ID,
  },
});

const schema = a.schema({
  analyzeImage: a
    .query()
    .arguments({ imageBase64: a.string().required() })
    .returns(a.string())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(analyzeImageFunction)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { PipelineStack, PipelineStackProps } from "./lib/pipeline-stack";

const props: PipelineStackProps = {
    git: {
        owner: "TymoteuszGach",
        repository: "aws-cdk-pipeline-example",
        codeStarConnectionSSMParameterName: "/reminder-pipeline/github-connection-arn",
    },
    emailAddressSSMParamName: "/reminder-app/subscriber-email",
};

const app = new cdk.App();

new PipelineStack(app, "ReminderPipelineStack", props);

app.synth();

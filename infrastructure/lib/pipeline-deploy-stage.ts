import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ReminderStack } from "./reminder-stack";

export interface PipelineDeployStageProps extends cdk.StageProps {
    emailAddressSSMParamName: string;
}

export class PipelineDeployStage extends cdk.Stage {
    constructor(scope: Construct, id: string, props: PipelineDeployStageProps) {
        super(scope, id, props);

        new ReminderStack(this, "ReminderStack", {
            emailAddressSSMParamName: props.emailAddressSSMParamName,
        });
    }
}

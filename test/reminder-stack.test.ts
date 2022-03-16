import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { ReminderStack } from "../infrastructure/lib/reminder-stack";

const EMAIL_ADDRESS_SSM_PARAM = "/test/email";

describe("ReminderStack", () => {
    test("contains reminder lambda", () => {
        // Arrange
        const app = new cdk.App();
        const processorStack = new ReminderStack(app, "ReminderStack", {
            emailAddressSSMParamName: EMAIL_ADDRESS_SSM_PARAM,
        });

        // Act
        const template = Template.fromStack(processorStack);

        // Assert
        template.hasResourceProperties("AWS::Lambda::Function", {
            Runtime: "nodejs14.x",
            Environment: {
                Variables: {
                    EMAIL_ADDRESS_SSM_PARAM_NAME: EMAIL_ADDRESS_SSM_PARAM,
                },
            },
        });
    });

    test("contains event rule to trigger the lambda", () => {
        // Arrange
        const app = new cdk.App();
        const processorStack = new ReminderStack(app, "ReminderStack", {
            emailAddressSSMParamName: EMAIL_ADDRESS_SSM_PARAM,
        });

        // Act
        const template = Template.fromStack(processorStack);

        // Assert
        template.hasResourceProperties("AWS::Events::Rule", {
            ScheduleExpression: "cron(0 12 ? * Friday *)",
            State: "ENABLED",
            Targets: [
                {
                    Arn: {
                        "Fn::GetAtt": [Match.stringLikeRegexp("RemindToFillHoursLambda.*"), "Arn"],
                    },
                    RetryPolicy: {
                        MaximumRetryAttempts: 1,
                    },
                },
            ],
        });
    });
});

import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";

export interface ReminderStackProps extends cdk.StackProps {
    emailAddressSSMParamName: string;
}

export class ReminderStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ReminderStackProps) {
        super(scope, id, props);

        const reminderLambda = new nodejs.NodejsFunction(this, "RemindToFillHoursLambda", {
            bundling: {
                minify: true,
            },
            logRetention: RetentionDays.ONE_DAY,
            entry: "application/lambdas/reminder-lambda.ts",
            environment: {
                EMAIL_ADDRESS_SSM_PARAM_NAME: props.emailAddressSSMParamName,
            },
            runtime: lambda.Runtime.NODEJS_14_X,
        });

        const emailFrom = ssm.StringParameter.fromStringParameterAttributes(this, "EmailFromParameter", {
            parameterName: props.emailAddressSSMParamName,
        }).stringValue;

        const ssmGetParamPolicy = this.getSSMParamPolicyStatement();
        const sesPolicyStatement = this.getSESPolicyStatement(emailFrom);

        reminderLambda.addToRolePolicy(ssmGetParamPolicy);
        reminderLambda.addToRolePolicy(sesPolicyStatement);

        const ruleDescription =
            "This rule is responsible for sending an email reminder to fill hours in the time-tracking system";

        const rule = new events.Rule(this, "RemindToFillHoursRule", {
            description: ruleDescription,
            schedule: events.Schedule.cron({
                weekDay: "Friday",
                hour: "12",
                minute: "0",
            }),
        });

        rule.addTarget(
            new targets.LambdaFunction(reminderLambda, {
                retryAttempts: 1,
            })
        );
    }

    private getSSMParamPolicyStatement(): iam.PolicyStatement {
        const ssmParameterArn = this.formatArn({
            service: "ssm",
            resource: "parameter",
            resourceName: "reminder-app/*",
        });

        return new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["ssm:GetParameter"],
            resources: [ssmParameterArn],
        });
    }

    private getSESPolicyStatement(emailFrom: string): iam.PolicyStatement {
        return new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["ses:SendEmail", "ses:SendRawEmail", "ses:SendTemplatedEmail"],
            resources: [`arn:aws:ses:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:identity/${emailFrom}`],
        });
    }
}

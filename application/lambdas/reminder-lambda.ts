import * as ssm from "@aws-sdk/client-ssm";
import * as ses from "@aws-sdk/client-sesv2";
import { ScheduledHandler } from "aws-lambda";

const DEFAULT_SUBJECT = "Please fill hours in the time-tracking system";

const emailAddressSSMParamName = process.env.EMAIL_ADDRESS_SSM_PARAM_NAME;
const ssmClient = new ssm.SSMClient({});
const sesClient = new ses.SESv2Client({});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handler: ScheduledHandler = async (event) => {
    const email = await getRecipientEmailAddress();
    const message = buildMessage();
    console.log(`Sending an email to: ${email}`);
    await sendReminder(email, message);
};

async function getRecipientEmailAddress(): Promise<string> {
    const input: ssm.GetParameterCommandInput = { Name: emailAddressSSMParamName };
    const command = new ssm.GetParameterCommand(input);
    const parameter = await ssmClient.send(command);
    const email = parameter.Parameter?.Value;
    if (!email) {
        throw new Error("SSM parameter with recipient email not found");
    }
    return email;
}

function buildMessage(): string {
    return `Please fill time report for the current week`;
}

async function sendReminder(email: string, body: string, subject = DEFAULT_SUBJECT): Promise<void> {
    const input: ses.SendEmailCommandInput = {
        FromEmailAddress: email,
        Content: {
            Simple: {
                Subject: {
                    Data: subject,
                },
                Body: {
                    Text: {
                        Data: body,
                    },
                },
            },
        },
        Destination: {
            ToAddresses: [email],
        },
    };
    const command = new ses.SendEmailCommand(input);
    await sesClient.send(command);
}

exports.handler = handler;

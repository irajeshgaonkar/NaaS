import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import type { TriggerRequest } from '../../../packages/shared/src/types.js';

const eventBridge = new EventBridgeClient({});

export const publishRuleTriggerEvent = async (input: {
  busName: string;
  teamId: string;
  ruleName?: string;
  ruleId?: string;
  payload: TriggerRequest;
}) => {
  await eventBridge.send(
    new PutEventsCommand({
      Entries: [
        {
          EventBusName: input.busName,
          Source: 'naas.api',
          DetailType: 'naas.rule.trigger',
          Detail: JSON.stringify({
            teamId: input.teamId,
            ruleName: input.ruleName,
            ruleId: input.ruleId,
            ...input.payload,
          }),
        },
      ],
    }),
  );
};

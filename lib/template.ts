import { SessionConfig } from "@/types";
import { randomUUID } from "crypto";
const template = {
  userId: 'u_123',
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "multi_tool_agent",
  sessionId: randomUUID() as string,
  state: {
    health_assessment_status: 'not_started',
    hipaa_accepted: '',
    health_assessment: '',
    last_assesment_question: ''
  }
};
const templateSessionConfig:SessionConfig = {...template,state:JSON.stringify(template.state)}
export {template,templateSessionConfig}
export type TemplateType = typeof template; 
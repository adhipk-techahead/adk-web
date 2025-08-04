
import { SessionConfig } from "@/types";

const template = {
  userId: 'u_123',
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "multi_tool_agent",
  sessionId: crypto.randomUUID() as string,
  state: {
    health_assessment_status: 'not_started',
    hipaa_accepted: '',
    health_assessment: '',
    last_assesment_question: '',
    health_interests:""
  }
};
const templateSessionConfig:SessionConfig = {...template,state:JSON.stringify(template.state)}
export {template,templateSessionConfig}
export type TemplateType = typeof template; 